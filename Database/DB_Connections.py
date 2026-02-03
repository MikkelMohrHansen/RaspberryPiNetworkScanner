import sqlite3
from contextlib import contextmanager


class DB_Connections:

    def __init__(self, db_path: str = "Database.Sqlite"):
        self.db_path = db_path


    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(
            self.db_path,
            detect_types=sqlite3.PARSE_DECLTYPES
        )


        conn.row_factory = sqlite3.Row

        conn.execute("PRAGMA foreign_keys = ON;")
        conn.execute("PRAGMA journal_mode = WAL;")

        return conn

    @contextmanager
    def transaction(self):

        conn = self._connect()
        try:
            conn.execute("BEGIN;")
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
