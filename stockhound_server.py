import datetime
import functools
import os
import re
import secrets

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


def get_article(s):
    if re.match(r'^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$', s):
        return re.search(r'products/(S?\d{8})/?', s).group(1)

    match = re.match(r'^(\d{3})\W?(\d{3})\W?(\d{2})$', s)

    if match:
        return ''.join(match.groups())

    return False

def check_auth(username, password):
    """This function is called to check if a username /
    password combination is valid.
    """
    return username == 'guest' and password == 'secret'

def authenticate():
    """Sends a 401 response that enables basic auth"""
    return flask.Response(
    'Could not verify your access level for that URL.\n'
    'You have to login with proper credentials', 401,
    {'WWW-Authenticate': 'Basic realm="Login Required"'})

def requires_auth(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        auth = flask.request.authorization
        if not auth or not check_auth(auth.username, auth.password):
            return authenticate()
        return f(*args, **kwargs)
    return decorated


# Index redirect
@app.route('/')
@requires_auth
def index_redirect():
    return flask.redirect('/html/index.html')


# Submit reminders
@app.route('/submit', methods=['POST'])
def stockhound_submit():
    # Extract all the form args
    form = flask.request.get_json()

    # Verify the other form arguments
    articleno = get_article(form['product'])
    if not articleno:
        helper.api_error(message='Malformed article number or product URL.')

    form['address'] = form['address'].lower()
    if not re.match(r'^([A-z0-9_\.-]+)@([\dA-z\.-]+)\.([A-z\.]{2,6})$', form['address']):
        helper.api_error(message='Invalid email address.')

    # Check that it's a valid article number (also ensures it isn't one of the new style numbers)
    query = requests.get(f'http://www.ikea.com/us/en/search/?query={articleno}')
    if not query.history:
        helper.api_error(message='Article number or product does not appear to exist.')
    else:
        articleno = re.search(r'products/(S?\d{8})/?', query.url).group(1)

    # Make sure they don't have a reminder for the same product
    if model.ReminderTicket.objects(closed=False, address=form['address'], article=articleno):
        helper.api_error(message='You already have a reminder for this product.')

    # Make sure they haven't hit their limit
    if not form['confirm'] and len(model.ReminderTicket.objects(closed=False, address=form['address'])) >= 5:
        return helper.api_success(
            payload='confirm',
            message='You have reached your limit of 5 reminders. If you continue, your oldest reminder will be terminated. Continue?'
        )

    # If they confirm, delete the oldest ticket
    oldest = None
    if form['confirm']:
        oldest = model.ReminderTicket.objects(closed=False, address=form['address']).order_by('created').first()
        oldest.closed = True
        oldest.save()

    # Next, verify the captcha
    recaptcha = requests.post(
        url='https://www.google.com/recaptcha/api/siteverify',
        data={
            'secret': app.config['RECAPTCHA_SECRET'],
            'response': form['recaptcha']
        }
    ).json()
    if not recaptcha['success']:
        helper.api_error(message='Problem with reCAPTCHA verification. Please try again.')

    # Lastly, create and insert a new ticket
    ticket = model.ReminderTicket(
        created=datetime.datetime.utcnow(),
        origin=flask.request.access_route[-1],
        address=form['address'],
        article=articleno,
        location=form['location']
    )
    ticket.save()

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

    # Return success image
    return helper.api_success(payload=articleno, message='Reminder successfully created. Check your email inbox for verification.')


@app.route('/terminate/<ticket_id>')
def stockhound_terminate(ticket_id):
    """Deactivate reminders when people click the link in their email"""
    try:
        ticket = model.ReminderTicket.objects(id=ticket_id).get()
        ticket.closed = True
        ticket.save()
    except db.DoesNotExist:
        return 'Reminder not found. You must have clicked an invalid link.'
    return 'Your reminder has been terminated. You will no longer receive emails for this reminder.'
