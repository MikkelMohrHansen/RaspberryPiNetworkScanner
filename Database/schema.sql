PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS ApprovedAddresses (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  mac_address  TEXT NOT NULL,
  ip_address   TEXT NOT NULL,
  description  TEXT,
  vendor       TEXT,
  first_seen   TEXT,
  last_seen    TEXT,
  UNIQUE(mac_address, ip_address)
);

CREATE TABLE IF NOT EXISTS UnApprovedAddresses (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  mac_address  TEXT NOT NULL,
  ip_address   TEXT NOT NULL,
  description  TEXT,
  vendor       TEXT,
  first_seen   TEXT,
  last_seen    TEXT,
  UNIQUE(mac_address, ip_address)
);

CREATE TABLE IF NOT EXISTS Users (
  username      TEXT PRIMARY KEY,
  password      TEXT
);

CREATE TABLE IF NOT EXISTS PlannedScans
(
  interval INTEGER NOT NULL PRIMARY KEY,
  last_scanned_at DATETIME ,
  next_scan_at DATETIME,
  scan_target TEXT NOT NULL 
)
