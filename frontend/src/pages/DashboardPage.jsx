import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Folder,
  Bell,
  BarChart3,
  Settings,
} from "lucide-react";
import PageShell from "../components/PageShell";
import { getStoredUser } from "../services/api";

const ACTIONS = [
  { icon: MessageSquare, title: "Chat", desc: "Ask anything, analyze code, generate docs.", to: "/chat" },
  { icon: Folder, title: "Projects", desc: "Manage projects and run agent actions.", to: "/projects" },
  { icon: Bell, title: "Notifications", desc: "See what needs your attention.", to: "/notifications" },
  { icon: BarChart3, title: "Analytics", desc: "Track project health and agent activity.", to: "/analytics" },
  { icon: Settings, title: "Settings", desc: "Account, backend connection, integrations.", to: "/settings" },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const displayName = user?.name || "there";

  return (
    <PageShell title={`Good to see you, ${displayName}`} subtitle="What would you like to accomplish today?">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ACTIONS.map(({ icon: Icon, title, desc, to }) => (
          <button
            key={title}
            onClick={() => navigate(to)}
            className="text-left rounded-2xl border border-line bg-white p-5 hover:shadow-premium hover:-translate-y-0.5 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-bgSoft flex items-center justify-center text-primary mb-3">
              <Icon size={19} />
            </div>
            <p className="text-sm font-semibold text-ink mb-0.5">{title}</p>
            <p className="text-xs text-muted leading-snug">{desc}</p>
          </button>
        ))}
      </div>
    </PageShell>
  );
}
