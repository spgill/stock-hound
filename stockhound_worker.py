import datetime
import sys
import time

import stockhound_mail as mail
import stockhound_model as model
import stockhound_server as server  # noqa: F401
import stockhound_util as util


if __name__ == "__main__":
    # Simulation mode for debugging purposes
    simulation = len(sys.argv) > 1 and sys.argv[1] == "simulation"
    if simulation:
        print("SIMULATION!!!")

        # for ticket in model.ReminderTicket.objects:
        #     if ticket.article:
        #         article = ticket.article
        #         if article.lower().startswith("s"):
        #             ticket.productType = "SPR"
        #             ticket.productId = article[1:]
        #         else:
        #             ticket.productType = "ART"
        #             ticket.productId = article
        #         del ticket.article
        #         ticket.save()

    print("Stockhound worker starting...")

    # Iterate through the two support countries
    for countryCode in model.ReminderTicket.objects(closed=False).distinct(
        "country"
    ):
        if simulation:
            print("COUNTRY", countryCode)

        # Gather all of the article numbers of active tickets in this country
        productIds = model.ReminderTicket.objects(
            closed=False, country=countryCode
        ).distinct("productId")
        if simulation:
            print("    PRODUCT IDS", productIds)

        # Fetch stock levels for all of the product ID's
        time.sleep(1)  # Prevent API spamming
        stockLevels = util.getStockInfo(countryCode, productIds)

        # If the stock info function returns None, that means there's a problem
        # with the IKEA API client id. Abort execution.
        if stockLevels is None:
            print(
                "ERROR!! The IKEA API client ID is invalid! (env var IKEA_CLIENT_ID)"
            )
            exit(1)

        # Iterate through tickets that are looking at this country
        for ticket in model.ReminderTicket.objects(
            closed=False, country=countryCode
        ):
            if simulation:
                print(
                    "        TICKET",
                    ticket.id,
                    ticket.country,
                    ticket.location,
                    ticket.productId,
                )

            # Check if the ticket has expired
            age = datetime.datetime.utcnow() - ticket.created
            if simulation:
                print("            AGE", age)
            if age > datetime.timedelta(days=90):
                ticket.closed = True
                if not simulation:
                    model.log(ticket, "expired")
                    ticket.save()

                print(f"{ticket.id} expired")
                continue

            # Determine the stock level for this ticket's product at this
            # ticket's chose location. If the product ID isn't in the stock
            # level dict, then it's likely an error.
            if not stockLevels.get(ticket.productId, None):
                continue
            productStockLevel = stockLevels[ticket.productId].get(
                ticket.location, None
            )
            if simulation:
                print("            STOCK", productStockLevel)

            # If the stock at this location is not present (unlikely)
            # OR the stock level is unknown, this (likely) means the product
            # has been discontinued. If this is the case, send an email to
            # the user and close their ticket.
            if (
                productStockLevel is None
                or productStockLevel is util.StockLevel.UNKNOWN
            ):
                # Close out the ticket
                ticket.closed = True
                ticket.completed = False

                if not simulation:
                    model.log(ticket, "discontinued")

                    # Send the bad news :(
                    mail.send_template(
                        to=ticket.address,
                        subject="Your product has been discontinued",
                        template="discontinued",
                        context={
                            "ticket": ticket,
                        },
                    )

                    # Save the ticket after the email API in case it fails
                    ticket.save()

                print(f"{ticket.id} was discontinued")

            # If the stock level is above none, notify the user and
            # close out the ticket.
            elif util.stockAvailable(productStockLevel):
                # Close out the ticket
                ticket.closed = True
                ticket.completed = True

                if not simulation:
                    model.log(ticket, "fulfilled")

                    # Send the email notification
                    mail.send_template(
                        to=ticket.address,
                        subject="Your product is in stock!",
                        template="notify",
                        context={
                            "ticket": ticket,
                            "level": util.stockLevelLabels[productStockLevel],
                        },
                    )

                    # Save the ticket after the email API in case it fails
                    ticket.save()

                print(f"{ticket.id} was fulfilled")

    print("Stockhound worker done!")
