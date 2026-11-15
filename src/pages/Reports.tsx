// src/pages/Reports.tsx
// Organized into Population / Recently Added / Land register groups.
// Each report uses a different chart type for variety.
// Percentages are shown for distribution-type reports (single-dimension).
import { useEffect, useState } from "react";
import { reportsApi } from "../api";
import type { ReportType, ReportResult } from "../types";

// Chart type per report — gives visual variety.
type ChartKind = "bar" | "hbar" | "donut" | "stacked" | "grouped";

interface ReportMeta {
  type: ReportType;
  label: string;
  description: string;
  group: "population" | "recent" | "land";
  chart: ChartKind;
  // Whether to show a % column (single-dimension distribution reports).
  showPercent?: boolean;
}

const REPORTS: ReportMeta[] = [
  // ---- Population register ----
  { type: "residents_per_village", label: "Residents per village", description: "Total resident count for each village.", group: "population", chart: "hbar", showPercent: true },
  { type: "gender_per_village",   label: "Gender per village",    description: "Male / Female counts broken down by village.", group: "population", chart: "grouped" },
  { type: "by_tribe_and_clan",    label: "By tribe & clan",       description: "Resident counts grouped by tribe and clan.", group: "population", chart: "stacked" },
  { type: "by_employment",        label: "By employment status",  description: "How many residents fall in each employment category.", group: "population", chart: "donut", showPercent: true },
  { type: "by_marital",            label: "By marital status",     description: "Marital status distribution across all residents.", group: "population", chart: "donut", showPercent: true },
  { type: "by_education",          label: "By education level",   description: "Highest education level reached.", group: "population", chart: "donut", showPercent: true },
  { type: "age_distribution",      label: "Age distribution",     description: "Bucketed: 0–17, 18–35, 36–60, 60+.", group: "population", chart: "bar", showPercent: true },
  // ---- Recently added registers ----
  { type: "deaths_per_village",          label: "Deaths per village",        description: "Death records per village.", group: "recent", chart: "hbar", showPercent: true },
  { type: "births_per_village",          label: "Births per village",          description: "Birth records per village.", group: "recent", chart: "hbar", showPercent: true },
  { type: "marriages_per_village",       label: "Marriages per village",      description: "Marriage records per village.", group: "recent", chart: "hbar", showPercent: true },
  { type: "people_movement_by_direction", label: "Movement by direction",     description: "Arriving vs leaving counts.", group: "recent", chart: "donut", showPercent: true },
  { type: "disabled_per_village",        label: "Disabled per village",      description: "Disabled persons per village.", group: "recent", chart: "hbar", showPercent: true },
  // ---- Land register ----
  { type: "houses_by_type",       label: "Houses by type",       description: "Distribution of house construction types.", group: "land", chart: "donut", showPercent: true },
  { type: "projects_by_status",   label: "Projects by status",   description: "Community projects grouped by status.", group: "land", chart: "bar", showPercent: true },
  { type: "schools_by_type",      label: "Schools by type",       description: "Schools grouped by type.", group: "land", chart: "donut", showPercent: true },
  { type: "tenants_per_village",  label: "Tenants per village",  description: "Tenant count per village.", group: "land", chart: "hbar", showPercent: true },
];

const GROUP_LABELS: Record<ReportMeta["group"], string> = {
  population: "Population Register",
  recent: "Recently Added Registers",
  land: "Land Register",
};

