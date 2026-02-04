import os
from datetime import timedelta

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_apscheduler import APScheduler

from Endpoints.user import user_bp
from Endpoints.DB_endpoints import DB_bp
from Endpoints.scanner_Endpoints import Scanner_bp

from Database.Worker.worker import scan_worker_tick

app = Flask(__name__)


app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-change-me")
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_COOKIE_SECURE"] = False
app.config["JWT_COOKIE_SAMESITE"] = "Lax"
app.config["JWT_ACCESS_COOKIE_PATH"] = "/api/v1/"
app.config["JWT_REFRESH_COOKIE_PATH"] = "/api/v1/"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=8)
app.config["JWT_COOKIE_CSRF_PROTECT"] = False

jwt = JWTManager(app)


CORS(
    app,
    resources={
        r"/*": {
            "origins": [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://192.168.1.200:3000",
            ]
        }
    },
    supports_credentials=True,
)


scheduler = APScheduler()

@app.before_request
def start_scheduler():
    app.config["SCHEDULER_API_ENABLED"] = False

    # Hvis den allerede kører, så gør ingenting
    if scheduler.running:
        return

    scheduler.init_app(app)

    scheduler.add_job(
        id="scan_worker",
        func=scan_worker_tick,
        trigger="interval",
        seconds=15,
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )

    scheduler.start()



@app.route("/")
def home():
    return "Api Køre"

app.register_blueprint(user_bp, url_prefix="/api/v1/")
app.register_blueprint(DB_bp, url_prefix="/api/v1/")
app.register_blueprint(Scanner_bp, url_prefix="/api/v1/")

@app.post("/dataIngression")
def data_ingression():
    data = request.get_json()

    if not data:
        return jsonify({"ok": False, "error": "Missing/invalid JSON"}), 400

    scanned_at = data.get("scanned_at")
    target = data.get("target")
    devices = data.get("devices")

    if not scanned_at or not target or not isinstance(devices, list):
        return jsonify(
            {"ok": False, "error": "Expected scanned_at, target, devices(list)"}
        ), 400

    for d in devices:
        if "IP" not in d or "MAC" not in d:
            return jsonify(
                {"ok": False, "error": "Each device must have IP and MAC"}
            ), 400

    print(
        f"Received scan: target={target}, devices={len(devices)}, scanned_at={scanned_at}"
    )

    return jsonify({"ok": True, "received_devices": len(devices)}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
