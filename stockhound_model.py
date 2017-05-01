import mongoengine as me


class ReminderTicket(me.Document):
    closed = me.BooleanField(default=False)
    completed = me.BooleanField(default=False)
    created = me.DateTimeField()
    origin = me.StringField()
    address = me.StringField()
    article = me.StringField()
    location = me.StringField()
