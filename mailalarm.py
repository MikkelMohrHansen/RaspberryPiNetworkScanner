import os
import requests
from datetime import datetime
from Database.DB_Data import get_unapproved
from dotenv import load_dotenv

load_dotenv("keys.env")

MAILGUN_URL = "https://api.mailgun.net/v3/sandbox00adcd4f8fc14cb68ebba91928172f20.mailgun.org/messages"
MAILGUN_FROM = "Mailgun Sandbox <postmaster@sandbox00adcd4f8fc14cb68ebba91928172f20.mailgun.org>"
MAILGUN_TO = "Owner of the network <mikkel@mohrhansen.dk>"

def send_unapproved_mail():
    api_key = os.getenv("MAILGUN_KEY")
    if not api_key:
        print("Error: MAILGUN_KEY environment variable not set.")
        return
    
    unapproved = get_unapproved()

    if not unapproved:
        print("No unapproved IP addresses found.")
    else:
        subject = f"[ALERT] {len(unapproved)} Unapproved IP Address(es) Detected"
        lines = ["Uanpproved IP addresses detected on your network:", ""]

        for i, d in enumerate(unapproved, start=1):
             lines += [
                f"{i}. IP: {d.get('ip_address', '')}",
                f"   MAC: {d.get('mac_address', '')}",
                f"   Vendor: {d.get('vendor') or 'Unknown'}",
                f"   Description: {d.get('description') or ''}",
                f"   First seen: {d.get('first_seen') or ''}",
                f"   Last seen:  {d.get('last_seen') or ''}",
                "",
            ]
        text = "\n".join(lines)


    r = requests.post(
        MAILGUN_URL,
        auth=("api", api_key),
        data={
            "from": MAILGUN_FROM,
            "to": MAILGUN_TO,
            "subject": subject,
            "text": text,
        },
        timeout=15,
    )

    if r.status_code == 200:
        print("Mail has been sent successfully!")
    else: 
        raise RuntimeError (f"Failed to send mail: {r.status_code} - {r.text}")
    
if __name__ == "__main__":
    send_unapproved_mail()