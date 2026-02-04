import os
from flask_apscheduler import APScheduler

from Scanner import scanner
from Database.DB_Data import get_due_planned_scans, set_last_and_next_from_interval

scheduler = APScheduler()

def scan_worker_tick():


    due = get_due_planned_scans()
    if not due:
        return

    # Hvis du vil køre main() én gang pr "batch" (alle due targets samlet)
    # så kører vi main() én gang her:
    scanner.main()

    # Opdater targets bagefter, så de får nyt next_Scan
    for row in due:
        target = row["Scan_Target"]
        try:
            set_last_and_next_from_interval(target)
        except Exception as e:
            # i produktion: log dette til fil/DB
            print(f"[worker] Failed updating schedule for {target}: {e}")