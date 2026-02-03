#!/usr/bin/env python3
import sqlite3
from pathlib import Path

DB_PATH = Path("Database/SqliteDB")
OUTPUT_PATH = Path(__file__).parent / "db_dump.txt"

def main():
    if not DB_PATH.exists():
        print(f"Database not found: {DB_PATH}")
        return

    with OUTPUT_PATH.open("w", encoding="utf-8") as out:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # find alle tabeller (ignorer sqlite interne)
        cur.execute("""
            SELECT name
            FROM sqlite_master
            WHERE type='table'
              AND name NOT LIKE 'sqlite_%'
            ORDER BY name;
        """)
        tables = [row["name"] for row in cur.fetchall()]

        if not tables:
            out.write("No tables found.\n")
            return

        for table in tables:
            out.write(f"\n=== TABLE: {table} ===\n")

            cur.execute(f"SELECT * FROM {table}")
            rows = cur.fetchall()

            if not rows:
                out.write("(empty)\n")
                continue

            for i, row in enumerate(rows, start=1):
                out.write(f"\nRow {i}:\n")
                for key in row.keys():
                    out.write(f"  {key}: {row[key]}\n")

        conn.close()

    print(f"Database dump written to: {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
