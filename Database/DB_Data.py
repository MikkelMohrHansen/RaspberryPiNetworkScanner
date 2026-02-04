# Database/DB_Data.py
from __future__ import annotations

from datetime import datetime, timedelta
from Database.DB_Connections import DB_Connections

_db = DB_Connections("Database/SqliteDB")


def _now_sqlite() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def _fetch_all(sql: str, params: tuple = ()) -> list[dict]:
    with _db.transaction() as conn:
        cur = conn.execute(sql, params)
        rows = cur.fetchall()
        return [dict(r) for r in rows]


def _run(sql: str, params: tuple = ()) -> None:
    with _db.transaction() as conn:
        conn.execute(sql, params)


def get_approved() -> list[dict]:
    return _fetch_all(
        """
        SELECT mac_address, ip_address, description, vendor, first_seen, last_seen
        FROM ApprovedAddresses
        ORDER BY last_seen DESC
        """
    )


def get_unapproved() -> list[dict]:
    return _fetch_all(
        """
        SELECT mac_address, ip_address, description, vendor, first_seen, last_seen
        FROM UnApprovedAddresses
        ORDER BY last_seen DESC
        """
    )


def add_unapproved(
    mac_address: str,
    ip_address: str,
    description: str | None = None,
    vendor: str | None = None,
    first_seen: str | None = None,
    last_seen: str | None = None,
) -> None:
    mac = (mac_address or "").strip().lower()
    ip = (ip_address or "").strip()
    if not mac:
        raise ValueError("mac_address is required")
    if not ip:
        raise ValueError("ip_address is required")

    fs = first_seen or _now_sqlite()
    ls = last_seen or _now_sqlite()

    _run(
        """
        INSERT INTO UnApprovedAddresses (mac_address, ip_address, description, vendor, first_seen, last_seen)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(mac_address, ip_address) DO UPDATE SET
          description = COALESCE(excluded.description, UnApprovedAddresses.description),
          vendor      = COALESCE(excluded.vendor,      UnApprovedAddresses.vendor),
          first_seen  = COALESCE(UnApprovedAddresses.first_seen, excluded.first_seen),
          last_seen   = excluded.last_seen
        """,
        (mac, ip, description, vendor, fs, ls),
    )


def add_approved(
    mac_address: str,
    ip_address: str,
    description: str | None = None,
    vendor: str | None = None,
    first_seen: str | None = None,
    last_seen: str | None = None,
) -> None:
    mac = (mac_address or "").strip().lower()
    ip = (ip_address or "").strip()
    if not mac:
        raise ValueError("mac_address is required")
    if not ip:
        raise ValueError("ip_address is required")

    fs = first_seen or _now_sqlite()
    ls = last_seen or _now_sqlite()

    _run(
        """
        INSERT INTO ApprovedAddresses (mac_address, ip_address, description, vendor, first_seen, last_seen)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(mac_address, ip_address) DO UPDATE SET
          description = COALESCE(excluded.description, ApprovedAddresses.description),
          vendor      = COALESCE(excluded.vendor,      ApprovedAddresses.vendor),
          first_seen  = COALESCE(ApprovedAddresses.first_seen, excluded.first_seen),
          last_seen   = excluded.last_seen
        """,
        (mac, ip, description, vendor, fs, ls),
    )


def update_unapproved(
    mac_address: str,
    ip_address: str,
    description: str | None = None,
    vendor: str | None = None,
    first_seen: str | None = None,
    last_seen: str | None = None,
) -> None:
    mac = (mac_address or "").strip().lower()
    ip = (ip_address or "").strip()
    if not mac:
        raise ValueError("mac_address is required")
    if not ip:
        raise ValueError("ip_address is required")

    ls = last_seen or _now_sqlite()

    _run(
        """
        UPDATE UnApprovedAddresses
        SET
          description = COALESCE(?, description),
          vendor      = COALESCE(?, vendor),
          first_seen  = COALESCE(?, first_seen),
          last_seen   = COALESCE(?, last_seen)
        WHERE mac_address = ? AND ip_address = ?
        """,
        (description, vendor, first_seen, ls, mac, ip),
    )


def update_approved(
    mac_address: str,
    ip_address: str,
    description: str | None = None,
    vendor: str | None = None,
    first_seen: str | None = None,
    last_seen: str | None = None,
) -> None:
    mac = (mac_address or "").strip().lower()
    ip = (ip_address or "").strip()
    if not mac:
        raise ValueError("mac_address is required")
    if not ip:
        raise ValueError("ip_address is required")

    ls = last_seen or _now_sqlite()

    _run(
        """
        UPDATE ApprovedAddresses
        SET
          description = COALESCE(?, description),
          vendor      = COALESCE(?, vendor),
          first_seen  = COALESCE(?, first_seen),
          last_seen   = COALESCE(?, last_seen)
        WHERE mac_address = ? AND ip_address = ?
        """,
        (description, vendor, first_seen, ls, mac, ip),
    )


