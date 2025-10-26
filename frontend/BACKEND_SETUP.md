# Backend Setup Instructions

This document provides complete instructions for setting up the Python backend, MongoDB, and custom load balancer for the College Result Portal.

## Architecture Overview

```
Frontend (React:3000) → Load Balancer (Python:8000) → Backend Instances (Python:5001-5005) → MongoDB
```

## Prerequisites

- Python 3.8+
- MongoDB installed locally
- pip (Python package manager)

## Installation Steps

### 1. Install MongoDB

**Ubuntu/Debian:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

**macOS:**
```bash
brew install mongodb-community
brew services start mongodb-community
```

**Windows:**
Download and install from: https://www.mongodb.com/try/download/community

### 2. Install Python Dependencies

```bash
pip install fastapi uvicorn pymongo python-multipart pandas
```

## Project Structure

Create the following directory structure:

```
backend/
├── app.py                 # Main FastAPI application
├── database.py            # MongoDB connection
├── models.py              # Data models
├── loadbalancer.py        # Custom load balancer
├── start_backends.sh      # Script to start all backends
└── requirements.txt       # Python dependencies
```

## Backend Code Files

### 1. requirements.txt
```txt
fastapi==0.104.1
uvicorn==0.24.0
pymongo==4.6.0
python-multipart==0.0.6
pandas==2.1.3
```

### 2. database.py
```python
from pymongo import MongoClient
from typing import Optional

class Database:
    client: Optional[MongoClient] = None
    
    @classmethod
    def connect(cls):
        cls.client = MongoClient("mongodb://localhost:27017/")
        return cls.client["college_results"]
    
    @classmethod
    def close(cls):
        if cls.client:
            cls.client.close()

def get_database():
    return Database.connect()
```

### 3. models.py
```python
from pydantic import BaseModel
from typing import List

class Subject(BaseModel):
    subject_name: str
    max_marks: int
    obtained_marks: int

class StudentResult(BaseModel):
    name: str
    roll_number: str
    course: str
    semester: int
    year: int
    subjects: List[Subject]
    sgpa: float
    percentage: float
    status: str  # "Pass" or "Fail"
```

### 4. app.py
```python
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import sys
from database import get_database
from models import StudentResult, Subject

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get port from command line argument
port = int(sys.argv[1]) if len(sys.argv) > 1 else 5001

@app.on_event("startup")
async def startup():
    app.mongodb = get_database()
    print(f"Backend instance running on port {port}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "port": port}

@app.get("/api/result/{roll_number}")
async def get_result(roll_number: str):
    result = app.mongodb.results.find_one({"roll_number": roll_number})
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    
    # Remove MongoDB _id field
    result.pop("_id", None)
    return result

@app.post("/api/admin/upload")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    try:
        # Read CSV
        df = pd.read_csv(file.file)
        
        # Validate required columns
        required_cols = ['name', 'roll_number', 'course', 'semester', 'year', 
                        'subject_name', 'max_marks', 'obtained_marks']
        if not all(col in df.columns for col in required_cols):
            raise HTTPException(status_code=400, detail="Missing required columns in CSV")
        
        # Group by student
        students = {}
        for _, row in df.iterrows():
            roll_no = row['roll_number']
            if roll_no not in students:
                students[roll_no] = {
                    'name': row['name'],
                    'roll_number': roll_no,
                    'course': row['course'],
                    'semester': int(row['semester']),
                    'year': int(row['year']),
                    'subjects': []
                }
            
            students[roll_no]['subjects'].append({
                'subject_name': row['subject_name'],
                'max_marks': int(row['max_marks']),
                'obtained_marks': int(row['obtained_marks'])
            })
        
        # Calculate SGPA and status
        for student in students.values():
            total_obtained = sum(s['obtained_marks'] for s in student['subjects'])
            total_max = sum(s['max_marks'] for s in student['subjects'])
            
            student['percentage'] = (total_obtained / total_max) * 100 if total_max > 0 else 0
            student['sgpa'] = student['percentage'] / 10  # Simple conversion
            student['status'] = "Pass" if student['percentage'] >= 40 else "Fail"
            
            # Update or insert into MongoDB
            app.mongodb.results.update_one(
                {"roll_number": student['roll_number']},
                {"$set": student},
                upsert=True
            )
        
        return {
            "success": True,
            "records_processed": len(students),
            "message": "Results uploaded successfully"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CSV: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=port)
```

