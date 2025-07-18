#!/usr/bin/env python3
import http.server
import os
import socketserver
import sys

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

if len(sys.argv) > 1:
    os.chdir(sys.argv[1])

print(f"Serving directory: {os.getcwd()}")
print(f"Server running at http://localhost:{PORT}/")

with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    httpd.serve_forever()
