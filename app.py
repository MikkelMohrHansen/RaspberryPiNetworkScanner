from flask import Flask, request, jsonify
from flask_apscheduler import APScheduler
from flask_cors import CORS

from Database.DB_Data import get_due_planned_scans, set_last_and_next_from_interval
from Endpoints.user import user_bp
from Endpoints.DB_endpoints import DB_bp
from Endpoints.scanner_Endboints import Scanner_bp
from Scanner import scanner

app = Flask(__name__)

CORS(
    app,
    resources={r"/*": {"origins": [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.1.200:3000",
    ]}},
    supports_credentials=True
)
#scheduler

scheduler = APScheduler()

def scan_worker_tick():


    due_scans = get_due_planned_scans()
    if not due_scans:
        return

    print(f"[worker] Found {len(due_scans)} due scans")


    scanner.main()


    for row in due_scans:
        target = row["Scan_Target"]
        try:
            set_last_and_next_from_interval(target)
            print(f"[worker] Updated schedule for {target}")
        except Exception as e:
            print(f"[worker] ERROR updating {target}: {e}")
#scheduler opsat
@app.route("/")
def home():
    return "Api Køre"


app.register_blueprint(user_bp, url_prefix="/api/v1/user")
app.register_blueprint(Scanner_bp, url_prefix="/api/v1/Scanner")

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

app.config["SCHEDULER_API_ENABLED"] = False

scheduler.init_app(app)
scheduler.start()

scheduler.add_job(
    id="scan_worker",
    func=scan_worker_tick,
    trigger="interval",
    seconds=15,      # tjek DB hvert 15. sekund
    replace_existing=True,
    max_instances=1, # undgår overlap hvis scan tager lang tid
    coalesce=True,   # samler missed runs til én
)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
