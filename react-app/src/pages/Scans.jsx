import { useMemo, useState } from "react";
import { Play, Plus, Scan, File, Clock } from "lucide-react";

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
      <table className="w-full text-sm">
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

function Td({ children, muted }) {
  return <td className={`px-3 py-2 align-top ${muted ? "text-foreground/60" : ""}`}>{children}</td>;
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

export const Scans = () => {
  const [cidr, setCidr] = useState("10.27.64.0/24");
  const [intervalMin, setIntervalMin] = useState(30);
  const [logsOpen, setLogsOpen] = useState(false);

  const scheduled = [
    { range: "10.27.64.0/24", interval: "30 min", next: "om 12 min" },
  ];

  const results = [
    { ip: "10.27.64.10", mac: "AA:BB:CC:DD:EE:FF", vendor: "Ubiquiti", status: "OK", last: "for 2 min siden" },
  ];

  const logs = [
    { t: "11:22:01", msg: "Scan startet: 10.27.64.0/24" },
    { t: "11:22:09", msg: "Fundet 14 enheder (2 ukendte)" },
    { t: "11:22:15", msg: "DB-check færdig" },
  ];

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
                <div>
                  <h1 className="text-base font-semibold leading-tight">Netværksscanner</h1>
                  <p className="text-xs text-foreground/60">Scanning • Logning • DB-Check</p>
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
                      onClick={() => setLogsOpen(true)}
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
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm font-medium hover:bg-foreground/10 active:scale-[0.99]"
                        onClick={() => alert(`TODO: Planlæg scan\nRange: ${cidr}\nInterval: ${intervalMin} min`)}
                      >
                        <Clock className="h-5 w-5" />
                        Planlæg
                      </button>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </aside>

          {/* MAIN */}
          <main className="space-y-6 pb-10">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card title="Planlagte Scans" right={<Pill tone="neutral">{scheduled.length} aktiv</Pill>}>
                <Table columns={["IP Range", "Interval", "Næste Kørsel", "Handlinger"]}>
                  {scheduled.map((row, idx) => (
                    <tr key={idx} className="hover:bg-foreground/5">
                      <Td>{row.range}</Td>
                      <Td>{row.interval}</Td>
                      <Td>{row.next}</Td>
                      <Td>
                        <button
                          className="rounded-lg border border-foreground/10 bg-background px-2 py-1 text-xs hover:bg-foreground/5"
                          onClick={() => alert("TODO: Stop planlagt scan")}
                        >
                          Stop
                        </button>
                      </Td>
                    </tr>
                  ))}
                </Table>
              </Card>

              <Card title="Scan resultater (Alle fundne enheder)" right={<Pill tone="ok">{results.length} fundet</Pill>}>
                <Table columns={["IP", "MAC-adresse", "Producent", "Status", "Sidst set"]}>
                  {results.map((row, idx) => (
                    <tr key={idx} className="hover:bg-foreground/5">
                      <Td>{row.ip}</Td>
                      <Td muted>{row.mac}</Td>
                      <Td>{row.vendor}</Td>
                      <Td><Pill tone={row.status === "OK" ? "ok" : "warn"}>{row.status}</Pill></Td>
                      <Td muted>{row.last}</Td>
                    </tr>
                  ))}
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
              <div className="text-sm font-semibold">Logs</div>
              <button
                className="rounded-lg border border-foreground/10 bg-foreground/5 px-2 py-1 text-sm hover:bg-foreground/10"
                onClick={() => setLogsOpen(false)}
              >
                &times;
              </button>
            </div>

            <div className="max-h-[60vh] overflow-auto p-4">
              <div className="space-y-2">
                {logs.map((l, i) => (
                  <div key={i} className="rounded-xl border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm">
                    <div className="text-xs text-foreground/60">{l.t}</div>
                    <div className="text-foreground/80">{l.msg}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-foreground/10 px-4 py-3">
              <button
                className="rounded-xl border border-foreground/10 bg-background px-3 py-2 text-sm hover:bg-foreground/5"
                onClick={() => alert("TODO: Clear logs")}
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
