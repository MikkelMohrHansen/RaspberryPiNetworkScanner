# Database/DB_Data.py
from __future__ import annotations

from datetime import datetime
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
