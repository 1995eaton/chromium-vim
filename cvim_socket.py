#!/usr/bin/env python3

"""
USAGE: ./cvim_socket.py
If you want to use native Vim to edit text boxes
you must be running this script. To begin editing,
press <C-i> inside a text box. By default, this
script will spawn a urxvt shell, but this action
can be changed via the COMMAND variable below.
"""

from platform import system
import http.server
import subprocess
import stat
import os


PORT_NUMBER = 8001

if system() == "Windows": # tested on Windows 7 by @Praful
    TMP_FILE = os.environ['TEMP'] + "\\cvim-tmp"
    TMP_SCRIPT_FILE = os.environ['TEMP'] + "\\cvim-tmp-script.bat"
    SCRIPT_COMMAND = "gvim.exe %1"
    COMMAND = TMP_SCRIPT_FILE + " {}"
else: # tested on Arch Linux + urxvt
    TMP_FILE = "/tmp/cvim-tmp"
    TMP_SCRIPT_FILE = "/tmp/cvim-tmp-script.sh"
    SCRIPT_COMMAND = "vim $1"
    COMMAND = "urxvt -e " + TMP_SCRIPT_FILE + " {}"


class CVHandler(http.server.BaseHTTPRequestHandler):

    def do_HEAD(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()

    def do_POST(self):
        self.send_response(200)
        self.end_headers()
        if self.headers["Host"] != "127.0.0.1:" + str(PORT_NUMBER):
            print("cVim Warning: Connection from outside IP blocked -> " +
                  self.headers["Host"])
            return
        post_body = self.rfile \
            .read(int(self.headers["Content-Length"])).decode("utf8")
        with open(TMP_FILE, "w") as tmp_file:
            tmp_file.write(post_body)
        proc = subprocess.Popen(COMMAND.format(TMP_FILE).split()).wait()
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
        httpd = server_class(('', PORT_NUMBER), CVHandler)
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    os.remove(TMP_SCRIPT_FILE)
    httpd.server_close()
