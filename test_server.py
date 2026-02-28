import sys
import uvicorn
import threading
import requests
import time
from backend.main import app

def run_server():
    uvicorn.run(app, host="127.0.0.1", port=8001, log_level="error")

t = threading.Thread(target=run_server, daemon=True)
t.start()
time.sleep(2) # Wait for server to boot

print("\n--- Testing /api/health ---")
r1 = requests.get("http://127.0.0.1:8001/api/health")
print(f"Status: {r1.status_code}")
print(f"JSON: {r1.json()}")

print("\n--- Testing /api/ia-prospeccao?pergunta=teste ---")
r2 = requests.get("http://127.0.0.1:8001/api/ia-prospeccao?pergunta=teste")
print(f"Status: {r2.status_code}")
try:
    print(f"JSON: {r2.json()}")
except Exception as e:
    print("Not JSON:", r2.text)
