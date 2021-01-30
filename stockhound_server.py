import datetime
import os
import re

import flask
from flask_mongoengine import MongoEngine
import requests

import stockhound_util as util
import stockhound_mail as mail
import stockhound_model as model

# Initialize the app
app = flask.Flask(__name__, static_folder="public", static_url_path="")
app.config["DEBUG"] = os.environ.get("DEBUG", False)
app.config["MAX_CONTENT_LENGTH"] = 20 * 1024 * 1024  # 20 megabytes, fyi
app.config["MONGODB_SETTINGS"] = {
    "host": os.environ.get("MONGODB_URI", None),
}
app.config["RECAPTCHA_SECRET"] = os.environ.get("RECAPTCHA_SECRET")

# Setup the db interface
db = MongoEngine(app)

# URL root
root = "https://www.ikea.com"


def parse_article(form):
    match = None

    # If given a product URL, parse it for an article
    if re.match(
        r"^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$", form
    ):
        match = re.search(r"(S?\d{8})/?", form)

    # Else, parse it as a plaintext article number
    else:
        match = re.match(r"^(\d{3})\W?(\d{3})\W?(\d{2})$", form)

    # If a match is found, return it
    if match:
        return "".join(match.groups())

    # Else return a negative
    return False


def resolve_article(localSite, articleNo):
    """Resolve form parsed article number to a VALID article number"""
    # Try to directly load the product page
    resp = requests.get(
        f"{localSite}catalog/products/{articleNo}/",
    )

    # If it's a 404, try prefixing it with an 'S'
    if resp.status_code == 404 and not articleNo.startswith("S"):
        return resolve_article(localSite, "S" + articleNo)

    # Else it just doesn't exist
    if resp.status_code == 404:
        return False

    # The article number is juuuuuuuust right
    return articleNo


# Index redirect
@app.route("/")
def index_redirect():
    return flask.redirect("/index.html")


@app.route("/api/key")
def stockhound_key():
    return os.environ.get("RECAPTCHA_KEY")


@app.route("/api/corpus")
def stockhound_corpus():
    return model.corpus


# Submit reminders
@app.route("/api/submit", methods=["POST"])
def stockhound_submit():
    # Extract and normalize fields from the request data
    form = flask.request.get_json()
    emailAddress = form.get("address", "").lower()
    productId = form.get("product", "").lower()
    countryCode = form.get("country", "").lower()
    locationCode = form.get("location", "").lower()
    recaptchaToken = form.get("recaptcha", "")
    confirmation = form.get("confirm", False)

    # First, verify the captcha token
    recaptcha = requests.post(
        url="https://www.google.com/recaptcha/api/siteverify",
        data={
            "secret": app.config["RECAPTCHA_SECRET"],
            "response": recaptchaToken,
        },
    ).json()
    if recaptcha["score"] < 0.5:
        util.api_error(message="Failed reCAPTCHA verification.")

    # Parse and validate the article number / url syntax
    productId = parse_article(productId)
    if not productId:
        util.api_error(message="Invalid article number or product URL.")

    # Validate the email address
    if not re.match(
        r"^([A-z0-9_\.-]+)@([\dA-z\.-]+)\.([A-z\.]{2,6})$", emailAddress
    ):
        util.api_error(message="Invalid email address.")

    # Verify that the article number exists (and determine its type)
    productType, productId = util.validateProductId(countryCode, productId)
    if not productId:
        util.api_error(
            message="Product does not appear to exist in the selected market."
        )

    # Make sure they don't have a reminder for the same product
    if model.ReminderTicket.objects(
        closed=False,
        address=emailAddress,
        productId=productId,
        country=countryCode,
        location=locationCode,
    ):
        util.api_error(
            message="You already have an active reminder for this product."
        )

    # Make sure they haven't hit their active reminder limit
    if (
        not confirmation
        and len(
            model.ReminderTicket.objects(closed=False, address=emailAddress)
        )
        >= 5
    ):
        return util.api_success(
            payload="confirm",
            message="You have reached your limit of 5 reminders. If \
you continue, your oldest reminder will be terminated.",
        )

    # If they confirm, delete the oldest ticket
    oldest = None
    if form["confirm"]:
        oldest = (
            model.ReminderTicket.objects(closed=False, address=emailAddress)
            .order_by("created")
            .first()
        )
        oldest.closed = True
        oldest.save()

        model.log(oldest, f"{oldest.address} closed ticket on confirmation")

    print(
        "STOCK LEVEL",
        util.getStockInfo(
            countryCode, ["70480483", "29332382", "70460927", "70238541"]
        ),
    )
    return util.api_success()
    # Finally, create and insert a new ticket
    ticket = model.ReminderTicket(
        created=datetime.datetime.utcnow(),
        origin=flask.request.access_route[-1],
        address=emailAddress,
        productType=productType.value,
        productId=productId,
        country=countryCode,
        location=locationCode,
    )
    ticket.save()

    model.log(ticket, f"{emailAddress} created new ticket")

    # Send the creation email
    mail.send_template(
        to=ticket.address,
        subject="New Reminder Created",
        template="create",
        context={"ticket": ticket, "erased": oldest},
    )

    # Return success message
    return util.api_success(payload=productId)


@app.route("/api/terminate/<ticket_id>")
def stockhound_terminate(ticket_id):
    """Deactivate reminders when people click the link in their email"""
    try:
        ticket = model.ReminderTicket.objects(id=ticket_id, closed=False).get()
        ticket.closed = True
        ticket.save()

        model.log(ticket, "Ticket terminated by email link")
    except db.DoesNotExist:
        return "Reminder not found. You may clicked an inactive link."
    return "Your reminder has been terminated! \
You will no longer receive emails for this reminder."


@app.route("/api/convert")
def sh_convert():
    for ticket in model.ReminderTicket.objects:
        if ticket.article:
            article = ticket.article
            if article.lower().startswith("s"):
                ticket.productType = "SPR"
                ticket.productId = article[1:]
            else:
                ticket.productType = "ART"
                ticket.productId = article
            # del ticket.article
            ticket.save()

    return "Done"
