import os

import jinja2
import requests

import stockhound_model as model


API_KEY = os.environ['MAILGUN_API_KEY']
API_DOMAIN = os.environ['MAILGUN_DOMAIN']


def send(to, subject, body):
    """Send an email through the mailgun HTTP api."""
    response = requests.post(
        url=f'https://api.mailgun.net/v3/{API_DOMAIN}/messages',
        auth=('api', API_KEY),
        data={
            'from': f'Stöck Høund <donotreply@{API_DOMAIN}>',
            'to': to,
            'subject': subject,
            'html': body
        }
    )


def send_template(to, subject, template, context={}):
    context.update({
        'format': lambda s: f'{s[-8:-5]}.{s[-5:-2]}.{s[-2:]}',
        'store_name': model.store_name,
        'date': lambda d: d.strftime('%x')
    })
    send(
        to=to,
        subject=subject,
        body=jinja2.Template(
            open(f'./public/html/template/{template}.html', 'rb').read().decode()
        ).render(**context)
    )
