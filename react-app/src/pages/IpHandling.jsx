import { useMemo } from "react";

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

export const IpHandling = () => {
  const allowed = [
    { ip: "10.27.64.79", mac: "11:22:33:44:55:66", desc: "Router (Gateway)", reg: "2026-02-02", status: "Tilladt" },
  ];

  const unknown = [
    { ip: "10.27.64.79", mac: "DE:AD:BE:EF:CA:FA", vendor: "Unknown", status: "Ny" },
    { ip: "10.27.64.78", mac: "DE:AD:BE:EF:CA:FB", vendor: "Unknown", status: "Ny" },
    { ip: "10.27.64.77", mac: "DE:AD:BE:EF:CA:FC", vendor: "Unknown", status: "Ny" },
    { ip: "10.27.64.76", mac: "DE:AD:BE:EF:CA:FD", vendor: "Unknown", status: "Ny" },
    { ip: "10.27.64.75", mac: "DE:AD:BE:EF:CA:FE", vendor: "Unknown", status: "Ny" },
    { ip: "10.27.64.74", mac: "DE:AD:BE:EF:CA:FF", vendor: "Unknown", status: "Ny" },
    { ip: "10.27.64.73", mac: "DE:AD:BE:EF:CA:CA", vendor: "Unknown", status: "Ny" },
  ];

  return (
    <section className="relative min-h-screen px-4 pt-16">
      <div className="mx-auto w-full max-w-7xl pb-10">
        <h2 className="mb-4 text-lg font-semibold">IP-håndtering</h2>

        {/* Mere bredde til tables:
            - én kolonne på mindre skærme
            - 2 kolonner på store (kan ændres til xl:grid-cols-2 hvis du vil have det senere) */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Tilladte IP'er" right={<Pill tone="ok">{allowed.length} tilladt</Pill>}>
            <Table columns={["IP", "MAC-adresse", "Beskrivelse", "Registreret", "Status", "Handlinger"]}>
              {allowed.map((row, idx) => (
                <tr key={idx} className="hover:bg-foreground/5">
                  <Td>{row.ip}</Td>
                  <Td muted>{row.mac}</Td>
                  <Td muted>{row.desc}</Td>
                  <Td muted>{row.reg}</Td>
                  <Td><Pill tone="ok">{row.status}</Pill></Td>
                  <Td>
                    <button
                      className="rounded-lg border border-foreground/10 bg-background px-2 py-1 text-xs hover:bg-foreground/5"
                      onClick={() => alert("TODO: Fjern fra tilladte")}
                    >
                      Fjern
                    </button>
                  </Td>
                </tr>
              ))}
            </Table>
          </Card>

          <Card title="Ukendte IP'er" right={<Pill tone="warn">{unknown.length} ukendt</Pill>}>
            <Table columns={["IP-adresse", "MAC-adresse", "Producent", "Status", "Tillad"]}>
              {unknown.map((row, idx) => (
                <tr key={idx} className="hover:bg-foreground/5">
                  <Td>{row.ip}</Td>
                  <Td muted>{row.mac}</Td>
                  <Td>{row.vendor}</Td>
                  <Td><Pill tone="warn">{row.status}</Pill></Td>
                  <Td>
                    <button
                      className="rounded-lg border border-foreground/10 bg-background px-2 py-1 text-xs hover:bg-foreground/5"
                      onClick={() => alert(`TODO: Tillad ${row.ip}`)}
                    >
                      Tillad
                    </button>
                  </Td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
      </div>
    </section>
  );
};
