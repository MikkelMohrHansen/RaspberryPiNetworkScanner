from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash

from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    set_access_cookies,
    unset_jwt_cookies,
)

import sqlite3
from pathlib import Path

user_bp = Blueprint("user", __name__)

DB_PATH = Path("Database/SqliteDB")


def _get_user(username: str) -> dict | None:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        cur = conn.cursor()
        cur.execute("SELECT username, password FROM Users WHERE username = ?", (username,))
        row = cur.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


@user_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"ok": False, "error": "Missing username or password"}), 400

    user = _get_user(username)
    if not user:
        return jsonify({"ok": False, "error": "Invalid credentials"}), 401

    # password i DB er hash (fra dit create_user script)
    if not check_password_hash(user["password"], password):
        return jsonify({"ok": False, "error": "Invalid credentials"}), 401

    # Identity = det vi gemmer i token (typisk username eller user_id)
    access_token = create_access_token(identity=username)

    resp = jsonify({"ok": True})
    set_access_cookies(resp, access_token)
    return resp, 200


@user_bp.post("/logout")
def logout():
    resp = jsonify({"ok": True})
    unset_jwt_cookies(resp)
    return resp, 200


@user_bp.get("/me")
@jwt_required()
def me():
    username = get_jwt_identity()
    return jsonify({"ok": True, "username": username}), 200
