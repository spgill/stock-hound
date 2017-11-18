import json

import mongoengine as me


class ReminderTicket(me.Document):
    closed = me.BooleanField(default=False)
    completed = me.BooleanField(default=False)
    created = me.DateTimeField()
    origin = me.StringField()
    address = me.StringField()
    article = me.StringField()
    country = me.StringField(default='us')
    location = me.StringField()


# Load the json list of stores
store_list = json.load(open('./data/store_list.json', 'r'))