### 5. loadbalancer.py
```python
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
```

### 6. start_backends.sh (Linux/Mac)
```bash
#!/bin/bash

echo "Starting 5 backend instances..."

python app.py 5001 &
python app.py 5002 &
python app.py 5003 &
python app.py 5004 &
python app.py 5005 &

echo "All backend instances started!"
echo "Backends running on ports: 5001, 5002, 5003, 5004, 5005"
```

### 6. start_backends.bat (Windows)
```batch
@echo off
echo Starting 5 backend instances...

start "Backend 5001" python app.py 5001
start "Backend 5002" python app.py 5002
start "Backend 5003" python app.py 5003
start "Backend 5004" python app.py 5004
start "Backend 5005" python app.py 5005

echo All backend instances started!
echo Backends running on ports: 5001, 5002, 5003, 5004, 5005
```

## Running the Complete System

### Step 1: Start MongoDB
```bash
# Make sure MongoDB is running
sudo systemctl start mongodb  # Linux
brew services start mongodb-community  # macOS
```

### Step 2: Start Backend Instances

**Linux/Mac:**
```bash
chmod +x start_backends.sh
./start_backends.sh
```

**Windows:**
```batch
start_backends.bat
```

**Or manually start each:**
```bash
python app.py 5001
python app.py 5002
python app.py 5003
python app.py 5004
python app.py 5005
```

### Step 3: Start Load Balancer
```bash
python loadbalancer.py
```

### Step 4: Start Frontend
```bash
npm run dev
```

## Testing the System

### 1. Test Backend Health
```bash
curl http://localhost:5001/health
curl http://localhost:5002/health
# ... test all instances
```

### 2. Test Load Balancer
```bash
curl http://localhost:8000/health
```

### 3. Upload Sample Data
Create a `sample_results.csv` file:
```csv
name,roll_number,course,semester,year,subject_name,max_marks,obtained_marks
John Doe,MCA001,MCA,1,2024,Data Structures,100,85
John Doe,MCA001,MCA,1,2024,Algorithms,100,90
John Doe,MCA001,MCA,1,2024,Database Systems,100,78
Jane Smith,BCA002,BCA,2,2024,Programming in C,100,92
Jane Smith,BCA002,BCA,2,2024,Web Development,100,88
Jane Smith,BCA002,BCA,2,2024,Computer Networks,100,75
```

Upload via admin panel at: http://localhost:8080/admin

### 4. Query Results
```bash
curl http://localhost:8000/api/result/MCA001
```

## Monitoring

The load balancer automatically:
- Health checks every 10 seconds
- Routes to healthy backends only
- Uses round-robin distribution
- Logs all requests and health status

## Troubleshooting

### Backend won't start
```bash
# Check if port is already in use
lsof -i :5001  # Linux/Mac
netstat -ano | findstr :5001  # Windows

# Kill process if needed
kill -9 <PID>  # Linux/Mac
taskkill /PID <PID> /F  # Windows
```

### MongoDB connection error
```bash
# Check MongoDB status
sudo systemctl status mongodb  # Linux
brew services list  # macOS

# Start MongoDB
sudo systemctl start mongodb  # Linux
brew services start mongodb-community  # macOS
```

### CORS errors
Make sure the frontend URL is added to CORS origins in `app.py`:
```python
allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"]
```

## Architecture Benefits

✅ **High Availability** - 5 backend instances ensure service continuity
✅ **Load Distribution** - Round-robin balancing across all instances
✅ **Health Monitoring** - Automatic detection and bypass of failed instances
✅ **Scalability** - Easy to add more backend instances
✅ **Flexible Schema** - MongoDB supports any course structure
✅ **No Docker** - Pure Python implementation

## Next Steps

- Add authentication to admin panel
- Implement caching for frequently accessed results
- Add logging and analytics
- Set up automated backups for MongoDB
- Deploy to production server
