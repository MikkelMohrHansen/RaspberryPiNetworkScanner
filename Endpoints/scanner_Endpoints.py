from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from Scanner import scanner

Scanner_bp = Blueprint("scanner_bp", __name__)

@Scanner_bp.post("/StartScan")
@jwt_required()
def start_scan():
    scanner.main()
    return jsonify({"ok": True, "message": "Scan started"}), 200