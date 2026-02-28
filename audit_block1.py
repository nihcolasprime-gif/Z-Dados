from fastapi.testclient import TestClient

file_path = "backend/main.py"
with open(file_path, "rb") as f:
    text = f.read()

if b'"status": "ok"' in text:
    text = text.replace(b'"status": "ok",', b'"ok": True,')
    with open(file_path, "wb") as f:
        f.write(text)
    print("Replaced status: ok with ok: True in main.py")

# Import after rewriting to ensure the module uses the fixed code
from backend.main import app
client = TestClient(app)

print("\n--- Testing /api/health ---")
r1 = client.get("/api/health")
print(f"Status: {r1.status_code}")
print(f"JSON: {r1.json()}")

print("\n--- Testing /api/ia-prospeccao?pergunta=teste ---")
r2 = client.get("/api/ia-prospeccao?pergunta=teste")
print(f"Status: {r2.status_code}")
print(f"JSON: {r2.json()}")
