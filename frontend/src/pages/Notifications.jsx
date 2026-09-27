import { useEffect, useState } from "react";
import { Loader2, BellOff } from "lucide-react";
import PageShell from "../components/PageShell";
import { notificationsApi } from "../services/api";

const CATEGORY_STYLES = {
  info: "bg-blue-50 text-blue-700 border-blue-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  error: "bg-red-50 text-red-700 border-red-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    setError("");
    notificationsApi
      .list()
      .then((data) => setNotifications(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || "Failed to load notifications."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id) {
    // Optimistic update, rolled back if the backend call fails.
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await notificationsApi.markRead(id);
    } catch (err) {
      setError(err.message || "Failed to update notification.");
      load();
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <PageShell
      title="Notifications"
      subtitle={loading ? undefined : `${unreadCount} unread`}
    >
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted gap-2">
          <Loader2 size={18} className="animate-spin" /> Loading notifications…
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <BellOff size={32} className="text-muted" />
          <p className="text-sm text-muted">You're all caught up — no notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => !n.read && markRead(n.id)}
              className={`w-full text-left rounded-xl border p-4 transition ${
                n.read
                  ? "border-line bg-white dark:bg-[#12142a] opacity-70"
                  : "border-primary/30 bg-blue-50/40 hover:bg-blue-50 cursor-pointer"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${
                    CATEGORY_STYLES[n.category] || "bg-gray-100 text-gray-600 border-gray-200"
                  }`}
                >
                  {n.category}
                </span>
                <span className="text-sm font-semibold text-ink">{n.title}</span>
                {!n.read && (
                  <span className="ml-auto rounded-full bg-primary text-white text-[10px] font-semibold px-2 py-0.5">
                    New
                  </span>
                )}
              </div>
              <p className="text-sm text-muted">{n.message}</p>
              <p className="text-[11px] text-muted/70 mt-1">
                {new Date(n.created_at).toLocaleString()}
              </p>
            </button>
          ))}
        </div>
      )}
    </PageShell>
  );
}
