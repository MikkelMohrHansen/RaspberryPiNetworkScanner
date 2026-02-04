# Endpoints/ScannerEndpoints.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from Database import DB_Data
from Scanner import scanner

Scanner_bp = Blueprint("scanner_bp", __name__)

def _json():
    return request.get_json(silent=True) or {}

@Scanner_bp.post("/StartScan")
@jwt_required()
def start_scan():
    scanner.main()
    return jsonify({"ok": True, "message": "Scan started"}), 200


@Scanner_bp.post("/planScan")
@jwt_required()
def plan_scan():
    data = _json()
    try:
        result = DB_Data.planScan(
            interval=data.get("interval"),
            scan_target=data.get("scan_target"),
            last_scanned_at=data.get("last_scanned_at"),
        )
        return jsonify(result), 201
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400


@Scanner_bp.put("/plannedScans/updateLast")
@jwt_required()
def planned_update_last():
    data = _json()
    try:
        result = DB_Data.update_last_scan(
            scan_target=data.get("scan_target"),
            scanned_at=data.get("scanned_at"),
        )
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400


@Scanner_bp.put("/plannedScans/clearNext")
@jwt_required()
def planned_clear_next():
    data = _json()
    try:
        result = DB_Data.clear_next_scan(scan_target=data.get("scan_target"))
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400


@Scanner_bp.put("/plannedScans/touch")
@jwt_required()
def planned_touch():
    data = _json()
    try:
        result = DB_Data.set_last_and_next_from_interval(scan_target=data.get("scan_target"))
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400


@Scanner_bp.get("/plannedScans/due")
@jwt_required()
def planned_due():
    try:
        return jsonify(DB_Data.get_due_planned_scans()), 200
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400

@Scanner_bp.delete("/plannedScans/delete")
@jwt_required()
def delete_planned_scan():
    data = _json()
    try:
        result = DB_Data.delete_planned_scan(interval=data.get("interval"))
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400

@Scanner_bp.get("/plannedScans/all")
@jwt_required()
def planned_scans_all():
    return jsonify(DB_Data.get_all_planned_scans()), 200
