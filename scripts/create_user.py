#!/usr/bin/env python3
from __future__ import annotations

import sqlite3
from pathlib import Path

from werkzeug.security import generate_password_hash


DB_PATH = Path("Database/SqliteDB")


def main() -> None:
    if not DB_PATH.exists():
        raise SystemExit(f"Database not found: {DB_PATH.resolve()}")

    username = input("Username: ").strip()
    if not username:
        raise SystemExit("Username må ikke være tomt.")

    password = input("Password: ")
    if not password:
        raise SystemExit("Password må ikke være tomt.")

    password_hash = generate_password_hash(password)

    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.cursor()

        cur.execute("SELECT 1 FROM Users WHERE username = ?", (username,))
        if cur.fetchone():
            raise SystemExit(f"Brugeren '{username}' findes allerede.")

        cur.execute(
            "INSERT INTO Users (username, password) VALUES (?, ?)",
            (username, password_hash),
        )
        conn.commit()

        print(f"✅ User '{username}' oprettet.")

    except sqlite3.IntegrityError as e:
        raise SystemExit(f"❌ Kunne ikke oprette bruger: {e}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