def remove_approved(mac_address: str, ip_address: str) -> None:
    mac = (mac_address or "").strip().lower()
    ip = (ip_address or "").strip()
    if not mac:
        raise ValueError("mac_address is required")
    if not ip:
        raise ValueError("ip_address is required")

    _run("DELETE FROM ApprovedAddresses WHERE mac_address = ? AND ip_address = ?", (mac, ip))


def remove_unapproved(mac_address: str, ip_address: str) -> None:
    mac = (mac_address or "").strip().lower()
    ip = (ip_address or "").strip()
    if not mac:
        raise ValueError("mac_address is required")
    if not ip:
        raise ValueError("ip_address is required")

    _run("DELETE FROM UnApprovedAddresses WHERE mac_address = ? AND ip_address = ?", (mac, ip))

def planScan(interval: int, scan_target: str, last_scanned_at: str | None = None) -> dict:
    if interval is None:
        raise ValueError("interval is required")

    try:
        interval_int = int(interval)
    except (TypeError, ValueError):
        raise ValueError("interval must be an integer")

    if interval_int <= 0:
        raise ValueError("interval must be > 0")

    target = (scan_target or "").strip()
    if not target:
        raise ValueError("scan_target is required")

    now_dt = datetime.now()
    next_dt = now_dt + timedelta(minutes=interval_int)

    last_sql = last_scanned_at
    next_sql = next_dt.strftime("%Y-%m-%d %H:%M:%S")

    _run(
        """
        INSERT INTO PlannedScans (interval, last_scanned_at, next_scan_at, scan_target)
        VALUES (?, ?, ?, ?)
        """,
        (interval_int, last_sql, next_sql, target),
    )

    return {
        "ok": True,
        "interval": interval_int,
        "last_scanned_at": last_sql,
        "next_scan_at": next_sql,
        "scan_target": target,
    }


def update_last_scan(scan_target: str, scanned_at: str | None = None) -> dict:
    target = (scan_target or "").strip()
    if not target:
        raise ValueError("scan_target is required")

    last_sql = scanned_at or _now_sqlite()

    _run(
        """
        UPDATE PlannedScans
        SET last_scanned_at = ?
        WHERE scan_target = ?
        """,
        (last_sql, target),
    )

    return {
        "ok": True,
        "scan_target": target,
        "last_scanned_at": last_sql,
    }


def clear_next_scan(scan_target: str) -> dict:
    target = (scan_target or "").strip()
    if not target:
        raise ValueError("scan_target is required")

    _run(
        """
        UPDATE PlannedScans
        SET next_scan_at = NULL
        WHERE scan_target = ?
        """,
        (target,),
    )

    return {
        "ok": True,
        "scan_target": target,
        "next_scan_at": None,
    }


def set_last_and_next_from_interval(scan_target: str) -> dict:
    target = (scan_target or "").strip()
    if not target:
        raise ValueError("scan_target is required")

    now_dt = datetime.now()
    now_sql = now_dt.strftime("%Y-%m-%d %H:%M:%S")

    rows = _fetch_all(
        """
        SELECT interval
        FROM PlannedScans
        WHERE scan_target = ?
        """,
        (target,),
    )

    if not rows:
        raise ValueError(f"No planned scan found for target: {target}")

    interval_minutes = int(rows[0]["interval"])

    next_dt = now_dt + timedelta(minutes=interval_minutes)
    next_sql = next_dt.strftime("%Y-%m-%d %H:%M:%S")

    _run(
        """
        UPDATE PlannedScans
        SET
            last_scanned_at = ?,
            next_scan_at = ?
        WHERE scan_target = ?
        """,
        (now_sql, next_sql, target),
    )

    return {
        "ok": True,
        "scan_target": target,
        "last_scanned_at": now_sql,
        "next_scan_at": next_sql,
        "interval": interval_minutes,
    }


def get_due_planned_scans() -> list[dict]:
    now = _now_sqlite()

    return _fetch_all(
        """
        SELECT interval, last_scanned_at, next_scan_at, scan_target
        FROM PlannedScans
        WHERE next_scan_at IS NOT NULL
          AND next_scan_at <= ?
        ORDER BY next_scan_at ASC
        """,
        (now,),
    )

def get_all_planned_scans() -> list[dict]:
    return _fetch_all(
        """
        SELECT interval, last_scanned_at, next_scan_at, scan_target
        FROM PlannedScans
        ORDER BY
          CASE WHEN next_scan_at IS NULL THEN 1 ELSE 0 END,
          next_scan_at ASC,
          interval ASC
        """
    )

def delete_planned_scan(interval: int) -> dict:
    if interval is None:
        raise ValueError("interval is required")

    try:
        interval_int = int(interval)
    except (TypeError, ValueError):
        raise ValueError("interval must be an integer")

    if interval_int <= 0:
        raise ValueError("interval must be > 0")

    rows = _fetch_all(
        """
        SELECT interval, last_scanned_at, next_scan_at, scan_target
        FROM PlannedScans
        WHERE interval = ?
        """,
        (interval_int,),
    )

    if not rows:
        return {"ok": True, "deleted": False, "interval": interval_int}

    _run("DELETE FROM PlannedScans WHERE interval = ?", (interval_int,))

    return {"ok": True, "deleted": True, "interval": interval_int, "removed": rows[0]}
