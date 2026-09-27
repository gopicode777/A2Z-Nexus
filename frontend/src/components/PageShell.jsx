import { useState } from "react";
import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import NotificationPanel from "./NotificationPanel";

/**
 * Shared shell for every non-chat page: renders the same Sidebar used on
 * /chat (so navigation, active-route highlighting, and logout are
 * consistent everywhere) plus a scrollable content column.
 */
export default function PageShell({ title, subtitle, actions, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-[#f7f8ff] dark:bg-[#0b0d17] text-ink overflow-hidden">
      <Sidebar
        open={true}
        chats={[]}
        onNewChat={() => navigate("/chat")}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <main className="flex-1 min-w-0 h-full flex flex-col bg-white dark:bg-[#0d0f1f] relative overflow-hidden">
        <header className="shrink-0 flex items-center justify-between gap-3 px-4 md:px-8 h-16 border-b border-line bg-white/90 dark:bg-[#0d0f1f]/90 backdrop-blur">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-muted hover:bg-bgSoft"
              aria-label="Open menu"
            >
              <Menu size={19} />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-ink truncate">{title}</h1>
              {subtitle && <p className="text-xs text-muted truncate">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
          <div className="shrink-0">
            <NotificationPanel />
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-8 py-6">
          <div className="max-w-5xl mx-auto w-full">{children}</div>
        </div>
      </main>
    </div>
  );
}
