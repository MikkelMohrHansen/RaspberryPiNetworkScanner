from flask import Blueprint, request, jsonify
from Database.DB_Data import planScan, clear_next_scan, set_last_and_next_from_interval
from Scanner import scanner

Scanner_bp = Blueprint("scanner_bp", __name__)

@Scanner_bp.post("/StartScan")
def start_scan():
    scanner.main()
    return jsonify({"ok": True, "message": "Scan started"}), 200

@Scanner_bp.post("/ScheduleScan")
def schedule_scan():
    data = request.get_json()

    if not data:
        return jsonify({"ok": False, "error": "Missing JSON"}), 400

    interval = data.get("interval")
    target = data.get("scan_target")

    if not interval or not target:
        return jsonify({
            "ok": False,
            "error": "You must send: interval (minutes) and scan_target"
        }), 400

    try:
        result = planScan(interval, target)
        return jsonify(result), 201
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400


@Scanner_bp.post("/CancelScan")
def cancel_scan():
    data = request.get_json()

    if not data or "scan_target" not in data:
        return jsonify({
            "ok": False,
            "error": "You must send scan_target"
        }), 400

    target = data["scan_target"]

    try:
        result = clear_next_scan(target)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400


@Scanner_bp.post("/PlannedScan")
def planned_scan():
    data = request.get_json()

    if not data or "scan_target" not in data:
        return jsonify({
            "ok": False,
            "error": "You must send scan_target"
        }), 400

    target = data["scan_target"]

    try:
        # kør selve scanneren
        scanner.main()

        # opdater last + next ud fra interval i DB
        result = set_last_and_next_from_interval(target)

        return jsonify({
            "ok": True,
            "message": "Scan executed and schedule updated",
            "schedule": result
        }), 200

    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400