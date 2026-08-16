# -*- coding: utf-8 -*-

from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import joblib
import numpy as np
import os
import traceback

# -----------------------------
# Load model & encoders
# -----------------------------
BASE_DIR = os.path.dirname(__file__)

try:
    model = joblib.load(os.path.join(BASE_DIR, "model.pkl"))
    category_encoder = joblib.load(os.path.join(BASE_DIR, "category_encoder.pkl"))
    course_encoder = joblib.load(os.path.join(BASE_DIR, "course_encoder.pkl"))
    print("MODEL: Model and Encoders loaded successfully.")
except Exception as e:
    print(f"ERROR: Initialization Error: {str(e)}")

# -----------------------------
# HTTP Handler
# -----------------------------
class Handler(BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        # Prevent default logging to keep terminal clean, but we will print manually
        print("REQUEST:", format % args)

    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "active"}).encode())

    def do_POST(self):
        print(f"--- Incoming POST: {self.path} ---")
        try:
            if self.path == "/predict":
                content_length = int(self.headers.get("Content-Length", 0))
                raw_data = self.rfile.read(content_length).decode("utf-8")
                print(f"RAW DATA: {raw_data}")
                
                data = json.loads(raw_data)
                
                cgpa = float(data.get("cgpa", 7.0))
                income = int(data.get("income", 500000))
                cat = str(data.get("category", "general")).lower().strip()
                crs = str(data.get("course", "engineering")).lower().strip()

                try:
                    # Encoders
                    c_idx = category_encoder.transform([cat])[0]
                    r_idx = course_encoder.transform([crs])[0]
                    
                    # Prob
                    X = np.array([[cgpa, income, c_idx, r_idx]])
                    prob = model.predict_proba(X)[0][1]
                    match_percentage = round(float(prob) * 100, 2)
                    print(f"✅ Prediction Success: {match_percentage}%")
                except Exception as inner_e:
                    print(f"⚠️ Prediction Fallback (Unknown labels): {str(inner_e)}")
                    match_percentage = 74.0

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"match_percentage": match_percentage}).encode())
                
            else:
                self.send_response(404)
                self.end_headers()
                
        except Exception as e:
            print(f"❌ CRITICAL ERROR:\n{traceback.format_exc()}")
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

if __name__ == "__main__":
    # Use 127.0.0.1 for Windows stability
    port = int(os.environ.get("PORT", 8001))
    server = HTTPServer(("0.0.0.0", port), Handler)
    server.serve_forever()
