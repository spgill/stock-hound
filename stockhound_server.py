import datetime
import os
import re
import secrets

import flask
from flask_mongoengine import MongoEngine

# Initialize the app
app = flask.Flask(__name__, static_folder='public', static_url_path='')
app.config['DEBUG'] = os.environ.get('DEBUG', False)
app.config['MAX_CONTENT_LENGTH'] = 20 * 1024 * 1024  # 20 megabytes, fyi
app.config['MONGODB_SETTINGS'] = {
    'host': os.environ.get('MONGODB_URI', None),
}


# Index redirect
@app.route('/')
def index_redirect():
    return flask.redirect('/html/index.html')
