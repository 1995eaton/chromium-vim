#!/usr/bin/python3

'''
USAGE: ./cvim_server.py
If you want to use native Vim to edit text boxes
you must be running this script. To begin editing,
first map the editWithVim (e.g. "imap <C-o> editWithVim") mapping.
By default, this script will spawn a gvim ("gvim -f"), but this action
can be changed by setting the VIM_COMMAND variable below
'''

import os
import sys
import shlex
from json import loads
import subprocess
from tempfile import mkstemp
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = 8001
VIM_COMMAND = 'gvim -f'

def edit_file(content):
    fd, fn = mkstemp(suffix='.txt', prefix='cvim-', text=True)
    os.write(fd, content.encode('utf8'))
    os.close(fd)
    subprocess.Popen(shlex.split(VIM_COMMAND) + [fn]).wait()
    text = None
    with open(fn, 'r') as f:
        text = f.read()
    os.unlink(fn)
    return text


class CvimServer(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers['Content-Length'])
        content_str = self.rfile.read(length).decode('utf8')
        content = loads(content_str)
        self.send_response(200)
        self.send_header('Content-Type', 'text/plain')
        self.end_headers()

        # Block XMLHttpRequests originating from non-Chrome extensions
        if not self.headers.get('Origin', '').startswith('chrome-extension'):
            edit = ''
        else:
            edit = edit_file(content['data'])

        self.wfile.write(edit.encode('utf8'))


def init_server(server_class=HTTPServer, handler_class=BaseHTTPRequestHandler):
    server_address = ('127.0.0.1', PORT)
    httpd = server_class(server_address, CvimServer)
    httpd.serve_forever()

try:
    init_server()
except KeyboardInterrupt:
    pass
