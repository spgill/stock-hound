import os
import re

import jinja2
import requests

import stockhound_model as model

FROM_TITLE = 'Stöck Høund'
API_KEY = os.environ['MAILGUN_API_KEY']
API_DOMAIN = os.environ['MAILGUN_DOMAIN']


def send(to, subject, body):
    """Send an email through the mailgun HTTP api."""
    requests.post(
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
    return model.corpus[tick.country]['stores'][tick.location]['label']


def article_text(tick):
    return f'{tick.article[-8:-5]}.{tick.article[-5:-2]}.{tick.article[-2:]}'


def article_url(tick):
    lang = model.corpus[tick.country]['language']
    return f'http://www.ikea.com/{tick.country}/{lang}/\
catalog/products/{tick.article}/'


def article_info(tick):
    # First, get the product URL
    url = article_url(tick)

    # Make the request to the site
    req = requests.get(url)
    content = req.content.decode()

    # If it fails with a 404, then the product doesn't exist
    if req.status_code == 404:
        return False

    # We're looking for a specific list of meta tags in the page HTML
    results = {}
    tags = [
        'title',
        'product_name',
        'price',
        'og:image',
    ]

    # Iterate through each tag and regex the value
    for tag in tags:
        pattern = r'<meta (?:name|property)="' + tag + r'" content="(.*?)"'
        match = re.search(pattern, content)

        # Store the match, else False
        if match:
            results[tag] = match.group(1)
        else:
            results[tag] = False

    # If 'title' was found, we need to process it some more
    if results['title']:
        results['title'] = re.sub(r'- IKEA$', '', results['title']).strip()

    # We're done here
    return results


def send_template(to, subject, template, context={}):
    context.update({
        'format': lambda s: f'{s[-8:-5]}.{s[-5:-2]}.{s[-2:]}',
        'store_name': store_name,
        'date': lambda d: d.created.strftime('%x'),
        'host': lambda: os.environ['PUBLIC_HOST'],
        'url': article_url,
        'article': article_text,
        'info': None if 'ticket' not in context
        else article_info(context['ticket']),
    })
    send(
        to=to,
        subject=subject,
        body=jinja2.Template(
            open(f'./templates/{template}.html', 'r').read()
        ).render(**context)
    )


if __name__ == '__main__':
    class Dumb:
        country = 'us'
        article = 'S99193603'

    print('RESULT', article_info(Dumb()))
