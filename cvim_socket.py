#!/usr/bin/env python3

# USAGE: ./cvim_socket.py
# If you want to use native Vim to edit text boxes 
# you must be running this script. To begin editing,
# press <C-i> inside a text box. By default, this
# script will spawn a urxvt shell, but this action 
# can be changed via the COMMAND variable below.

import http.server
import subprocess
import stat
import os

PORT_NUMBER = 8001
TMP_FILE = "/tmp/cvim-tmp"
TMP_SCRIPT_FILE = "/tmp/cvim-tmp-script.sh"

# For some reason, we must run the script from a separate file
# when using urxvt... it seems to work fine without the script
# if I use xterm, but I like urxvt better.
SCRIPT_COMMAND = "vim $1"
# So essentially, the command below turns into:
#   urxvt -e sh -c 'vim $TMP_FILE'
COMMAND = "urxvt -e " + TMP_SCRIPT_FILE + " {}"

def cleanup():
    os.remove(TMP_SCRIPT_FILE)

class cvimHandler(http.server.BaseHTTPRequestHandler):
    def do_HEAD(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
    def do_POST(self):
        content_length = int(self.headers["Content-Length"])
        post_body = self.rfile.read(content_length).decode("utf8")
        with open(TMP_FILE, "w") as tmp_file:
            tmp_file.write(post_body)
        proc = subprocess.Popen(COMMAND.format(TMP_FILE).split())
        proc.wait()
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        with open(TMP_FILE, "r") as tmp_file:
            self.wfile.write(bytes(tmp_file.read(), "utf8"))
        os.remove(TMP_FILE)

if __name__ == '__main__':
    script = open(TMP_SCRIPT_FILE, "w")
    script.write(SCRIPT_COMMAND)
    script.close()
    script_permissions = os.stat(TMP_SCRIPT_FILE)
    os.chmod(TMP_SCRIPT_FILE, script_permissions.st_mode | stat.S_IEXEC)
    try:
        server_class = http.server.HTTPServer
        httpd = server_class(('', PORT_NUMBER), cvimHandler)
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    cleanup()
    httpd.server_close()
