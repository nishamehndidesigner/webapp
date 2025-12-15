#!/usr/bin/env python3
"""
Simple HTTP server to test Netlify-like behavior locally
Run: python test-server.py
Then open: http://localhost:8000/test-netlify.html
"""

import http.server
import socketserver
import webbrowser
import os

PORT = 8000

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers like Netlify
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", PORT), CORSHTTPRequestHandler) as httpd:
        print(f"🚀 Server running at http://localhost:{PORT}")
        print(f"📊 Test page: http://localhost:{PORT}/test-netlify.html")
        print(f"🏠 Main site: http://localhost:{PORT}/index.html")
        print("Press Ctrl+C to stop")
        
        # Auto-open test page
        webbrowser.open(f'http://localhost:{PORT}/test-netlify.html')
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Server stopped")