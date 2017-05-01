import json

import mongoengine as me


class ReminderTicket(me.Document):
    closed = me.BooleanField(default=False)
    completed = me.BooleanField(default=False)
    created = me.DateTimeField()
    origin = me.StringField()
    address = me.StringField()
    article = me.StringField()
    location = me.StringField()


store_list = json.load(open('./public/json/store_list.json', 'r'))

def store_name(code):
    for store in store_list:
        if store[1] == code:
            return store[0]
