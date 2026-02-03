#!/usr/bin/env python3
from pathlib import Path
import sqlite3

SCHEMA_PATH = Path("Database/schema.sql")
DB_PATH = Path("Database/SqliteDB")

def main():
    if not SCHEMA_PATH.exists():
        raise SystemExit(f"Missing schema file: {SCHEMA_PATH}")

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")

    if DB_PATH.exists():
        DB_PATH.unlink()

    conn = sqlite3.connect(str(DB_PATH))
    try:
        conn.execute("PRAGMA foreign_keys = ON;")
        conn.executescript(schema_sql)
        conn.commit()
    finally:
        conn.close()

    print(f"Created SQLite DB: {DB_PATH}")

if __name__ == "__main__":
    main()
