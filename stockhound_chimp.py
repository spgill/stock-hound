import datetime
import html
import re
import requests
import xml.etree.ElementTree

import stockhound_mail as mail
import stockhound_model as model
import stockhound_server as server


def get_stock(country, product_no):
    stocklist = {}
    lang = model.corpus[country]['language']
    url = f'http://www.ikea.com/{country}/{lang}/iows/catalog/availability/{product_no}'
    response = requests.get(url)
    root = xml.etree.ElementTree.fromstring(response.text)
    for store in root.findall('.//localStore'):
        code = store.attrib['buCode']
        level = store.find('./stock/inStockProbabilityCode')
        if level is None:
            stocklist[code] = 'UNKNOWN'
        else:
            stocklist[code] = level.text
    return stocklist


if __name__ == '__main__':

    print('Starting stock chimp')
    # model.log(None, 'Worker started...')

    # Iterate through the two support countries
    for countryCode in model.corpus.keys():

        # Iterate through the article numbers of active tickets
        for article in model.ReminderTicket.objects(closed=False, country=countryCode).distinct('article'):

            # Get the stock levels for the article number
            stock_levels = get_stock(countryCode, article)

            # Iterate through tickets that are looking at the particular article
            for ticket in model.ReminderTicket.objects(closed=False, country=countryCode, article=article):

                # Check if the ticket has expired
                age = datetime.datetime.now() - ticket.created
                print('AGE', age)
                if age > datetime.timedelta(days=31):
                    ticket.closed = True
                    ticket.save()

                    model.log(
                        ticket,
                        f'{ticket.address} had a ticket expire'
                    )

                    print(f'Ticket "{ticket.id}" by "{ticket.address}" expired')
                    continue

                # If the stock_levels dict is EMPTY, that means the product has
                #   been removed from the IKEA catalog. In this instance, send an
                #   email to the user and close their ticket.
                if not any(stock_levels):

                    # Close out the ticket
                    ticket.closed = True
                    ticket.completed = False
                    ticket.save()

                    model.log(
                        ticket,
                        f'{ticket.address} had a ticket discontinue'
                    )

                    # Send the bad news :(
                    mail.send_template(
                        to=ticket.address,
                        subject='Your product has been discontinued',
                        template='discontinued',
                        context={
                            'ticket': ticket,
                        }
                    )

                    # We can skip this ticket now
                    print(f'Ticket "{ticket.id}" by "{ticket.address}" was cancelled')
                    continue

                # If the stock level is above low, notify the user
                level = stock_levels[ticket.location]
                if level in ['MEDIUM', 'HIGH']:

                    # Close out the ticket
                    ticket.closed = True
                    ticket.completed = True
                    ticket.save()

                    model.log(
                        ticket,
                        f'{ticket.address} had a ticket successfully complete'
                    )

                    # Send the email notification
                    mail.send_template(
                        to=ticket.address,
                        subject='Your product is in stock!',
                        template='notify',
                        context={
                            'ticket': ticket,
                            'level': level,
                        }
                    )

                    print(f'Ticket "{ticket.id}" by "{ticket.address}" was fulfilled')

    print('Stock chimp has run out of bananas')
    # model.log(None, 'Worker stopped')
