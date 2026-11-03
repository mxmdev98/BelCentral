// src/pages/Reports.tsx
import { useEffect, useState } from "react";
import { reportsApi } from "../api";
import type { ReportType, ReportResult } from "../types";

const REPORTS: { type: ReportType; label: string; description: string }[] = [
  { type: "residents_per_village", label: "Residents per village", description: "Total resident count for each village." },
  { type: "gender_per_village",    label: "Gender per village",    description: "Male / Female counts broken down by village." },
  { type: "by_tribe_and_clan",     label: "By tribe & clan",       description: "Resident counts grouped by tribe and clan." },
  { type: "by_employment",         label: "By employment status",  description: "How many residents fall in each employment category." },
  { type: "by_marital",            label: "By marital status",     description: "Marital status distribution across all residents." },
  { type: "by_education",          label: "By education level",    description: "Highest education level reached." },
  { type: "age_distribution",      label: "Age distribution",      description: "Bucketed: 0–17, 18–35, 36–60, 60+." },
];

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

  function exportCsv() {
    if (!report) return;
    const cols = report.columns;
    const lines: string[] = [];
    lines.push(cols.map(csvEscape).join(","));
    for (const row of report.rows) {
      const cells = [row.label, row.sublabel ?? "", String(row.count)];
      // If the report has only 2 columns (no sublabel), drop the middle cell.
      const out = cols.length === 2 ? [cells[0], cells[2]] : cells;
      lines.push(out.map(csvEscape).join(","));
    }
    const csv = lines.join("\n");
    // Prepend BOM so Excel opens UTF-8 correctly.
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Reports</h1>
        <button onClick={exportCsv} className="btn-secondary" disabled={!report || loading}>
          Export CSV
        </button>
      </div>

      {/* Report selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {REPORTS.map((r) => (
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

      {/* Report table */}
      <div className="card">
        <div className="card-body">
          <h2 className="font-semibold mb-3">
            {REPORTS.find((r) => r.type === active)?.label}
          </h2>
          {loading ? (
            <div className="text-sm text-slate-500">Loading…</div>
          ) : report && report.rows.length > 0 ? (
            <>
              <BarChart report={report} />
              <div className="overflow-x-auto mt-4">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                      {report.columns.map((c) => (
                        <th key={c} className="px-4 py-2 font-semibold">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.rows.map((row, i) => (
                      <tr key={`${row.label}-${row.sublabel ?? ""}-${i}`}>
                        <td className="px-4 py-2">{row.label}</td>
                        {report.columns.length === 3 && (
                          <td className="px-4 py-2">{row.sublabel ?? "—"}</td>
                        )}
                        <td className="px-4 py-2 font-medium">{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-semibold">
                      <td className="px-4 py-2" colSpan={report.columns.length - 1}>Total</td>
                      <td className="px-4 py-2">{report.rows.reduce((s, r) => s + r.count, 0)}</td>
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

// Tiny inline bar chart (no chart library) — labelled rows with width % bars.
function BarChart({ report }: { report: ReportResult }) {
  const max = Math.max(...report.rows.map((r) => r.count), 1);
  return (
    <div className="space-y-1">
      {report.rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="w-32 truncate text-slate-600">
            {r.label}{r.sublabel ? ` · ${r.sublabel}` : ""}
          </div>
          <div className="flex-1 h-4 bg-slate-100 rounded overflow-hidden">
            <div
              className="h-full bg-brand-500"
              style={{ width: `${(r.count / max) * 100}%` }}
            />
          </div>
          <div className="w-10 text-right font-medium">{r.count}</div>
        </div>
      ))}
    </div>
  );
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
