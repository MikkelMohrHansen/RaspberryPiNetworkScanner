import { useEffect, useMemo, useState } from "react";
import { Play, Plus, Scan, RefreshCw } from "lucide-react";
import { AddIpModal } from "@/components/AddIpModal";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

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
              <th key={c} className="px-3 py-2 text-left text-xs font-semibold text-foreground/70">
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

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("da-DK", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function fetchJson(url, { method = "GET", body, signal } = {}) {
  const res = await fetch(url, {
    credentials: "include",
    method,
    signal,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? ` – ${text}` : ""}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;
  return res.json();
}

export const IpHandling = () => {
  const [addOpen, setAddOpen] = useState(false);

  // ✅ Edit modal state (FIX)
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editSource, setEditSource] = useState("approved"); // "approved" | "unapproved"

  const [allowed, setAllowed] = useState([]);
  const [unknown, setUnknown] = useState([]);
  const [cidr, setCidr] = useState("192.168.1.0/24");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyMacs, setBusyMacs] = useState(() => new Set());

  const refreshLists = async () => {
    const [approvedData, unapprovedData] = await Promise.all([
      fetchJson(`${API_BASE}/getApproved`),
      fetchJson(`${API_BASE}/getUnapproved`),
    ]);
    setAllowed(Array.isArray(approvedData) ? approvedData : []);
    setUnknown(Array.isArray(unapprovedData) ? unapprovedData : []);
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        await refreshLists();
      } catch (e) {
        setError(e?.message || "Kunne ikke hente data fra API");
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const showToast = (message) => {
    setToast(message);

    const clear = () => {
      setToast(null);
      window.removeEventListener("click", clear);
    };

    window.setTimeout(() => {
      window.addEventListener("click", clear, { once: true });
    }, 0);

    window.setTimeout(clear, 1000);
  };

  const handleStartScan = async () => {
    const target = (cidr || "").trim();
    if (!target) return setError("CIDR / Range mangler");

    try {
      setError("");
      showToast("Scan startet");

      await fetchJson(`${API_BASE}/StartScan`, {
        method: "POST",
        body: { scan_target: target },
      });

      await refreshLists(); // ✅ auto-refetch efter scan
    } catch (e) {
      setError(e?.message || "Kunne ikke starte scan");
    }
  };

  const handleDisallow = async (row) => {
    const mac = row?.mac_address;
    const ip = row?.ip_address;
    if (!mac || !ip) return;

    const key = `${mac}|${ip}`;
    const prevUnknown = unknown;
    const prevAllowed = allowed;

    setBusyMacs((s) => new Set([...s, key]));
    setError("");

    // Optimistisk UI
    setAllowed((list) => list.filter((x) => !(x?.mac_address === mac && x?.ip_address === ip)));
    setUnknown((list) => [
      {
        mac_address: mac,
        ip_address: ip,
        description: row.description ?? "",
        vendor: row.vendor ?? null,
        first_seen: row.first_seen ?? null,
        last_seen: row.last_seen ?? null,
      },
      ...list,
    ]);

    try {
      // først slet fra Approved
      await fetchJson(`${API_BASE}/removeApproved`, {
        method: "DELETE",
        body: { mac_address: mac, ip_address: ip },
      });

      // derefter add til Unapproved
      await fetchJson(`${API_BASE}/addUnapproved`, {
        method: "POST",
        body: {
          mac_address: mac,
          ip_address: ip,
          description: row.description ?? null,
          vendor: row.vendor ?? null,
          first_seen: row.first_seen ?? null,
          last_seen: row.last_seen ?? null,
        },
      });

      await refreshLists();
    } catch (e) {
      setUnknown(prevUnknown);
      setAllowed(prevAllowed);
      setError(e?.message || "Kunne ikke fjerne tilladelse (API fejl)");
      console.error(e);
    } finally {
      setBusyMacs((s) => {
        const next = new Set(s);
        next.delete(key);
        return next;
      });
    }
  };

  const handleAllow = async (row) => {
    const mac = row?.mac_address;
    const ip = row?.ip_address;
    if (!mac || !ip) return;

    const key = `${mac}|${ip}`;
    const prevUnknown = unknown;
    const prevAllowed = allowed;

    setBusyMacs((s) => new Set([...s, key]));
    setError("");

    // Optimistisk UI
    setUnknown((list) => list.filter((x) => !(x?.mac_address === mac && x?.ip_address === ip)));
    setAllowed((list) => [
      {
        mac_address: mac,
        ip_address: ip,
        description: row.description ?? "",
        vendor: row.vendor ?? null,
        first_seen: row.first_seen ?? null,
        last_seen: row.last_seen ?? null,
      },
      ...list,
    ]);

    try {
      await fetchJson(`${API_BASE}/addApproved`, {
        method: "POST",
        body: {
          mac_address: mac,
          ip_address: ip,
          description: row.description ?? null,
          vendor: row.vendor ?? null,
          first_seen: row.first_seen ?? null,
          last_seen: row.last_seen ?? null,
        },
      });

      await refreshLists();
    } catch (e) {
      setUnknown(prevUnknown);
      setAllowed(prevAllowed);
      setError(e?.message || "Kunne ikke tillade (API fejl)");
      console.error(e);
    } finally {
      setBusyMacs((s) => {
        const next = new Set(s);
        next.delete(key);
        return next;
      });
    }
  };

  const handleRefresh = async () => {
    try {
      setError("");
      setLoading(true);
      await refreshLists();
    } catch (e) {
      setError(e?.message || "Kunne ikke opdatere data");
    } finally {
      setLoading(false);
    }
  };

  const openEditApproved = (row) => {
    setEditSource("approved");
    setEditRow(row);
    setEditOpen(true);
  };

  const openEditUnapproved = (row) => {
    setEditSource("unapproved");
    setEditRow(row);
    setEditOpen(true);
  };

  return (
    <section className="relative min-h-screen px-4 pt-16">
      <div className="mx-auto w-full max-w-10xl pb-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">IP-håndtering</h2>

          <div className="flex items-center gap-2">
            {loading ? <Pill>Henter…</Pill> : null}
            {error ? <Pill tone="bad">Fejl</Pill> : null}
            <span className="text-xs text-foreground/60">API: {API_BASE}</span>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">
            <div className="font-semibold">Der opstod en fejl</div>
            <div className="mt-1 text-xs opacity-80">{error}</div>
          </div>
        ) : null}

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-[320px_1fr]">
          <Card
            title={
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-foreground/5">
                  <Scan className="h-5 w-5 text-foreground/80" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold leading-tight">Netværksscanner</div>
                  <div className="text-xs text-foreground/60">Scanning • DB-Check</div>
                </div>
              </div>
            }
          >
            <div className="grid gap-2">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm font-medium hover:bg-foreground/10 active:scale-[0.99]"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-5 w-5" />
                Opdater
              </button>
              <div className="my-2 h-px w-full bg-foreground/10" />
              <span className="mb-1 block text-xs font-medium text-foreground/70">Indsæt CIDR/Range og kør et Manuelt Scan</span>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm font-medium hover:bg-foreground/10 active:scale-[0.99]"
                onClick={handleStartScan}
              >
                <Play className="h-5 w-5" />
                Manuelt Scan
              </button>

              <div className="mb-2">
                <input
                  value={cidr}
                  type="text"
                  placeholder="192.168.1.0/24"
                  className="w-full rounded-xl border border-foreground/10 bg-background px-3 py-2 text-sm outline-none placeholder:text-foreground/40 focus:border-foreground/20"
                  onChange={(e) => setCidr(e.target.value)}
                />
              </div>

              <div className="my-2 h-px w-full bg-foreground/10" />

              <span className="mb-1 block text-xs font-medium text-foreground/70">Manuelt indsæt en ny godkendt IP</span>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm font-medium hover:bg-foreground/10 active:scale-[0.99]"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-5 w-5" />
                Tillad ny IP
              </button>
            </div>
          </Card>

          <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
            <Card title="Tilladte IP'er" right={<Pill tone="ok">{allowed.length} tilladt</Pill>}>
              <Table columns={["IP", "MAC-adresse", "Vendor", "Beskrivelse", "Sidst set", "Handlinger"]}>
                {allowed.length === 0 ? (
                  <tr>
                    <Td muted colSpan={6}>
                      {loading ? "Henter data…" : "Ingen tilladte IP'er endnu."}
                    </Td>
                  </tr>
                ) : (
                  allowed.map((row) => {
                    const key = `${row.mac_address}|${row.ip_address}`;
                    const isBusy = busyMacs.has(key);

                    return (
                      <tr key={key} className="hover:bg-foreground/5">
                        <Td>{row.ip_address || "—"}</Td>
                        <Td muted>{row.mac_address || "—"}</Td>
                        <Td muted>
                          <span
                            className="block text-xs text-foreground/60 max-w-[140px]"
                            title={row.vendor || ""}
                            style={{
                              display: "-webkit-box",
                              WebkitBoxOrient: "vertical",
                              WebkitLineClamp: 2,
                              overflow: "hidden",
                            }}
                          >
                            {row.vendor || "—"}
                          </span>
                        </Td>
                        <Td muted>{row.description || "—"}</Td>
                        <Td muted>{row.last_seen}</Td>
                        <Td>
                          <div className="flex flex-wrap gap-2">
                            <button
                              className={`rounded-lg border border-foreground/10 bg-background px-2 py-1 text-xs hover:bg-foreground/5 ${
                                isBusy ? "opacity-60 pointer-events-none" : ""
                              }`}
                              onClick={() => handleDisallow(row)}
                            >
                              Fjern
                            </button>
                            <button
                              className="rounded-lg border border-foreground/10 bg-background px-2 py-1 text-xs hover:bg-foreground/5"
                              onClick={() => openEditApproved(row)}
                            >
                              Rediger
                            </button>
                          </div>
                        </Td>
                      </tr>
                    );
                  })
                )}
              </Table>
            </Card>

            <Card title="Ukendte IP'er" right={<Pill tone="warn">{unknown.length} ukendt</Pill>}>
              <Table columns={["IP-adresse", "MAC-adresse", "Vendor", "Beskrivelse", "Sidst set", "Handlinger"]}>
                {unknown.length === 0 ? (
                  <tr>
                    <Td muted colSpan={6}>
                      {loading ? "Henter data…" : "Ingen ukendte IP'er lige nu."}
                    </Td>
                  </tr>
                ) : (
                  unknown.map((row) => {
                    const key = `${row.mac_address}|${row.ip_address}`;
                    const isBusy = busyMacs.has(key);

                    return (
                      <tr key={key} className="hover:bg-foreground/5">
                        <Td>{row.ip_address || "—"}</Td>
                        <Td muted>{row.mac_address || "—"}</Td>
                        <Td muted>
                          <span
                            className="block text-xs text-foreground/60 max-w-[140px]"
                            title={row.vendor || ""}
                            style={{
                              display: "-webkit-box",
                              WebkitBoxOrient: "vertical",
                              WebkitLineClamp: 2,
                              overflow: "hidden",
                            }}
                          >
                            {row.vendor || "—"}
                          </span>
                        </Td>
                        <Td muted>{row.description || "—"}</Td>
                        <Td muted>{formatDateTime(row.last_seen)}</Td>
                        <Td>
                          <div className="flex flex-wrap gap-2">
                            <button
                              className={`rounded-lg border border-foreground/10 bg-background px-2 py-1 text-xs hover:bg-foreground/5 ${
                                isBusy ? "opacity-60 pointer-events-none" : ""
                              }`}
                              onClick={() => handleAllow(row)}
                            >
                              {isBusy ? "Arbejder…" : "Tillad"}
                            </button>
                            <button
                              className="rounded-lg border border-foreground/10 bg-background px-2 py-1 text-xs hover:bg-foreground/5"
                              onClick={() => openEditUnapproved(row)}
                            >
                              Rediger
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
        </div>
      </div>

      {toast ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/40">
          <div className="rounded-3xl border border-foreground/10 bg-background px-8 py-6 shadow-2xl backdrop-blur">
            <div className="text-lg font-semibold text-center">✅ {toast}</div>
          </div>
        </div>
      ) : null}

      {/* Create */}
      <AddIpModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        apiBase={API_BASE}
        mode="create"
        source="approved"
        onCreated={async () => {
          await refreshLists();
        }}
      />

      {/* Edit */}
      <AddIpModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        apiBase={API_BASE}
        mode="edit"
        source={editSource}
        initialValues={editRow}
        onCreated={refreshLists}
      />
    </section>
  );
};
