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
