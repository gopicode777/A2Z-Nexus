import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell";
import { API_URL, authApi, clearSession, getStoredUser } from "../services/api";

export default function Settings() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [health, setHealth] = useState({ status: "checking" }); // checking | ok | down
  const [profile, setProfile] = useState(user);

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(() => setHealth({ status: "ok" }))
      .catch(() => setHealth({ status: "down" }));

    // Refresh profile from the backend in case it changed elsewhere.
    authApi
      .me()
      .then(setProfile)
      .catch(() => {});
  }, []);

  function handleLogout() {
    clearSession();
    navigate("/auth", { replace: true });
  }

  return (
    <PageShell title="Settings">
      <div className="space-y-4">
        <section className="rounded-xl border border-line bg-white p-4 shadow-soft">
          <h2 className="text-sm font-semibold text-ink mb-3">Account</h2>
          {profile ? (
            <dl className="text-sm space-y-2">
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-muted">Name</dt>
                <dd>{profile.name}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-muted">Email</dt>
                <dd>{profile.email}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-muted">Joined</dt>
                <dd>{new Date(profile.created_at).toLocaleDateString()}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted">Not signed in.</p>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-200 text-red-600 text-sm font-semibold px-4 py-2 hover:bg-red-50 transition"
          >
            <LogOut size={15} /> Log out
          </button>
        </section>

        <section className="rounded-xl border border-line bg-white p-4 shadow-soft">
          <h2 className="text-sm font-semibold text-ink mb-3">Backend connection</h2>
          <div className="flex items-center gap-2 text-sm">
            {health.status === "checking" && (
              <>
                <Loader2 size={15} className="animate-spin text-muted" />
                <span className="text-muted">Checking…</span>
              </>
            )}
            {health.status === "ok" && (
              <>
                <CheckCircle2 size={15} className="text-emerald-600" />
                <span className="text-emerald-700">Connected — {API_URL}</span>
              </>
            )}
            {health.status === "down" && (
              <>
                <XCircle size={15} className="text-red-600" />
                <span className="text-red-700">
                  Could not reach the backend at {API_URL}. Start the FastAPI server and refresh.
                </span>
              </>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-line bg-white p-4 shadow-soft">
          <h2 className="text-sm font-semibold text-ink mb-3">AI provider</h2>
          <p className="text-sm text-muted">
            The active AI provider is configured on the backend via the{" "}
            <code className="text-xs bg-bgSoft px-1 py-0.5 rounded">AI_PROVIDER</code> environment
            variable (<code className="text-xs bg-bgSoft px-1 py-0.5 rounded">openai</code>,{" "}
            <code className="text-xs bg-bgSoft px-1 py-0.5 rounded">anthropic</code>,{" "}
            <code className="text-xs bg-bgSoft px-1 py-0.5 rounded">watsonx</code>, or{" "}
            <code className="text-xs bg-bgSoft px-1 py-0.5 rounded">mock</code>). Chat replies will
            say "Mock" until a real key is set in the backend's <code className="text-xs bg-bgSoft px-1 py-0.5 rounded">.env</code>.
          </p>
        </section>

        <section className="rounded-xl border border-line bg-white p-4 shadow-soft">
          <h2 className="text-sm font-semibold text-ink mb-3">Calendar reminders</h2>
          <p className="text-sm text-muted">
            Reminders are stored and managed in the database. Syncing them to Google Calendar
            requires <code className="text-xs bg-bgSoft px-1 py-0.5 rounded">GOOGLE_CLIENT_ID</code>{" "}
            and <code className="text-xs bg-bgSoft px-1 py-0.5 rounded">GOOGLE_CLIENT_SECRET</code> to
            be configured and is not yet implemented in this build — reminders will save without a
            linked calendar event.
          </p>
        </section>

        <section className="rounded-xl border border-line bg-bgSoft p-4">
          <h2 className="text-sm font-semibold text-ink mb-1">A2Z Nexus</h2>
          <p className="text-xs text-muted">Version 0.1.0 · Ask. Build. Test. Improve. Ship.</p>
        </section>
      </div>
    </PageShell>
  );
}
