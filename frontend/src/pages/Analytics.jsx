import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import PageShell from "../components/PageShell";
import { analyticsApi } from "../services/api";

function StatCard({ value, label, tone }) {
  const toneClasses =
    tone === "good"
      ? "border-emerald-200 text-emerald-700"
      : tone === "bad"
      ? "border-red-200 text-red-700"
      : "border-line text-ink";
  return (
    <div className={`rounded-xl border bg-white p-4 shadow-soft ${toneClasses}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted mt-1">{label}</div>
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    analyticsApi
      .get()
      .then(setData)
      .catch((err) => setError(err.message || "Failed to load analytics."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageShell title="Analytics">
        <div className="flex items-center justify-center py-20 text-muted gap-2">
          <Loader2 size={18} className="animate-spin" /> Loading analytics…
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Analytics" subtitle="Across all of your projects">
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard value={data.total_projects} label="Total Projects" />
            <StatCard value={data.active_projects} label="Active" />
            <StatCard value={data.completed_projects} label="Completed" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard value={data.tests_run} label="Tests Run" />
            <StatCard value={data.tests_passed} label="Tests Passed" tone="good" />
            <StatCard value={data.tests_failed} label="Tests Failed" tone="bad" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard value={data.recommendations_generated} label="Recommendations" />
            <StatCard value={data.reminders_total} label="Reminders" />
          </div>

          {data.agent_activity && Object.keys(data.agent_activity).length > 0 && (
            <div className="rounded-xl border border-line bg-white p-4 shadow-soft">
              <h2 className="text-sm font-semibold text-ink mb-3">Agent activity</h2>
              <table className="w-full text-sm">
                <thead className="text-left text-xs font-semibold text-muted uppercase tracking-wide">
                  <tr>
                    <th className="py-1.5">Agent</th>
                    <th className="py-1.5 text-right">Calls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {Object.entries(data.agent_activity).map(([agent, count]) => (
                    <tr key={agent}>
                      <td className="py-2 capitalize">{agent.replace(/_/g, " ")}</td>
                      <td className="py-2 text-right font-medium">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data.total_projects === 0 && (
            <p className="text-sm text-muted text-center py-8">
              Analytics will populate once you create projects and run agent actions on them.
            </p>
          )}
        </div>
      )}
    </PageShell>
  );
}
