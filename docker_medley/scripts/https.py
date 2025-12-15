#!/usr/bin/env python3
# Author: Sean Pesce
# Modified by Frank Halasz @ Interlisp.org 2025-12-12

# References:
#   https://stackoverflow.com/questions/19705785/python-3-simple-https-server
#   https://docs.python.org/3/library/ssl.html
#   https://docs.python.org/3/library/http.server.html

# Shell command to create a self-signed TLS certificate and private key:
#    openssl req -new -newkey rsa:4096 -x509 -sha256 -days 365 -nodes -out cert.crt -keyout private.key

import http.server
import ssl
import sys
import os

def serve(host, port, cert_fpath, privkey_fpath, dir):
    os.chdir(dir)
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)  # Might need to use ssl.PROTOCOL_TLS for older versions of Python
    context.load_cert_chain(certfile=cert_fpath, keyfile=privkey_fpath, password='')
    server_address = (host, port)
    httpd = http.server.HTTPServer(server_address, http.server.SimpleHTTPRequestHandler)
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
    httpd.serve_forever()


if __name__ == '__main__':
    if len(sys.argv) < 4:
        print(f'Usage:\n  {sys.argv[0]} <port> <PEM certificate file> <private key file>')
        sys.exit()
    
    PORT = int(sys.argv[1])
    CERT_FPATH = sys.argv[2]
    PRIVKEY_FPATH = sys.argv[3]
    DIR = sys.argv[4]
    
    serve('0.0.0.0', PORT, CERT_FPATH, PRIVKEY_FPATH, DIR)
