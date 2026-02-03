from flask import Flask, request, jsonify
from Endpoints.user import user_bp
from Endpoints.ScannerEndpoints import Scanner_bp

app = Flask(__name__)

@app.route("/")
def home():
    return "Api Køre"

app.register_blueprint(user_bp, url_prefix="/api/v1/user")
app.register_blueprint(Scanner_bp, url_prefix="/api/v1/Scannerdb")

@app.post("/dataIngression")
def data_ingression():
    data = request.get_json()

    if not data:
        return jsonify({"ok": False, "error": "Missing/invalid JSON"}), 400

    scanned_at = data.get("scanned_at")
    target = data.get("target")
    devices = data.get("devices")

    if not scanned_at or not target or not isinstance(devices, list):
        return jsonify({"ok": False, "error": "Expected scanned_at, target, devices(list)"}),400

    for d in devices:
        if "IP" not in d or "MAC" not in d:
            return jsonify({"ok": False, "error": "Each device must have IP and MAC"}), 400

    print(f"Received scan: target={target}, devices={len(devices)}, scanned_at={scanned_at}")
    return jsonify({"ok": True, "received_devices": len(devices)}), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)