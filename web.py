#! /usr/bin/python3
"""
Basically just a wrapper that loads the main flask up and
runs it under a gevent WSGI server, to provide better performance than
the builtin development server.
"""

import os

from gevent.wsgi import WSGIServer
from werkzeug.serving import run_simple

from stockhound_server import app


def run_gevent(host, port):
    message = 'Starting gevent production server on {0}:{1} ...'
    print(message.format(host, port))

    server = WSGIServer((host, port), app)
    server.serve_forever()


def run_werkzeug(host, port):
    message = 'Starting Werkzeug development server on {0}:{1} ...'
    print(message.format(host, port))
    run_simple(host, port, app, use_reloader=True, use_debugger=True)


def main():
    """Run the selected web server backend"""
    host = '0.0.0.0'
    port = int(os.environ.get("PORT", 8080))
    server_name = os.environ.get('PYTHONSERVER', 'werkzeug').lower()

    if server_name == 'gevent':
        run_gevent(host, port)
    elif server_name == 'werkzeug':
        run_werkzeug(host, port)
    else:
        raise RuntimeError(server_name + ' is not a valid backend...')


if __name__ == "__main__":
    main()
