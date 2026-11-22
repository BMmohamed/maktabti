from http.server import BaseHTTPRequestHandler
import json
import os

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {
            "service": "print_agent",
            "status": "ready",
            "bound_web_service_url": os.environ.get("WEB_API_URL", "not_set"),
            "note": "On-premise hardware printing runs on desktop agent via print_agent.py"
        }
        self.wfile.write(json.dumps(response).encode('utf-8'))
