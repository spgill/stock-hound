import datetime
import json

import mongoengine as me


class ReminderTicket(me.Document):
    closed = me.BooleanField(default=False)
    completed = me.BooleanField(default=False)
    created = me.DateTimeField()
    origin = me.StringField()
    address = me.StringField()
    productType = me.StringField()
    productId = me.StringField()
    article = me.StringField()
    country = me.StringField(default="us")
    location = me.StringField()


class LogEntry(me.Document):
    """Entries logging user activity"""

    time = me.DateTimeField()
    ticket = me.ReferenceField(ReminderTicket)
    text = me.StringField()


def log(tick, text):
    LogEntry(
        time=datetime.datetime.now(),
        ticket=tick,
        text=text,
    ).save()


# Load the json list of stores
with open("./data/corpus.json", "r") as handle:
    corpus = json.load(handle)
