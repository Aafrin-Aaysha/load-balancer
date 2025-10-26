import http.server
import socketserver
import requests
import json
from urllib.parse import urlparse, parse_qs
from datetime import datetime
import threading
import time

# Backend instances
BACKENDS = [
    "http://localhost:5001",
    "http://localhost:5002",
    "http://localhost:5003",
    "http://localhost:5004",
    "http://localhost:5005",
]

# Health status
backend_health = {backend: True for backend in BACKENDS}
current_backend_index = 0

# Health check function
def health_check():
    while True:
        for backend in BACKENDS:
            try:
                response = requests.get(f"{backend}/health", timeout=2)
                backend_health[backend] = response.status_code == 200
                print(f"[{datetime.now().strftime('%H:%M:%S')}] {backend} - {'✓ Healthy' if backend_health[backend] else '✗ Unhealthy'}")
            except:
                backend_health[backend] = False
                print(f"[{datetime.now().strftime('%H:%M:%S')}] {backend} - ✗ Unhealthy")
        time.sleep(10)  # Check every 10 seconds

# Start health check thread
health_thread = threading.Thread(target=health_check, daemon=True)
health_thread.start()

class LoadBalancerHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        backend = self.get_next_healthy_backend()
        if not backend:
            self.send_error(503, "All backend services are unavailable")
            return
        
        self.proxy_request(backend, "GET")
    
    def do_POST(self):
        backend = self.get_next_healthy_backend()
        if not backend:
            self.send_error(503, "All backend services are unavailable")
            return
        
        # Read body for POST requests
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else None
        
        self.proxy_request(backend, "POST", body)
    
    def get_next_healthy_backend(self):
        global current_backend_index
        
        # Try to find a healthy backend (round-robin)
        attempts = 0
        while attempts < len(BACKENDS):
            backend = BACKENDS[current_backend_index]
            current_backend_index = (current_backend_index + 1) % len(BACKENDS)
            
            if backend_health.get(backend, False):
                return backend
            
            attempts += 1
        
        return None
    
    def proxy_request(self, backend, method, body=None):
        try:
            url = f"{backend}{self.path}"
            headers = {key: value for key, value in self.headers.items() 
                      if key.lower() not in ['host', 'connection']}
            
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            elif method == "POST":
                response = requests.post(url, headers=headers, data=body, timeout=30)
            
            # Send response back to client
            self.send_response(response.status_code)
            for key, value in response.headers.items():
                if key.lower() not in ['transfer-encoding', 'connection']:
                    self.send_header(key, value)
            self.end_headers()
            self.wfile.write(response.content)
            
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Routed {method} {self.path} to {backend} - Status: {response.status_code}")
        
        except Exception as e:
            print(f"Error proxying request: {e}")
            self.send_error(502, f"Bad Gateway: {str(e)}")

if __name__ == "__main__":
    PORT = 8000
    with socketserver.TCPServer(("", PORT), LoadBalancerHandler) as httpd:
        print(f"Load Balancer running on port {PORT}")
        print("Monitoring backend health...")
        httpd.serve_forever()
