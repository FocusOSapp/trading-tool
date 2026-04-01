from http.server import BaseHTTPRequestHandler
import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from lib.engine import scan_stock


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parts = self.path.strip('/').split('/')
        if len(parts) >= 3 and parts[0] == 'api' and parts[1] == 'stock':
            symbol = parts[2].upper()
            if not symbol.endswith('.NS'):
                symbol = f"{symbol}.NS"
            result = scan_stock(symbol)
            if result:
                self.send_response(200)
            else:
                self.send_response(404)
                result = {"error": "No data available for symbol"}
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Not found"}).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
