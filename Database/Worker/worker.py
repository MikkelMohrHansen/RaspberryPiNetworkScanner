
from __future__ import annotations

import threading
from datetime import datetime

from Scanner import scanner
from Database.DB_Data import get_due_planned_scans, set_last_and_next_from_interval

_worker_lock = threading.Lock()

def scan_worker_tick() -> None:


    if not _worker_lock.acquire(blocking=False):
        print("[worker] Skipping tick (previous run still executing)")
        return

    try:
        due_scans = get_due_planned_scans()
        print(f"[worker] {datetime.now().isoformat(timespec='seconds')} - Worker tick - found {len(due_scans)} due scans")
        if not due_scans:
            return

        print(f"[worker] {datetime.now().isoformat(timespec='seconds')} - Found {len(due_scans)} due scans")

        # NOTE: Midlertidigt slået scanning fra:
        # scanner.main() kræver pt. CLI-args (target), og worker kalder den uden target -> SystemExit spam.
        # Derfor er selve scanning deaktiveret her, men schedule bliver stadig "touched" (last/next opdateres).
        # scanner.main()


        for row in due_scans:
            target = row.get("scan_target")
            if not target:
                continue

            try:
                updated = set_last_and_next_from_interval(target)
                print(f"[worker] Updated {target} -> next_scan_at={updated['next_scan_at']} (interval={updated['interval']})")
            except Exception as e:
                print(f"[worker] ERROR updating schedule for target='{target}': {e}")

    finally:
        _worker_lock.release()
