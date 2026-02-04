import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Plus, Scan, File, Clock, PauseCircle, Zap, Trash2, RefreshCw } from "lucide-react";

const API_BASE = (import.meta?.env?.VITE_API_URL || "http://192.168.1.200:5000/api/v1").replace(/\/$/, "");

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
              <th
                key={c}
                className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-foreground/70"
              >
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
    if (tone === "ok") return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
    if (tone === "warn") return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20";
    if (tone === "bad") return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20";
    return "bg-foreground/5 text-foreground/70 border-foreground/10";
  }, [tone]);

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>
      {children}
    </span>
  );
}

/** SQLite DATETIME "YYYY-MM-DD HH:MM:SS" -> Date */
function parseSqliteDate(value) {
  if (!value) return null;
  const iso = String(value).replace(" ", "T");
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function formatDateTime(value) {
  const d = parseSqliteDate(value);
  if (!d) return value ? String(value) : "—";
  return d.toLocaleString("da-DK", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function fromNowLabel(value) {
  const d = parseSqliteDate(value);
  if (!d) return "—";
  const diffMs = d.getTime() - Date.now();
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
  const [cidr, setCidr] = useState("10.27.64.0/24");
  const [intervalMin, setIntervalMin] = useState(30);
  const [logsOpen, setLogsOpen] = useState(false);

  const [scheduled, setScheduled] = useState([]); // PlannedScans rows
  const [dueCount, setDueCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busyKeys, setBusyKeys] = useState(() => new Set()); // per action row busy

  const [logs, setLogs] = useState(() => []);

  const addLog = (msg) => {
    const t = new Date().toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs((l) => [{ t, msg }, ...l].slice(0, 200));
  };

  const refresh = async () => {
    const [all, due] = await Promise.all([
      apiJson("/plannedScans/all"),
      apiJson("/plannedScans/due"),
    ]);
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

  const handleStartScan = async () => {
    try {
      setErr("");
      addLog(`Starter scan (server-side)`);
      await apiJson("/StartScan", { method: "POST" });
      addLog("Scan startet (endpoint OK)");
      setLogsOpen(true);
    } catch (e) {
      setErr(e?.message || "Kunne ikke starte scan");
      addLog(`FEJL: StartScan – ${e?.message || "ukendt fejl"}`);
    }
  };

  const handlePlanScan = async () => {
    const interval = Number(intervalMin || 1);
    const target = (cidr || "").trim();

    if (!target) {
      setErr("CIDR / Range mangler");
      return;
    }
    if (!Number.isFinite(interval) || interval <= 0) {
      setErr("Interval skal være > 0");
      return;
    }

    const key = `plan:${interval}|${target}`;
    try {
      setErr("");
      setBusy(key, true);

      addLog(`Planlægger scan: ${target} (hver ${interval} min)`);
      await apiJson("/planScan", {
        method: "POST",
        body: { interval, scan_target: target },
      });

      addLog("Planlagt scan oprettet");
      await refresh();
    } catch (e) {
      setErr(e?.message || "Kunne ikke planlægge scan");
      addLog(`FEJL: planScan – ${e?.message || "ukendt fejl"}`);
    } finally {
      setBusy(key, false);
    }
  };

  const handleStop = async (row) => {
    const target = row?.scan_target;
    if (!target) return;

    const key = `stop:${row.interval}|${target}`;
    try {
      setErr("");
      setBusy(key, true);

      addLog(`Stopper planlagt scan (pause): ${target}`);
      await apiJson("/plannedScans/clearNext", {
        method: "PUT",
        body: { scan_target: target },
      });

      addLog("Scan pauset (next_scan_at = null)");
      await refresh();
    } catch (e) {
      setErr(e?.message || "Kunne ikke stoppe scan");
      addLog(`FEJL: clearNext – ${e?.message || "ukendt fejl"}`);
    } finally {
      setBusy(key, false);
    }
  };

  const handleRunNow = async (row) => {
    const target = row?.scan_target;
    if (!target) return;

    const key = `run:${row.interval}|${target}`;
    try {
      setErr("");
      setBusy(key, true);

      addLog(`Kører scan nu: ${target}`);
      await apiJson("/StartScan", { method: "POST" });

      // Touch: sæt last=now og next=now+interval (på serveren)
      await apiJson("/plannedScans/touch", {
        method: "PUT",
        body: { scan_target: target },
      });

      addLog("Scan startet + schedule opdateret (touch)");
      await refresh();
      setLogsOpen(true);
    } catch (e) {
      setErr(e?.message || "Kunne ikke køre scan nu");
      addLog(`FEJL: RunNow – ${e?.message || "ukendt fejl"}`);
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

      addLog(`Sletter planned scan (interval=${interval})`);
      await apiJson("/plannedScans/delete", {
        method: "DELETE",
        body: { interval },
      });

      addLog("Planned scan slettet");
      await refresh();
    } catch (e) {
      setErr(e?.message || "Kunne ikke slette planned scan");
      addLog(`FEJL: delete – ${e?.message || "ukendt fejl"}`);
    } finally {
      setBusy(key, false);
    }
  };

  // Placeholder results (ingen endpoint endnu)
  const results = [];

  return (
    <section className="relative min-h-screen px-4 pt-16">
      <div className="mx-auto w-full max-w-9xl">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* SIDEBAR */}
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
                    Scanning • Logning • DB-Check{" "}
                    {dueCount > 0 ? <span className="ml-2"><Pill tone="warn">{dueCount} due</Pill></span> : null}
                  </p>
                </div>
              </div>

              <div className="space-y-4 p-4">
                {/* Quick actions */}
                <div className="space-y-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    Hurtige handlinger
                  </h2>

                  <div className="grid gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm font-medium hover:bg-foreground/10 active:scale-[0.99]"
                      onClick={handleStartScan}
                    >
                      <Play className="h-5 w-5" />
                      Start scanning
                    </button>

                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm font-medium hover:bg-foreground/10 active:scale-[0.99]"
                      onClick={() => alert("TODO: Tilføj ny IP (UI kommer)")}
                    >
                      <Plus className="h-5 w-5" />
                      Tilføj ny IP
                    </button>

                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm font-medium hover:bg-foreground/10 active:scale-[0.99]"
                      onClick={() => setLogsOpen(true)}
                    >
                      <File className="h-5 w-5" />
                      Logs
                    </button>

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
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    Indstillinger
                  </h2>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-foreground/70">CIDR / Range</span>
                    <input
                      value={cidr}
                      onChange={(e) => setCidr(e.target.value)}
                      className="w-full rounded-xl border border-foreground/10 bg-background px-3 py-2 text-sm outline-none ring-0 placeholder:text-foreground/40 focus:border-foreground/20 focus:outline-none"
                      placeholder="10.27.64.0/24"
                    />
                  </label>
                </div>

                {/* Schedule */}
                <div className="space-y-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    Planlæg Scan
                  </h2>

                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-foreground/70">
                      Scan-interval (minutter)
                    </span>
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
                <div className="text-[11px] text-foreground/50">
                  API: {API_BASE}
                </div>
              </div>
            </div>
          </aside>

          {/* MAIN */}
          <main className="space-y-6 pb-10">
            <div className="grid gap-6 lg:grid-cols-2">
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
                      <Td muted colSpan={5}>{loading ? "Henter…" : "Ingen planlagte scans endnu."}</Td>
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
                          <Td>{interval ?? "—"}</Td>
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
                          <Td>
                            {isPaused ? <Pill tone="warn">Pauset</Pill> : <Pill tone="ok">Aktiv</Pill>}
                          </Td>
                          <Td>
                            <div className="flex flex-wrap gap-2">
                              <button
                                className={`inline-flex items-center gap-2 rounded-lg border border-foreground/10 bg-background px-2 py-1 text-xs hover:bg-foreground/5 ${
                                  busy ? "opacity-60 pointer-events-none" : ""
                                }`}
                                onClick={() => handleRunNow(row)}
                                title="Kør scan nu"
                              >
                                <Zap className="h-4 w-4" />
                                Kør nu
                              </button>

                              <button
                                className={`inline-flex items-center gap-2 rounded-lg border border-foreground/10 bg-background px-2 py-1 text-xs hover:bg-foreground/5 ${
                                  busy ? "opacity-60 pointer-events-none" : ""
                                }`}
                                onClick={() => handleStop(row)}
                                title="Pause (clear next_scan_at)"
                              >
                                <PauseCircle className="h-4 w-4" />
                                Stop
                              </button>

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

                <div className="mt-3 text-xs text-foreground/60">
                  Tip: <b>Stop</b> sætter <code className="px-1">next_scan_at</code> til <code className="px-1">NULL</code>.{" "}
                  <b>Kør nu</b> starter scan + <code className="px-1">touch</code> for at rykke schedule frem.
                </div>
              </Card>

              <Card
                title="Scan resultater (placeholder)"
                right={<Pill tone="neutral">{results.length} fundet</Pill>}
              >
                <Table columns={["IP", "MAC-adresse", "Producent", "Status", "Sidst set"]}>
                  {results.length === 0 ? (
                    <tr>
                      <Td muted colSpan={5}>
                        Ingen resultater endnu (vi mangler endpoint til scan results).
                      </Td>
                    </tr>
                  ) : null}
                </Table>
              </Card>
            </div>
          </main>
        </div>
      </div>

      {/* LOGS MODAL */}
      {logsOpen ? (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setLogsOpen(false);
          }}
        >
          <div className="w-full max-w-2xl rounded-2xl border border-foreground/10 bg-background shadow-xl">
            <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-3">
              <div className="text-sm font-semibold">Logs (frontend)</div>
              <button
                className="rounded-lg border border-foreground/10 bg-foreground/5 px-2 py-1 text-sm hover:bg-foreground/10"
                onClick={() => setLogsOpen(false)}
              >
                &times;
              </button>
            </div>

            <div className="max-h-[60vh] overflow-auto p-4">
              <div className="space-y-2">
                {logs.length === 0 ? (
                  <div className="text-sm text-foreground/60">Ingen logs endnu.</div>
                ) : (
                  logs.map((l, i) => (
                    <div key={i} className="rounded-xl border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm">
                      <div className="text-xs text-foreground/60">{l.t}</div>
                      <div className="text-foreground/80">{l.msg}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-foreground/10 px-4 py-3">
              <button
                className="rounded-xl border border-foreground/10 bg-background px-3 py-2 text-sm hover:bg-foreground/5"
                onClick={() => setLogs([])}
              >
                Ryd
              </button>
              <button
                className="rounded-xl border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm hover:bg-foreground/10"
                onClick={() => setLogsOpen(false)}
              >
                Luk
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};