const PALETTE = ["#3377f6", "#22c55e", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#ef4444", "#64748b"];

export default function Reports() {
  const [active, setActive] = useState<ReportType>("residents_per_village");
  const [report, setReport] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    reportsApi.get(active)
      .then(setReport)
      .finally(() => setLoading(false));
  }, [active]);

  const activeMeta = REPORTS.find((r) => r.type === active);
  const total = report ? report.rows.reduce((s, r) => s + r.count, 0) : 0;
  const hasSublabel = report ? report.columns.length === 3 : false;

  function exportCsv() {
    if (!report) return;
    const showPct = !!activeMeta?.showPercent && !hasSublabel;
    const cols = [...report.columns];
    if (showPct) cols.push("% of total");
    const lines: string[] = [];
    lines.push(cols.map(csvEscape).join(","));
    for (const row of report.rows) {
      const cells = [row.label, row.sublabel ?? "", String(row.count)];
      const out = hasSublabel ? cells : [cells[0], cells[2]];
      if (showPct) {
        out.push(`${total > 0 ? ((row.count / total) * 100).toFixed(1) : "0"}%`);
      }
      lines.push(out.map(csvEscape).join(","));
    }
    const csv = lines.join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${active}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Group the report buttons by their group.
  const groups = (["population", "recent", "land"] as const).map((g) => ({
    group: g,
    label: GROUP_LABELS[g],
    items: REPORTS.filter((r) => r.group === g),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Reports</h1>
        <button onClick={exportCsv} className="btn-secondary" disabled={!report || loading}>
          Export CSV
        </button>
      </div>

      {/* Report selector — grouped */}
      <div className="space-y-4">
        {groups.map((g) => (
          <div key={g.group}>
            <h2 className="text-sm font-semibold text-slate-700 mb-2">{g.label}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {g.items.map((r) => (
                <button
                  key={r.type}
                  onClick={() => setActive(r.type)}
                  className={`text-left p-3 rounded-md border transition ${
                    active === r.type
                      ? "border-brand-500 bg-brand-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="text-sm font-medium text-slate-800">{r.label}</div>
                  <div className="text-xs text-slate-500 mt-1">{r.description}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Report chart + table */}
      <div className="card">
        <div className="card-body">
          <h2 className="font-semibold mb-3">{activeMeta?.label}</h2>
          {loading ? (
            <div className="text-sm text-slate-500">Loading…</div>
          ) : report && report.rows.length > 0 ? (
            <>
              {activeMeta && (
                <ReportChart meta={activeMeta} report={report} total={total} />
              )}
              <div className="overflow-x-auto mt-4">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                      {report.columns.map((c) => (
                        <th key={c} className="px-4 py-2 font-semibold">{c}</th>
                      ))}
                      {activeMeta?.showPercent && !hasSublabel && (
                        <th className="px-4 py-2 font-semibold">% of total</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.rows.map((row, i) => (
                      <tr key={`${row.label}-${row.sublabel ?? ""}-${i}`}>
                        <td className="px-4 py-2">{row.label}</td>
                        {hasSublabel && (
                          <td className="px-4 py-2">{row.sublabel ?? "—"}</td>
                        )}
                        <td className="px-4 py-2 font-medium">{row.count}</td>
                        {activeMeta?.showPercent && !hasSublabel && (
                          <td className="px-4 py-2 text-slate-500">
                            {total > 0 ? ((row.count / total) * 100).toFixed(1) : "0"}%
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-semibold">
                      <td className="px-4 py-2" colSpan={report.columns.length - 1}>Total</td>
                      <td className="px-4 py-2">{total}</td>
                      {activeMeta?.showPercent && !hasSublabel && (
                        <td className="px-4 py-2 text-slate-500">100%</td>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">No data for this report.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Chart components (no chart library) ----

function ReportChart({ meta, report, total }: { meta: ReportMeta; report: ReportResult; total: number }) {
  switch (meta.chart) {
    case "bar":     return <BarChartV report={report} total={total} />;
    case "hbar":    return <HBarChart report={report} total={total} />;
    case "donut":   return <DonutChart report={report} total={total} />;
    case "stacked": return <StackedBarChart report={report} />;
    case "grouped": return <GroupedBarChart report={report} />;
    default:        return null;
  }
}

// Vertical bar chart — good for ordinal categories (age buckets, statuses).
function BarChartV({ report, total }: { report: ReportResult; total: number }) {
  const max = Math.max(...report.rows.map((r) => r.count), 1);
  return (
    <div className="flex items-end gap-3 h-48 px-2">
      {report.rows.map((r, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
          <div className="text-xs font-semibold text-slate-700 mb-1">{r.count}</div>
          <div className="w-full rounded-t" style={{ height: `${(r.count / max) * 100}%`, backgroundColor: PALETTE[i % PALETTE.length], minHeight: r.count > 0 ? "4px" : "0" }} />
          <div className="text-xs text-slate-600 mt-1 text-center truncate w-full" title={r.label}>{r.label}</div>
          {total > 0 && <div className="text-[10px] text-slate-400">{((r.count / total) * 100).toFixed(0)}%</div>}
        </div>
      ))}
    </div>
  );
}

// Horizontal bar chart — good for village lists (long labels).
function HBarChart({ report, total }: { report: ReportResult; total: number }) {
  const max = Math.max(...report.rows.map((r) => r.count), 1);
  return (
    <div className="space-y-1">
      {report.rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="w-40 truncate text-slate-600" title={r.label}>{r.label}</div>
          <div className="flex-1 h-4 bg-slate-100 rounded overflow-hidden">
            <div className="h-full rounded" style={{ width: `${(r.count / max) * 100}%`, backgroundColor: PALETTE[i % PALETTE.length] }} />
          </div>
          <div className="w-10 text-right font-medium">{r.count}</div>
          {total > 0 && <div className="w-12 text-right text-slate-400">{((r.count / total) * 100).toFixed(0)}%</div>}
        </div>
      ))}
    </div>
  );
}

// Donut chart — good for proportional distributions (employment, marital, etc).
function DonutChart({ report, total }: { report: ReportResult; total: number }) {
  const rows = report.rows;
  const safeTotal = total > 0 ? total : 1;
  // Build SVG arcs.
  const radius = 60;
  const stroke = 28;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <g transform="translate(80,80) rotate(-90)">
          <circle r={radius} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
          {rows.map((r, i) => {
            const fraction = r.count / safeTotal;
            const dash = fraction * circumference;
            const seg = (
              <circle
                key={i}
                r={radius}
                fill="none"
                stroke={PALETTE[i % PALETTE.length]}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return seg;
          })}
        </g>
        <text x="80" y="76" textAnchor="middle" className="fill-slate-700" style={{ fontSize: 18, fontWeight: 600 }}>{total}</text>
        <text x="80" y="92" textAnchor="middle" className="fill-slate-400" style={{ fontSize: 10 }}>total</text>
      </svg>
      <div className="space-y-1 text-sm">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
            <span className="text-slate-700">{r.label}</span>
            <span className="font-semibold ml-auto pl-4">{r.count}</span>
            <span className="text-slate-400 w-12 text-right">{((r.count / safeTotal) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Stacked horizontal bars — tribe → clan breakdown.
function StackedBarChart({ report }: { report: ReportResult }) {
  // Group rows by label (tribe), each bar segments by sublabel (clan).
  const groups = new Map<string, { sublabel: string; count: number }[]>();
  for (const r of report.rows) {
    const arr = groups.get(r.label) ?? [];
    arr.push({ sublabel: r.sublabel ?? "—", count: r.count });
    groups.set(r.label, arr);
  }
  const maxGroup = Math.max(...[...groups.values()].map((arr) => arr.reduce((s, x) => s + x.count, 0)), 1);
  return (
    <div className="space-y-2">
      {[...groups.entries()].map(([label, arr], gi) => {
        const groupTotal = arr.reduce((s, x) => s + x.count, 0);
        return (
          <div key={label} className="text-xs">
            <div className="flex justify-between mb-0.5">
              <span className="text-slate-700 font-medium">{label}</span>
              <span className="text-slate-500">{groupTotal}</span>
            </div>
            <div className="flex h-4 rounded overflow-hidden bg-slate-100">
              {arr.map((seg, si) => (
                <div
                  key={si}
                  className="h-full"
                  style={{
                    width: `${(seg.count / maxGroup) * 100}%`,
                    backgroundColor: PALETTE[(gi + si) % PALETTE.length],
                  }}
                  title={`${seg.sublabel}: ${seg.count}`}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Grouped vertical bars — village → gender (Male/Female side by side).
function GroupedBarChart({ report }: { report: ReportResult }) {
  // Group rows by label (village), each group has sublabels (Male/Female).
  const groups = new Map<string, { sublabel: string; count: number }[]>();
  for (const r of report.rows) {
    const arr = groups.get(r.label) ?? [];
    arr.push({ sublabel: r.sublabel ?? "—", count: r.count });
    groups.set(r.label, arr);
  }
  const sublabels = [...new Set(report.rows.map((r) => r.sublabel ?? "—"))];
  const max = Math.max(...report.rows.map((r) => r.count), 1);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs">
        {sublabels.map((s, i) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
            <span className="text-slate-600">{s}</span>
          </span>
        ))}
      </div>
      <div className="flex items-end gap-4 h-48 px-2">
        {[...groups.entries()].map(([label, arr]) => (
          <div key={label} className="flex-1 flex flex-col items-center justify-end h-full">
            <div className="flex items-end gap-1 h-full w-full justify-center">
              {sublabels.map((s, si) => {
                const seg = arr.find((x) => x.sublabel === s);
                const count = seg?.count ?? 0;
                return (
                  <div
                    key={s}
                    className="w-1/2 rounded-t"
                    style={{
                      height: `${(count / max) * 100}%`,
                      backgroundColor: PALETTE[si % PALETTE.length],
                      minHeight: count > 0 ? "4px" : "0",
                    }}
                    title={`${label} · ${s}: ${count}`}
                  />
                );
              })}
            </div>
            <div className="text-xs text-slate-600 mt-1 text-center truncate w-full" title={label}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function csvEscape(value: string | number): string {
  const s = String(value);
  if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
