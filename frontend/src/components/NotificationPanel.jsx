import { useState, useRef, useEffect } from "react";
import { Bell, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notificationsApi } from "../services/api";

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Load unread count on mount so the badge is accurate even before opening.
  useEffect(() => {
    notificationsApi
      .list()
      .then((data) => setNotifications(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  function toggleOpen() {
    setOpen((v) => {
      const next = !v;
      if (next && !loaded) {
        setLoading(true);
        notificationsApi
          .list()
          .then((data) => setNotifications(Array.isArray(data) ? data : []))
          .catch(() => {})
          .finally(() => {
            setLoading(false);
            setLoaded(true);
          });
      }
      return next;
    });
  }

  async function markRead(id) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await notificationsApi.markRead(id);
    } catch {
      // leave optimistic state; the full Notifications page will reconcile on next load
    }
  }

  const recent = notifications.slice(0, 6);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggleOpen}
        className="relative p-2 rounded-lg hover:bg-bgSoft text-muted hover:text-ink transition-colors"
        aria-label="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 rounded-2xl bg-white border border-line shadow-premium overflow-hidden z-30">
          <div className="px-4 py-3 border-b border-line flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            {unreadCount > 0 && <span className="text-xs text-muted">{unreadCount} unread</span>}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted gap-2 text-sm">
                <Loader2 size={15} className="animate-spin" /> Loading…
              </div>
            ) : recent.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">No notifications yet.</p>
            ) : (
              recent.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.read && markRead(n.id)}
                  className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-bgSoft/60 border-b border-line last:border-0 ${
                    n.read ? "opacity-60" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{n.title}</p>
                    <p className="text-xs text-muted truncate">{n.message}</p>
                    <p className="text-[11px] text-muted mt-0.5">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          <button
            onClick={() => {
              setOpen(false);
              navigate("/notifications");
            }}
            className="w-full text-center text-xs font-semibold text-primary py-2.5 hover:bg-bgSoft transition"
          >
            View all
          </button>
        </div>
      )}
    </div>
  );
}
