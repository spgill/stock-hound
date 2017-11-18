import os

import jinja2
import requests

import stockhound_model as model

FROM_TITLE = 'Stöck Høund'
API_KEY = os.environ['MAILGUN_API_KEY']
API_DOMAIN = os.environ['MAILGUN_DOMAIN']


def send(to, subject, body):
    """Send an email through the mailgun HTTP api."""
    response = requests.post(
        url=f'https://api.mailgun.net/v3/{API_DOMAIN}/messages',
        auth=('api', API_KEY),
        data={
            'from': f'{FROM_TITLE} <donotreply@{API_DOMAIN}>',
            'to': to,
            'subject': subject,
            'html': body
        }
    )


def store_name(tick):
    """Resolve a ticket to its store's name."""
    for name, code in model.store_list[tick.country].items():
        if code == tick.location:
            return name


def ticket_link(tick):
    """Create a URL to a ticket's article."""
    text = f'{tick.article[-8:-5]}.{tick.article[-5:-2]}.{tick.article[-2:]}'
    return f'<strong><a href="http://www.ikea.com/{tick.country}/en/search/?query={tick.article}">{text}</a></strong>'


def send_template(to, subject, template, context={}):
    context.update({
        'format': lambda s: f'{s[-8:-5]}.{s[-5:-2]}.{s[-2:]}',
        'store_name': store_name,
        'date': lambda d: d.created.strftime('%x'),
        'host': lambda: os.environ['PUBLIC_HOST'],
        'link': ticket_link,
    })
    send(
        to=to,
        subject=subject,
        body=jinja2.Template(
            open(f'./templates/{template}.html', 'r').read()
        ).render(**context)
    )
