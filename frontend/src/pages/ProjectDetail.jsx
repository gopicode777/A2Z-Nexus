import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, ArrowLeft, Search, TestTube2, Sparkles, FileText, PackageCheck, Rocket, PenLine } from "lucide-react";
import PageShell from "../components/PageShell";
import {
  projectsApi,
  analysisApi,
  testingApi,
  recommendationsApi,
  submissionApi,
  releaseApi,
  documentationApi,
} from "../services/api";

const ACTIONS = [
  { key: "analysis", label: "Code Analysis", icon: Search, run: (id) => analysisApi.analyze(id) },
  { key: "test-run", label: "Run Tests", icon: TestTube2, run: (id) => testingApi.run(id) },
  { key: "test-gen", label: "Generate Tests", icon: PenLine, run: (id) => testingApi.generate(id) },
  { key: "recs", label: "Recommendations", icon: Sparkles, run: (id) => recommendationsApi.get(id) },
  { key: "readme", label: "Generate README", icon: FileText, run: (id) => documentationApi.generate(id, "readme") },
  { key: "submission", label: "Submission Check", icon: PackageCheck, run: (id) => submissionApi.check(id) },
  { key: "release", label: "Release Check", icon: Rocket, run: (id) => releaseApi.check(id) },
];

function resultText(result) {
  if (result == null) return "";
  if (typeof result === "string") return result;
  if (result.ai_analysis) return String(result.ai_analysis);
  if (result.content) return String(result.content);
  if (result.script) return String(result.script);
  if (result.generated_code) return String(result.generated_code);
  if (result.summary) return String(result.summary);
  return JSON.stringify(result, null, 2);
}

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [runningKey, setRunningKey] = useState("");
  const [actionMsg, setActionMsg] = useState(null); // { ok: bool, text }
  const [actionResult, setActionResult] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    projectsApi
      .get(id)
      .then(setProject)
      .catch((err) => setLoadError(err.message || "Project not found."))
      .finally(() => setLoading(false));
  }, [id]);

  async function runAction(action) {
    setRunningKey(action.key);
    setActionMsg(null);
    setActionResult(null);
    try {
      const result = await action.run(project.id);
      setActionMsg({ ok: true, text: `${action.label} completed.` });
      setActionResult(result);
    } catch (err) {
      setActionMsg({ ok: false, text: err.message || `${action.label} failed.` });
    } finally {
      setRunningKey("");
    }
  }

  if (loading) {
    return (
      <PageShell title="Project">
        <div className="flex items-center justify-center py-20 text-muted gap-2">
          <Loader2 size={18} className="animate-spin" /> Loading project…
        </div>
      </PageShell>
    );
  }

  if (loadError || !project) {
    return (
      <PageShell title="Project not found">
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {loadError || "This project doesn't exist or you don't have access to it."}
        </div>
        <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-primary mt-4 hover:underline">
          <ArrowLeft size={14} /> Back to projects
        </Link>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={project.name}
      subtitle={project.technology || undefined}
      actions={
        <Link
          to="/projects"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-ink"
        >
          <ArrowLeft size={14} /> All projects
        </Link>
      }
    >
      {actionMsg && (
        <div
          className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
            actionMsg.ok
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {actionMsg.text}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-line bg-white dark:bg-[#12142a] p-4 shadow-soft">
          <h2 className="text-sm font-semibold text-ink mb-3">Project info</h2>
          <dl className="text-sm space-y-2">
            <Row label="Description" value={project.description || "—"} />
            <Row label="Technology" value={project.technology || "—"} />
            <Row label="Repository" value={project.repository_path || "—"} mono />
            <Row label="Status" value={project.status} capitalize />
            <Row label="Health" value={project.health} capitalize />
            <Row label="Deadline" value={project.deadline || "—"} />
            <Row label="Open issues" value={project.open_issues} />
          </dl>
        </div>

        <div className="rounded-xl border border-line bg-white dark:bg-[#12142a] p-4 shadow-soft">
          <h2 className="text-sm font-semibold text-ink mb-3">Agent actions</h2>
          <div className="flex flex-col gap-2">
            {ACTIONS.map((action) => {
              const Icon = action.icon;
              const isRunning = runningKey === action.key;
              return (
                <button
                  key={action.key}
                  type="button"
                  disabled={!!runningKey}
                  onClick={() => runAction(action)}
                  className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-left hover:bg-bgLight transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isRunning ? (
                    <Loader2 size={15} className="animate-spin text-primary" />
                  ) : (
                    <Icon size={15} className="text-primary" />
                  )}
                  {isRunning ? "Running…" : action.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {actionResult && (
        <div className="rounded-xl border border-line bg-white dark:bg-[#12142a] p-4 shadow-soft">
          <h2 className="text-sm font-semibold text-ink mb-3">Result</h2>
          <pre className="text-xs whitespace-pre-wrap break-words text-ink max-h-96 overflow-auto bg-bgSoft rounded-lg p-3">
            {resultText(actionResult)}
          </pre>
        </div>
      )}
    </PageShell>
  );
}

function Row({ label, value, mono, capitalize }) {
  return (
    <div className="flex gap-3">
      <dt className="w-28 shrink-0 text-muted">{label}</dt>
      <dd className={`min-w-0 break-words ${mono ? "font-mono text-xs" : ""} ${capitalize ? "capitalize" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
