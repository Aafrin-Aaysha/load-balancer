@echo off
echo Starting 5 backend instances...

start "Backend 5001" python app.py 5001
start "Backend 5002" python app.py 5002
start "Backend 5003" python app.py 5003
start "Backend 5004" python app.py 5004
start "Backend 5005" python app.py 5005

echo All backend instances started!
echo Backends running on ports: 5001, 5002, 5003, 5004, 5005
