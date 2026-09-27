import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Loader2, FolderOpen, X } from "lucide-react";
import PageShell from "../components/PageShell";
import { projectsApi } from "../services/api";

const HEALTH_STYLES = {
  good: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  critical: "bg-red-50 text-red-700 border-red-200",
  unknown: "bg-gray-100 text-gray-600 border-gray-200",
};

const EMPTY_FORM = { name: "", description: "", repository_path: "", technology: "" };

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await projectsApi.list();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load projects. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Project name is required.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await projectsApi.create(form);
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setFormError(err.message || "Failed to create project.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell
      title="Projects"
      subtitle={`${projects.length} project${projects.length === 1 ? "" : "s"}`}
      actions={
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-white text-sm font-semibold px-4 py-2 hover:opacity-90 transition"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancel" : "New Project"}
        </button>
      }
    >
      {showForm && (
        <form
          onSubmit={submit}
          className="mb-6 rounded-xl border border-line bg-bgLight p-5 shadow-soft space-y-3"
        >
          {formError && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
              {formError}
            </div>
          )}
          <input
            placeholder="Project name *"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            required
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            rows={2}
          />
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              placeholder="Repository path or URL"
              value={form.repository_path}
              onChange={(e) => setForm((f) => ({ ...f, repository_path: e.target.value }))}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <input
              placeholder="Technology (e.g. React, FastAPI)"
              value={form.technology}
              onChange={(e) => setForm((f) => ({ ...f, technology: e.target.value }))}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-white text-sm font-semibold px-4 py-2 hover:opacity-90 transition disabled:opacity-60"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              {saving ? "Saving…" : "Create project"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-line text-sm font-medium px-4 py-2 hover:bg-bgSoft transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted gap-2">
          <Loader2 size={18} className="animate-spin" /> Loading projects…
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <FolderOpen size={36} className="text-muted" />
          <p className="text-sm text-muted max-w-sm">
            No projects yet. Create your first project to start running analysis, tests,
            documentation and release checks on it.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-line overflow-hidden shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-bgSoft text-left text-xs font-semibold text-muted uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3 hidden sm:table-cell">Technology</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 hidden md:table-cell">Health</th>
                <th className="px-4 py-3 hidden md:table-cell">Open issues</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-bgLight transition">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{p.name}</div>
                    {p.description && (
                      <div className="text-xs text-muted line-clamp-1">{p.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-muted">
                    {p.technology || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full border border-line bg-white px-2 py-0.5 text-xs font-medium capitalize">
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
                        HEALTH_STYLES[p.health] || HEALTH_STYLES.unknown
                      }`}
                    >
                      {p.health}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted">{p.open_issues}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/projects/${p.id}`}
                      className="text-primary text-xs font-semibold hover:underline"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
