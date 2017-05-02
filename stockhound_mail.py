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


def send_template(to, subject, template, context={}):
    context.update({
        'format': lambda s: f'{s[-8:-5]}.{s[-5:-2]}.{s[-2:]}',
        'store_name': model.store_name,
        'date': lambda d: d.strftime('%x'),
        'host': lambda: os.environ['PUBLIC_HOST'],
        'link': lambda s: f'<strong><a href="http://www.ikea.com/us/en/search/?query={s}">{s[-8:-5]}.{s[-5:-2]}.{s[-2:]}</a></strong>'
    })
    send(
        to=to,
        subject=subject,
        body=jinja2.Template(
            open(f'./public/html/template/{template}.html', 'rb').read().decode()
        ).render(**context)
    )
