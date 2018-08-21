import datetime
import os
import re

import flask
from flask_mongoengine import MongoEngine
import requests

import stockhound_helper as helper
import stockhound_mail as mail
import stockhound_model as model

# Initialize the app
app = flask.Flask(__name__, static_folder='public', static_url_path='')
app.config['DEBUG'] = os.environ.get('DEBUG', False)
app.config['MAX_CONTENT_LENGTH'] = 20 * 1024 * 1024  # 20 megabytes, fyi
app.config['MONGODB_SETTINGS'] = {
    'host': os.environ.get('MONGODB_URI', None),
}
app.config['RECAPTCHA_SECRET'] = os.environ.get('RECAPTCHA_SECRET')

# Setup the db interface
db = MongoEngine(app)

# URL root
root = 'https://www.ikea.com'


def parse_article(form):
    match = None

    # If given a product URL, parse it for an article
    if re.match(
        r'^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$',
        form
    ):
        match = re.search(r'products/(S?\d{8})/?', form)

    # Else, parse it as a plaintext article number
    else:
        match = re.match(r'^(\d{3})\W?(\d{3})\W?(\d{2})$', form)

    # If a match is found, return it
    if match:
        return ''.join(match.groups())

    # Else return a negative
    return False


def resolve_article(countryCode, languageCode, product):
    """Resolve form parsed article number to a VALID article number"""
    # Try to directly load the product page
    resp = requests.get(
        f'{root}/{countryCode}/{languageCode}/catalog/products/{product}/',
    )

    # If it's a 404, try prefixing it with an 'S'
    if resp.status_code == 404 and not product.startswith('S'):
        return resolve_article(countryCode, languageCode, 'S' + product)

    # Else it just doesn't exist
    if resp.status_code == 404:
        return False

    # The artcile number is juuuuuuuust right
    return product


# Index redirect
@app.route('/')
def index_redirect():
    return flask.redirect('/index.html')


@app.route('/key')
def stockhound_key():
    return os.environ.get('RECAPTCHA_KEY')


@app.route('/submitfake', methods=['POST'])
def sdfsdfsdf():
    form = flask.request.get_json()
    if form.get('confirm', False):
        return helper.api_success()
    return helper.api_success(payload='confirm')


# Submit reminders
@app.route('/submit', methods=['POST'])
def stockhound_submit():
    # Extract all the form args
    form = flask.request.get_json()

    # Verify the other form arguments
    articleno = parse_article(form['product'])
    if not articleno:
        helper.api_error(message='Malformed article number or product URL.')

    form['address'] = form['address'].lower()
    if not re.match(
        r'^([A-z0-9_\.-]+)@([\dA-z\.-]+)\.([A-z\.]{2,6})$',
        form['address']
    ):
        helper.api_error(message='Invalid email address.')

    # Now we need the country code too
    country = form['country']
    lang = model.corpus[country]['language']

    # Check that it's a valid article number
    # (also ensures it isn't one of the new style numbers)
#     query = requests.get(f'http://www.ikea.com/{country}/{lang}/\
# search/?query={articleno}')

#     else:
#         match = re.search(r'products/(S?\d{8})/?', query.url)
#         if match:
#             articleno = match.group(1)

    # Check the inputted article number for validity
    resolved = resolve_article(country, lang, articleno)
    # return f'break! "{resolved}"'
    if not resolved:
        helper.api_error(
            message='Article number or product does not appear to exist.'
        )

    # Make sure they don't have a reminder for the same product
    if model.ReminderTicket.objects(
        closed=False,
        address=form['address'],
        article=resolved
    ):
        helper.api_error(
            message='You already have an active reminder for this product.'
        )

    # Make sure they haven't hit their limit
    if not form['confirm'] and len(model.ReminderTicket.objects(
        closed=False,
        address=form['address']
    )) >= 5:
        return helper.api_success(
            payload='confirm',
            message='You have reached your limit of 5 reminders. If \
you continue, your oldest reminder will be terminated.'
        )

    # If they confirm, delete the oldest ticket
    oldest = None
    if form['confirm']:
        oldest = model.ReminderTicket.objects(
            closed=False,
            address=form['address']
        ).order_by('created').first()
        oldest.closed = True
        oldest.save()

        model.log(oldest, f'{oldest.address} closed ticket on confirmation')

    # Next, verify the captcha
    recaptcha = requests.post(
        url='https://www.google.com/recaptcha/api/siteverify',
        data={
            'secret': app.config['RECAPTCHA_SECRET'],
            'response': form['recaptcha']
        }
    ).json()

    if recaptcha['score'] < 0.5:
        helper.api_error(message='Failed reCAPTCHA verification.')

    # Lastly, create and insert a new ticket
    ticket = model.ReminderTicket(
        created=datetime.datetime.utcnow(),
        origin=flask.request.access_route[-1],
        address=form['address'],
        article=resolved,
        country=country,
        location=form['location']
    )
    ticket.save()

    model.log(ticket, f'{ticket.address} created new ticket')

    # Send the creation email
    mail.send_template(
        to=ticket.address,
        subject='New Reminder Created',
        template='create',
        context={
            'ticket': ticket,
            'erased': oldest
        }
    )

    # Return success message
    return helper.api_success(payload=resolved)


@app.route('/terminate/<ticket_id>')
def stockhound_terminate(ticket_id):
    """Deactivate reminders when people click the link in their email"""
    try:
        ticket = model.ReminderTicket.objects(id=ticket_id).get()
        ticket.closed = True
        ticket.save()

        model.log(ticket, 'Ticket terminated by email link')
    except db.DoesNotExist:
        return 'Reminder not found. You must have clicked an inactive link.'
    return 'Your reminder has been terminated! \
You will no longer receive emails for this reminder.'
