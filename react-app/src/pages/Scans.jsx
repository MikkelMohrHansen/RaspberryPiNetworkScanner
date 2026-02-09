import { useEffect, useMemo, useState } from "react";
import { Scan, Clock, PauseCircle, Zap, Trash2, RefreshCw } from "lucide-react";

const API_BASE = (import.meta?.env?.VITE_API_URL || "http://127.0.0.1:5000/api/v1").replace(/\/$/, "");

function Card({ title, children, right }) {
  return (
    <section className="rounded-2xl border border-foreground/10 bg-background/70 backdrop-blur-md shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-foreground/10 px-4 py-3">
        <h3 className="text-sm font-semibold tracking-wide">{title}</h3>
        {right ? <div className="text-xs text-foreground/60">{right}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Table({ columns, children }) {
  return (
    <div className="overflow-auto rounded-xl border border-foreground/10">
      <table className="w-full table-fixed text-sm">
        <thead className="bg-foreground/5">
          <tr>
            {columns.map((c) => (
              <th key={c} className="whitespace-nowrap px-3 py-2 text-xs font-semibold text-foreground/70">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-foreground/10">{children}</tbody>
      </table>
    </div>
  );
}

function Td({ children, muted, colSpan }) {
  return (
    <td colSpan={colSpan} className={`px-3 py-2 align-top ${muted ? "text-foreground/60" : ""}`}>
      {children}
    </td>
  );
}

function Pill({ children, tone = "neutral" }) {
  const cls = useMemo(() => {
    if (tone === "ok")
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
    if (tone === "warn")
      return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20";
    if (tone === "bad") return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20";
    return "bg-foreground/5 text-foreground/70 border-foreground/10";
  }, [tone]);

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>
      {children}
    </span>
  );
}

function parseSqliteDate(value) {
  if (!value) return null;

  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;

  const [, yy, mo, dd, hh, mm, ss] = m;
  const d = new Date(Number(yy), Number(mo) - 1, Number(dd), Number(hh), Number(mm), Number(ss ?? 0));

  if (Number.isNaN(d.getTime())) return null;
  return d;
}

const DK_TZ = "Europe/Copenhagen";

function formatDateTime(value) {
  const d = parseSqliteDate(value);
  if (!d) return value ? String(value) : "—";

  return new Intl.DateTimeFormat("da-DK", {
    timeZone: DK_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(d);
}

function fromNowLabel(value) {
  const d = parseSqliteDate(value);
  if (!d) return "—";

  const now = new Date();
  const nowDkStr = new Intl.DateTimeFormat("sv-SE", {
    timeZone: DK_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(now); // "YYYY-MM-DD HH:MM:SS"

  const nowDk = parseSqliteDate(nowDkStr);
  const diffMs = d.getTime() - (nowDk?.getTime() ?? Date.now());

  const diffMin = Math.round(diffMs / 60000);
  if (diffMin <= 0) return "nu / forfalden";
  if (diffMin === 1) return "om 1 min";
  return `om ${diffMin} min`;
}

async function apiJson(path, { method = "GET", body, signal } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    signal,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? ` – ${text}` : ""}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return null;
  return res.json();
}

export const Scans = () => {
  const [cidr, setCidr] = useState("192.168.1.0/24");
  const [intervalMin, setIntervalMin] = useState(30);

  const [scheduled, setScheduled] = useState([]);
  const [dueCount, setDueCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busyKeys, setBusyKeys] = useState(() => new Set());

  const refresh = async () => {
    const [all, due] = await Promise.all([apiJson("/plannedScans/all"), apiJson("/plannedScans/due")]);
    setScheduled(Array.isArray(all) ? all : []);
    setDueCount(Array.isArray(due) ? due.length : 0);
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");
        await refresh();
      } catch (e) {
        setErr(e?.message || "Kunne ikke hente planned scans");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setBusy = (key, on) => {
    setBusyKeys((s) => {
      const next = new Set(s);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const handlePlanScan = async () => {
    const interval = Number(intervalMin || 1);
    const target = (cidr || "").trim();

    if (!target) return setErr("CIDR / Range mangler");
    if (!Number.isFinite(interval) || interval <= 0) return setErr("Interval skal være > 0");

    const key = `plan:${interval}|${target}`;

    try {
      setErr("");
      setBusy(key, true);

      await apiJson("/planScan", {
        method: "POST",
        body: { interval, scan_target: target },
      });

      await refresh();
    } catch (e) {
      setErr(e?.message || "Kunne ikke planlægge scan");
    } finally {
      setBusy(key, false);
    }
  };

  const handleDelete = async (row) => {
    const interval = row?.interval;
    if (interval == null) return;

    const key = `del:${interval}`;

    try {
      setErr("");
      setBusy(key, true);

      await apiJson("/plannedScans/delete", {
        method: "DELETE",
        body: { interval },
      });

      await refresh();
    } catch (e) {
      setErr(e?.message || "Kunne ikke slette planned scan");
    } finally {
      setBusy(key, false);
    }
  };

  return (
    <section className="relative min-h-screen px-4 pt-16">
      <div className="mx-auto w-full max-w-9xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">IP-håndtering</h2>

            <div className="flex items-center gap-2">
              {loading ? <Pill>Henter…</Pill> : null}
              {err ? <Pill tone="bad">Fejl</Pill> : null}
              <span className="text-xs text-foreground/60">API: {API_BASE}</span>
            </div>
          </div>
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="lg:sticky lg:top-20 lg:h-[calc(80vh-5em)]">
            <div className="rounded-2xl border border-foreground/10 bg-background/70 backdrop-blur-md shadow-sm">
              {/* Brand */}
              <div className="flex items-center gap-3 border-b border-foreground/10 px-4 py-4">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-foreground/5">
                  <Scan className="h-5 w-5 text-foreground/80" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base font-semibold leading-tight">Netværksscanner</h1>
                  <p className="text-xs text-foreground/60">
                    Scanning • DB-Check{" "}
                    {dueCount > 0 ? (
                      <span className="ml-2">
                        <Pill tone="warn">{dueCount} due</Pill>
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>

              <div className="space-y-4 p-4">
                <div className="space-y-2">
                  <div className="grid gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm font-medium hover:bg-foreground/10 active:scale-[0.99]"
                      onClick={() => refresh().catch(() => {})}
                    >
                      <RefreshCw className="h-5 w-5" />
                      Opdater
                    </button>
                  </div>
                </div>

                {/* Settings */}
                <div className="space-y-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground/60">Indstillinger</h2>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-foreground/70">CIDR / Range</span>
                    <input
                      value={cidr}
                      onChange={(e) => setCidr(e.target.value)}
                      className="w-full rounded-xl border border-foreground/10 bg-background px-3 py-2 text-sm outline-none ring-0 placeholder:text-foreground/40 focus:border-foreground/20 focus:outline-none"
                      placeholder="192.168.1.0/24"
                    />
                  </label>
                </div>

                {/* Schedule */}
                <div className="space-y-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground/60">Planlæg Scan</h2>

                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-foreground/70">Scan-interval (minutter)</span>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={1}
                        value={intervalMin}
                        onChange={(e) => setIntervalMin(Number(e.target.value || 1))}
                        className="w-full rounded-xl border border-foreground/10 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/20"
                      />
                      <button
                        type="button"
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm font-medium hover:bg-foreground/10 active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none"
                        onClick={handlePlanScan}
                        disabled={busyKeys.has(`plan:${Number(intervalMin || 1)}|${(cidr || "").trim()}`)}
                      >
                        <Clock className="h-5 w-5" />
                        Planlæg
                      </button>
                    </div>
                    <div className="mt-2 text-xs text-foreground/60">
                      Opretter en row i <code className="px-1">PlannedScans</code> med{" "}
                      <code className="px-1">interval</code> og <code className="px-1">scan_target</code>.
                    </div>
                  </label>
                </div>

                {/* Errors */}
                {loading ? <Pill>Henter…</Pill> : null}
                {err ? (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
                    {err}
                  </div>
                ) : null}
                <div className="text-[11px] text-foreground/50">API: {API_BASE}</div>
              </div>
            </div>
          </aside>

          {/* MAIN */}
          <main className="space-y-6 pb-10">
            <div className="grid gap-6">
              <Card
                title="Planlagte Scans"
                right={
                  <Pill tone="neutral">
                    {scheduled.filter((x) => x?.next_scan_at != null).length} aktiv / {scheduled.length} total
                  </Pill>
                }
              >
                <Table columns={["IP Range", "Interval (min)", "Næste kørsel", "Status", "Handlinger"]}>
                  {scheduled.length === 0 ? (
                    <tr>
                      <Td muted colSpan={5}>
                        {loading ? "Henter…" : "Ingen planlagte scans endnu."}
                      </Td>
                    </tr>
                  ) : (
                    scheduled.map((row) => {
                      const interval = row?.interval;
                      const target = row?.scan_target;
                      const next = row?.next_scan_at;
                      const isPaused = !next;
                      const stopKey = `stop:${interval}|${target}`;
                      const runKey = `run:${interval}|${target}`;
                      const delKey = `del:${interval}`;
                      const busy = busyKeys.has(stopKey) || busyKeys.has(runKey) || busyKeys.has(delKey);

                      return (
                        <tr key={`${interval}|${target}`} className="hover:bg-foreground/5">
                          <Td>{target || "—"}</Td>
                          <Td>{interval != null ? `${interval} min` : "—"}</Td>
                          <Td muted>
                            {next ? (
                              <div className="space-y-0.5">
                                <div>{formatDateTime(next)}</div>
                                <div className="text-xs text-foreground/50">{fromNowLabel(next)}</div>
                              </div>
                            ) : (
                              "—"
                            )}
                          </Td>
                          <Td>{isPaused ? <Pill tone="warn">Pauset</Pill> : <Pill tone="ok">Aktiv</Pill>}</Td>
                          <Td>
                            <div className="flex justify-center">
                              <button
                                className={`inline-flex items-center gap-2 rounded-lg border border-foreground/10 bg-background px-2 py-1 text-xs hover:bg-foreground/5 ${
                                  busy ? "opacity-60 pointer-events-none" : ""
                                }`}
                                onClick={() => handleDelete(row)}
                                title="Slet (DELETE by interval)"
                              >
                                <Trash2 className="h-4 w-4" />
                                Slet
                              </button>
                            </div>
                          </Td>
                        </tr>
                      );
                    })
                  )}
                </Table>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </section>
  );
};
