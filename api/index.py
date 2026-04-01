from http.server import BaseHTTPRequestHandler
import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from lib.engine import analyze_sectors, SECTOR_STOCKS, SECTOR_NAME_MAP, HIGH_MOMENTUM_WATCHLIST, get_stock_data


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/sectors':
            sectors = analyze_sectors()
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"sectors": sectors}).encode())
        elif self.path == '/api/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "running", "mode": "autonomous"}).encode())
        elif self.path == '/api/watchlist':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"high_momentum": HIGH_MOMENTUM_WATCHLIST, "by_sector": SECTOR_STOCKS}).encode())
        elif self.path == '/api/market/overview':
            overview = {}
            nifty = get_stock_data("^NSEI", period="2d", interval="1d", min_rows=1)
            if nifty is not None and len(nifty) >= 1:
                c = nifty["Close"]
                overview["nifty"] = round(float(c.iloc[-1]), 2)
                overview["nifty_change"] = round(((c.iloc[-1] - c.iloc[-2]) / c.iloc[-2]) * 100, 2) if len(c) >= 2 else 0.0
            sensex = get_stock_data("^BSESN", period="2d", interval="1d", min_rows=1)
            if sensex is not None and len(sensex) >= 1:
                c = sensex["Close"]
                overview["sensex"] = round(float(c.iloc[-1]), 2)
                overview["sensex_change"] = round(((c.iloc[-1] - c.iloc[-2]) / c.iloc[-2]) * 100, 2) if len(c) >= 2 else 0.0
            vix = get_stock_data("INDIAVIX.NS", period="2d", interval="1d", min_rows=1)
            if vix is not None and len(vix) >= 1:
                c = vix["Close"]
                overview["vix"] = round(float(c.iloc[-1]), 2)
                overview["vix_change"] = round(((c.iloc[-1] - c.iloc[-2]) / c.iloc[-2]) * 100, 2) if len(c) >= 2 else 0.0
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(overview).encode())
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Not found"}).encode())

    def do_POST(self):
        if self.path == '/api/scan':
            from lib.engine import run_full_scan
            result = run_full_scan()
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
