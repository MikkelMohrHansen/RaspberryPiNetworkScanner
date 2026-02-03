from Database.DB_Connections import DB_Connections

_db = DB_Connections("Database/SqliteDB")


def getApproved():
    with _db.transaction() as conn:
        cur = conn.execute("SELECT * FROM ApprovedAddresses;")
        rows = cur.fetchall()
        return [dict(row) for row in rows]

def getUnapproved():
    with _db.transaction() as conn:
        cur = conn.execute("SELECT * FROM UnapprovedAddresses;")
        rows = cur.fetchall()
        return [dict(row) for row in rows]

def add_approved(ip_address: str, mac_address: str, description: str | None = None):

    ip_address = (ip_address or "").strip()
    mac_address = (mac_address or "").strip().lower()
    description = (description or "").strip() if description else None

    if not ip_address or not mac_address:
        return {"ok": False, "error": "IP Address or MAC Address is required"}, 400

    with _db.transaction() as conn:
        conn.execute(
            """
            INSERT INTO ApprovedAddresses
                (ip_address, mac_address, description, first_seen, last_seen)
            VALUES (?, ?, ?, datetime('now'), datetime('now'))
            ON CONFLICT(mac_address) DO UPDATE SET
                ip_address = excluded.ip_address,
                description = COALESCE(excluded.description, ApprovedAddresses.description),
                last_seen = datetime('now');
            """,
            (ip_address, mac_address, description),
        )

    return {"ok": True, "mac_address": mac_address}

def update_approved(mac_address: str, ip_address: str | None = None, description: str | None = None):
    with _db.transaction() as conn:
        conn.execute(
            """
            UPDATE ApprovedAddresses
            SET
                ip_address = COALESCE(?, ip_address),
                description = COALESCE(?, description),
                last_seen = datetime('now')
            WHERE mac_address = ?;
            """,
            (ip_address, description, mac_address),
        )
    return {"ok": True, "mac_address": mac_address}

def update_unapproved(mac_address: str, ip_address: str | None = None, reason: str | None = None):
    with _db.transaction() as conn:
        conn.execute(
            """
            UPDATE UnapprovedAddresses
            SET
                ip_address = COALESCE(?, ip_address),
                reason = COALESCE(?, reason),
                last_seen = datetime('now')
            WHERE mac_address = ?;
            """,
            (ip_address, reason, mac_address),
        )

    return {"ok": True, "mac_address": mac_address}

def remove_approved(mac_address: str):
    with _db.transaction() as conn:
        conn.execute(
            """
            DELETE FROM ApprovedAddresses
            WHERE mac_address = ?;
            """,
            (mac_address,),
        )
    return {"ok": True, "mac_address": mac_address}

def add_unapproved(ip_address: str, mac_address: str):
    ip_address = (ip_address or "").strip()
    mac_address = (mac_address or "").strip().lower()

    if not ip_address or not mac_address:
        return {"ok": False, "error": "IP Address or MAC Address is required"}, 400

    with _db.transaction() as conn:
        conn.execute(
            """
            INSERT INTO UnapprovedAddresses
                (ip_address, mac_address, first_seen, last_seen)
            VALUES (?, ?, datetime('now'), datetime('now'))
            ON CONFLICT(mac_address) DO UPDATE SET
                ip_address = excluded.ip_address,
                last_seen = datetime('now');
            """,
            (ip_address, mac_address),
        )

    return {"ok": True, "mac_address": mac_address}

