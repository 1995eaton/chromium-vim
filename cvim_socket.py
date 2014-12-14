#!/usr/bin/env python3

'''
USAGE: ./cvim_socket.py
If you want to use native Vim to edit text boxes
you must be running this script. To begin editing,
first map the editWithVim (e.g. "imap <C-o> editWithVim") mapping.
By default, this script will spawn a urxvt shell, but this action
can be changed via the COMMAND variable below.
'''

from platform import system
import signal
import os
import sys
import socket
import subprocess

PORT = 8001

if system() == 'Windows': # tested on Windows 7 by @Praful
    TMP = os.environ['TEMP'] + '\\cvim-tmp'
    GVIM_PATH = '' # edit this to the location of gvim.exe
    COMMAND = GVIM_PATH + 'gvim.exe %1'
else: # tested on Arch Linux + urxvt
    TMP = '/tmp/cvim-tmp'
    COMMAND = 'urxvt -e vim {}'.format(TMP)

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)
sock.bind(('localhost', PORT))
sock.listen(1)

def exit_handler(signum, stack):
    sock.close()
    if os.path.exists(TMP):
        os.remove(TMP)

signal.signal(signal.SIGTERM, exit_handler)

try:
    while True:
        peer, addr = sock.accept()
        data = peer.recv(1 << 16).decode('utf8').split('\r\n')
        with open(TMP, 'w+') as f:
            f.write(data[-1])
            f.seek(0)
            subprocess.Popen(COMMAND.split()).wait()
            peer.send(f.read().encode('utf8'))
        peer.close()
except KeyboardInterrupt:
    exit_handler(None, None)
except InterruptedError:
    pass
