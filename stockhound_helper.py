import json

import flask
import werkzeug


def api_response(payload, error, message, code, headers):
    """Construct an standard API response and and return it."""
    body = json.dumps({
        'payload': payload,
        'error': error,
        'message': message
    })
    headers['Content-Type'] = 'application/json'
    return flask.make_response((body, code, headers))


def api_success(payload=None, message="", code=200, headers={}):
    """Return a successful API response."""
    return api_response(payload, False, message, code, headers)


def api_error(payload=None, message="", code=400, headers={}):
    """Return an API error response, and halt execution."""
    response = api_response(payload, True, message, code, headers)
    raise werkzeug.exceptions.HTTPException(response=response)
