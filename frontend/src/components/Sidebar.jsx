import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Plus,
  MessageSquare,
  Folder,
  Bell,
  BarChart3,
  History,
  Settings,
  ChevronDown,
  ArrowRight,
  Crown,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  X,
} from "lucide-react";

import A2ZNexusLogo from "./A2ZNexusLogo";
import ChatHistoryItem from "./ChatHistoryItem";
import ConfirmModal from "./ConfirmModal";
import { clearSession, getStoredUser, notificationsApi } from "../services/api";

export default function Sidebar({
  open = true,
  onToggle,

  activeChat,
  chats = [],

  onSelectChat,
  onNewChat,
  onDeleteChat,
  onShareChat,

  mobileOpen = true,
  onCloseMobile,

  usage = {
    used: 0,
    limit: 10,
  },
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    notificationsApi
      .list(true)
      .then((data) => {
        if (!cancelled) setUnreadCount(Array.isArray(data) ? data.length : 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  const NAV_ITEMS = useMemo(
    () => [
      { key: "chat", label: "Chat", icon: MessageSquare, to: "/chat" },
      { key: "projects", label: "Projects", icon: Folder, to: "/projects" },
      { key: "notifications", label: "Notifications", icon: Bell, to: "/notifications" },
      { key: "analytics", label: "Analytics", icon: BarChart3, to: "/analytics" },
    ],
    []
  );

  function isActive(to) {
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  }

  function goTo(to) {
    if (mobileOpen) onCloseMobile?.();
    navigate(to);
  }

  function handleLogout() {
    clearSession();
    navigate("/auth", { replace: true });
  }

  // =====================================================
  // SIDEBAR STATE
  // =====================================================

  const [sidebarOpen, setSidebarOpen] = useState(open);

  useEffect(() => {
    setSidebarOpen(open);
  }, [open]);

  function toggleSidebar() {
    setSidebarOpen((prev) => !prev);
    onToggle?.();
  }

  // =====================================================
  // STATES
  // =====================================================

  const [pendingDelete, setPendingDelete] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(true);

  // The "Upgrade to Pro" card is dismissible so it never crowds out the
  // chat history list — once closed, it stays hidden for this browser.
  const UPGRADE_DISMISSED_KEY = "a2z-nexus-upgrade-dismissed";
  const [upgradeDismissed, setUpgradeDismissed] = useState(() => {
    try {
      return localStorage.getItem(UPGRADE_DISMISSED_KEY) === "1";
    } catch {
      return false;
    }
  });

  function dismissUpgradeCard() {
    setUpgradeDismissed(true);
    try {
      localStorage.setItem(UPGRADE_DISMISSED_KEY, "1");
    } catch {
      // ignore write failures
    }
  }

  // =====================================================
  // SESSION
  // =====================================================

  let session = null;

  try {
    session = JSON.parse(
      localStorage.getItem("a2z-nexus-session") || "null"
    );
  } catch {
    session = null;
  }

  // =====================================================
  // GROUP CHAT HISTORY
  // =====================================================

  const groupedChats = useMemo(() => {
    const groups = {
      Today: [],
      Yesterday: [],
      "Previous 7 Days": [],
      Older: [],
    };

    const cleanChats = Array.isArray(chats) ? chats : [];

    const now = new Date();

    cleanChats.forEach((chat) => {
      const date = new Date(
        chat.updatedAt ||
          chat.createdAt ||
          Date.now()
      );

      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      const chatDate = new Date(date);
      chatDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor(
        (today.getTime() - chatDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (diffDays === 0) {
        groups.Today.push(chat);
      } else if (diffDays === 1) {
        groups.Yesterday.push(chat);
      } else if (diffDays <= 7) {
        groups["Previous 7 Days"].push(chat);
      } else {
        groups.Older.push(chat);
      }
    });

    return Object.entries(groups).filter(
      ([, items]) => items.length > 0
    );
  }, [chats]);

  // =====================================================
  // DELETE / SHARE
  // =====================================================

  function handleAction(action, chatId) {
    if (action === "delete") {
      setPendingDelete(chatId);
      return;
    }

    if (action === "share") {
      onShareChat?.(chatId);
    }
  }

  function confirmDelete() {
    if (!pendingDelete) return;

    onDeleteChat?.(pendingDelete);

    setPendingDelete(null);
  }

  // =====================================================
  // MOBILE
  // =====================================================

  function closeMobileSidebar() {
    onCloseMobile?.();
  }

  // =====================================================
  // NEW CHAT
  // =====================================================

  function handleNewChat() {
    onNewChat?.();
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <>
      {/* =================================================
          MOBILE OVERLAY
      ================================================= */}

      {mobileOpen && (
        <div
          className="
            fixed
            inset-0
            z-40
            bg-black/30
            backdrop-blur-[2px]
            md:hidden
          "
          onClick={closeMobileSidebar}
        />
      )}

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`
          fixed
          md:relative
          top-0
          left-0
          z-50
          h-full
          shrink-0
          flex
          flex-col
          overflow-visible

          border-r
          border-[#e5e8f3]
          dark:border-[#20233f]

          bg-gradient-to-b
          from-[#f9faff]
          via-[#f5f7ff]
          to-[#eef2ff]
          dark:from-[#0f1123]
          dark:via-[#12142a]
          dark:to-[#14162c]

          transition-all
          duration-300
          ease-in-out

          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }

          ${
            sidebarOpen
              ? "w-[315px]"
              : "w-[72px]"
          }
        `}
      >
        {/* =================================================
            TOP BRAND HEADER
        ================================================= */}

        <div
          className={`
            relative
            flex
            items-center
            shrink-0
            border-b
            border-[#e5e8f3]
            dark:border-[#20233f]
            transition-all
            duration-300

            ${
              sidebarOpen
                ? "h-[92px] px-4 justify-center"
                : "h-[76px] px-2 justify-center"
            }
          `}
        >
          {/* =================================================
              LOGO + NAME
          ================================================= */}

          <div
            className="
              flex
              items-center
              justify-center
              gap-3
              shrink-0
              transition-all
              duration-300
            "
          >
            {/* =================================================
                LOGO
            ================================================= */}

            <div
              className={`
                flex
                items-center
                justify-center
                shrink-0
                transition-all
                duration-300

                ${
                  sidebarOpen
                    ? "w-[68px] h-[68px]"
                    : "w-[48px] h-[48px]"
                }
              `}
            >
              <div
                className={`
                  transition-all
                  duration-300

                  ${
                    sidebarOpen
                      ? "scale-100"
                      : "scale-[0.72]"
                  }
                `}
              >
                <A2ZNexusLogo
                  size={
                    sidebarOpen
                      ? "md"
                      : "sm"
                  }
                />
              </div>
            </div>

            {/* =================================================
                A2Z NEXUS NAME
            ================================================= */}

            {sidebarOpen && (
              <div
                className="
                  flex
                  flex-row
                  items-center
                  whitespace-nowrap
                  leading-none
                "
              >
                <span
                  className="
                    text-[24px]
                    font-bold
                    tracking-[-0.5px]
                    text-[#172554]
                    dark:text-[#e7e9f7]
                  "
                >
                  A2Z
                </span>

                <span
                  className="
                    ml-1
                    text-[24px]
                    font-medium
                    text-[#4f46e5]
                    dark:text-[#a5b4fc]
                  "
                >
                  Nexus
                </span>
              </div>
            )}
          </div>

          {/* =================================================
              FLOATING SIDEBAR TOGGLE
          ================================================= */}

          <button
            type="button"
            onClick={toggleSidebar}
            title={
              sidebarOpen
                ? "Collapse sidebar"
                : "Open sidebar"
            }
            aria-label={
              sidebarOpen
                ? "Collapse sidebar"
                : "Open sidebar"
            }
            className={`
              group
              absolute
              z-[60]

              flex
              items-center
              justify-center

              w-[26px]
              h-[26px]

              rounded-full

              bg-white
              dark:bg-[#181a33]

              border
              border-[#dfe4f2]
              dark:border-[#2a2e52]

              text-[#6874a8]
              dark:text-[#9aa3c7]

              shadow-[0_2px_10px_rgba(79,70,229,0.18)]

              transition-all
              duration-300
              ease-out

              hover:bg-[#f8f9ff]
              dark:hover:bg-[#20233f]
              hover:text-[#4f46e5]
              dark:hover:text-[#a5b4fc]
              hover:border-[#c9cff5]
              dark:hover:border-[#3a3f6e]
              hover:shadow-[0_3px_14px_rgba(79,70,229,0.28)]
              hover:scale-110

              active:scale-95

              top-[10px]

              ${
                sidebarOpen
                  ? "right-[10px]"
                  : "right-[-13px]"
              }
            `}
          >
            {sidebarOpen ? (
              <ChevronsLeft
                size={14}
                strokeWidth={2.4}
                className="
                  transition-all
                  duration-300
                  group-hover:-translate-x-[1px]
                "
              />
            ) : (
              <ChevronsRight
                size={14}
                strokeWidth={2.4}
                className="
                  transition-all
                  duration-300
                  group-hover:translate-x-[1px]
                "
              />
            )}
          </button>
        </div>

        {/* =================================================
            OPEN SIDEBAR CONTENT
        ================================================= */}

        {sidebarOpen && (
          <>
            {/* =================================================
                NEW CHAT
            ================================================= */}

            <div
              className="
                px-4
                pt-4
                pb-3
                shrink-0
              "
            >
              <button
                type="button"
                onClick={handleNewChat}
                className="
                  group
                  w-full
                  h-[50px]
                  rounded-[15px]
                  flex
                  items-center
                  justify-between
                  px-4

                  text-white

                  bg-gradient-to-r
                  from-[#3267ff]
                  via-[#4f46e5]
                  to-[#7138f5]

                  shadow-[0_8px_25px_rgba(79,70,229,0.22)]

                  hover:shadow-[0_12px_32px_rgba(79,70,229,0.30)]
                  hover:-translate-y-[1px]

                  active:scale-[0.98]

                  transition-all
                "
              >
                <span
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >
                  <span
                    className="
                      w-7
                      h-7
                      rounded-full
                      bg-white/20
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <Plus
                      size={17}
                      strokeWidth={2.5}
                    />
                  </span>

                  <span
                    className="
                      text-[14px]
                      font-semibold
                    "
                  >
                    New Chat
                  </span>
                </span>

                <ArrowRight
                  size={17}
                  className="
                    opacity-70
                    group-hover:translate-x-1
                    transition-transform
                  "
                />
              </button>
            </div>

            {/* =================================================
                NAVIGATION
            ================================================= */}

            <nav
              className="
                px-4
                space-y-1
                shrink-0
              "
            >
              {NAV_ITEMS.map(({ key, label, icon: Icon, to }) => {
                const active = isActive(to);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => goTo(to)}
                    className={`
                      w-full
                      h-[44px]
                      px-3
                      rounded-[13px]
                      flex
                      items-center
                      gap-3
                      text-left
                      transition
                      ${
                        active
                          ? "bg-[#e8ecff] text-[#3049c7] font-semibold dark:bg-[#232752] dark:text-[#c7d2fe]"
                          : "text-[#172554] hover:bg-white/70 font-medium dark:text-[#c7cbe8] dark:hover:bg-white/5"
                      }
                    `}
                  >
                    <span className="relative">
                      <Icon size={19} />
                      {key === "notifications" && unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 w-[6px] h-[6px] rounded-full bg-red-500" />
                      )}
                    </span>
                    <span className="text-[14px]">{label}</span>
                    {key === "notifications" && unreadCount > 0 && (
                      <span className="ml-auto text-[11px] font-semibold text-[#3049c7] bg-white/70 rounded-full px-2 py-0.5 dark:text-[#c7d2fe] dark:bg-white/10">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* =================================================
                DIVIDER
            ================================================= */}

            <div
              className="
                mx-4
                my-3
                border-t
                border-[#e1e5f2]
                dark:border-[#20233f]
                shrink-0
              "
            />

            {/* =================================================
                SCROLLABLE REGION
                Chat History header + list + Upgrade card all
                scroll together here. This guarantees the chat
                list is never squeezed to nothing by fixed elements
                above/below it — Settings/Logout stay pinned below,
                but everything in between scrolls as one unit so the
                Upgrade card can never sit fixed "on top of" history.
            ================================================= */}

            <div
              className="
                flex-1
                min-h-0
                overflow-y-auto
                scrollbar-thin
              "
            >
              {/* =================================================
                  CHAT HISTORY HEADER
              ================================================= */}

              <div className="px-4">
                <button
                  type="button"
                  onClick={() =>
                    setHistoryOpen(
                      (value) => !value
                    )
                  }
                  className="
                    w-full
                    flex
                    items-center
                    justify-between
                    py-2
                    text-left
                    text-[#172554]
                    dark:text-[#c7cbe8]
                  "
                >
                  <span
                    className="
                      flex
                      items-center
                      gap-3
                    "
                  >
                    <History size={19} />

                    <span
                      className="
                        text-[14px]
                        font-semibold
                      "
                    >
                      Chat History
                    </span>
                  </span>

                  <ChevronDown
                    size={16}
                    className={`
                      transition-transform

                      ${
                        historyOpen
                          ? "rotate-0"
                          : "-rotate-90"
                      }
                    `}
                  />
                </button>
              </div>

              {/* =================================================
                  CHAT HISTORY
              ================================================= */}

              {historyOpen && (
                <div
                  className="
                    px-4
                    pt-1
                    pb-3
                  "
                >
                {groupedChats.length === 0 ? (
                  <div className="px-2 py-8">
                    <div
                      className="
                        w-10
                        h-10
                        rounded-xl
                        bg-white
                        dark:bg-[#181a33]
                        shadow-sm
                        flex
                        items-center
                        justify-center
                        mb-3
                      "
                    >
                      <MessageSquare
                        size={18}
                        className="
                          text-[#6874a8]
                          dark:text-[#8891c7]
                        "
                      />
                    </div>

                    <p
                      className="
                        text-[13px]
                        font-semibold
                        text-[#18214d]
                        dark:text-[#e7e9f7]
                      "
                    >
                      No conversations yet
                    </p>

                    <p
                      className="
                        text-[11px]
                        text-[#7b84a5]
                        dark:text-[#8891c7]
                        mt-1
                        leading-5
                      "
                    >
                      Start a new chat to see
                      your history here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groupedChats.map(
                      ([label, groupChats]) => (
                        <div key={label}>
                          <div
                            className="
                              flex
                              items-center
                              justify-between
                              px-1
                              mb-2
                            "
                          >
                            <span
                              className="
                                text-[11px]
                                font-medium
                                text-[#8991ad]
                                dark:text-[#6b7099]
                              "
                            >
                              {label}
                            </span>

                            <ChevronDown
                              size={13}
                              className="
                                text-[#a0a7bd]
                                dark:text-[#4f5480]
                              "
                            />
                          </div>

                          <div className="space-y-1">
                            {groupChats.map(
                              (chat) => (
                                <ChatHistoryItem
                                  key={chat.id}
                                  chat={chat}
                                  active={
                                    chat.id ===
                                    activeChat
                                  }
                                  onSelect={
                                    onSelectChat
                                  }
                                  onAction={
                                    handleAction
                                  }
                                />
                              )
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {/* =================================================
                UPGRADE CARD
                Separated from the chat history list with its own
                divider + dismiss control so it never reads as if it
                is covering/replacing the history above it.
            ================================================= */}

            {!upgradeDismissed && (
              <div
                className="
                  px-4
                  pt-3
                  pb-3
                  shrink-0

                  border-t
                  border-[#e1e5f2]
                  dark:border-[#20233f]
                "
              >
                <div
                  className="
                    relative
                    overflow-hidden
                    rounded-[15px]
                    p-3

                    bg-gradient-to-br
                    from-[#e6eeff]
                    via-[#eef0ff]
                    to-[#f2eaff]
                    dark:from-[#181c3d]
                    dark:via-[#1c1f45]
                    dark:to-[#221a3f]

                    border
                    border-white/80
                    dark:border-white/10

                    shadow-[0_8px_24px_rgba(70,80,160,0.10)]
                  "
                >
                  <div
                    className="
                      absolute
                      -right-7
                      -top-7
                      w-20
                      h-20
                      rounded-full
                      bg-white/40
                      dark:bg-white/5
                    "
                  />

                  <button
                    type="button"
                    onClick={dismissUpgradeCard}
                    title="Dismiss"
                    aria-label="Dismiss upgrade card"
                    className="
                      absolute
                      right-2
                      top-2
                      z-10
                      w-5
                      h-5
                      rounded-full

                      flex
                      items-center
                      justify-center

                      text-[#8991ad]
                      dark:text-[#8891c7]

                      hover:bg-white/70
                      dark:hover:bg-white/10
                      hover:text-[#3049c7]
                      dark:hover:text-[#c7d2fe]

                      transition
                    "
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>

                  <div
                    className="
                      relative
                      flex
                      items-start
                      gap-3
                      pr-4
                    "
                  >
                    <div
                      className="
                        w-9
                        h-9
                        rounded-xl

                        bg-gradient-to-br
                        from-[#536dff]
                        to-[#7138f5]

                        text-white

                        flex
                        items-center
                        justify-center

                        shrink-0

                        shadow-md
                      "
                    >
                      <Crown
                        size={18}
                        fill="currentColor"
                      />
                    </div>

                    <div
                      className="
                        min-w-0
                        flex-1
                      "
                    >
                      <p
                        className="
                          text-[13px]
                          font-bold
                          text-[#24336d]
                          dark:text-[#e7e9f7]
                        "
                      >
                        Upgrade to Pro
                      </p>

                      <p
                        className="
                          text-[10px]
                          leading-4
                          text-[#6673a1]
                          dark:text-[#9aa3c7]
                          mt-1
                        "
                      >
                        Get more limits, advanced
                        models and premium features.
                      </p>
                    </div>

                    <button
                      type="button"
                      title="Billing is not available in this build"
                      disabled
                      className="
                        w-8
                        h-8
                        rounded-full

                        bg-gradient-to-r
                        from-[#4169ff]
                        to-[#7138f5]

                        text-white

                        flex
                        items-center
                        justify-center

                        shrink-0

                        shadow-md

                        opacity-50
                        cursor-not-allowed
                      "
                    >
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )}
            </div>
            {/* end scrollable region */}

            {/* =================================================
                ACCOUNT
            ================================================= */}

            <div
              className="
                px-4
                pb-5
                shrink-0
                space-y-1
              "
            >
              {user && (
                <div className="flex items-center gap-3 px-3 py-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#536dff] to-[#7138f5] text-white flex items-center justify-center text-[13px] font-bold shrink-0">
                    {(user.name || user.email || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-[#172554] dark:text-[#e7e9f7] truncate">
                      {user.name || "Account"}
                    </p>
                    <p className="text-[11px] text-[#6673a1] dark:text-[#9aa3c7] truncate">{user.email}</p>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => goTo("/settings")}
                className={`
                  w-full
                  h-[43px]
                  px-3
                  rounded-[13px]

                  flex
                  items-center
                  gap-3

                  text-left

                  transition
                  ${
                    isActive("/settings")
                      ? "bg-[#e8ecff] text-[#3049c7] font-semibold dark:bg-[#232752] dark:text-[#c7d2fe]"
                      : "text-[#172554] hover:bg-white/70 font-medium dark:text-[#c7cbe8] dark:hover:bg-white/5"
                  }
                `}
              >
                <Settings size={19} />
                <span className="text-[14px] font-medium">Settings</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="
                  w-full
                  h-[43px]
                  px-3
                  rounded-[13px]

                  flex
                  items-center
                  gap-3

                  text-left
                  text-[#b91c1c]
                  dark:text-[#f87171]

                  hover:bg-red-50
                  dark:hover:bg-red-500/10

                  transition
                "
              >
                <LogOut size={19} />
                <span className="text-[14px] font-medium">Log out</span>
              </button>
            </div>
          </>
        )}

        {/* =================================================
            COLLAPSED SIDEBAR
        ================================================= */}

        {!sidebarOpen && (
          <div
            className="
              flex
              flex-1
              flex-col
              items-center
              pt-5
              gap-3
            "
          >
            {/* NEW CHAT */}

            <button
              type="button"
              onClick={handleNewChat}
              title="New Chat"
              className="
                group
                relative
                w-11
                h-11
                rounded-[14px]

                flex
                items-center
                justify-center

                text-white

                bg-gradient-to-r
                from-[#3267ff]
                to-[#7138f5]

                shadow-[0_7px_20px_rgba(79,70,229,0.22)]

                hover:scale-105

                transition
              "
            >
              <Plus size={19} />
              <span className="sidebar-tooltip bg-[#111827] text-white dark:bg-[#f4f4fa] dark:text-[#111827] text-[11px] font-medium px-2.5 py-1 rounded-md shadow-lg">
                New Chat
              </span>
            </button>

            <div
              className="
                w-8
                border-t
                border-[#e0e4f0]
                dark:border-[#20233f]
                my-1
              "
            />

            {/* COLLAPSED NAV */}

            {NAV_ITEMS.map(({ key, label, icon: Icon, to }) => {
              const active = isActive(to);
              return (
                <button
                  key={key}
                  type="button"
                  title={label}
                  onClick={() => goTo(to)}
                  className={`
                    group
                    relative
                    w-11
                    h-11
                    rounded-[13px]
                    flex
                    items-center
                    justify-center
                    transition
                    ${
                      active
                        ? "bg-[#e8ecff] text-[#3049c7] dark:bg-[#232752] dark:text-[#c7d2fe]"
                        : "text-[#64709a] hover:bg-white hover:text-[#3049c7] dark:text-[#8891c7] dark:hover:bg-white/5 dark:hover:text-[#c7d2fe]"
                    }
                  `}
                >
                  <Icon size={19} />
                  {key === "notifications" && unreadCount > 0 && (
                    <span className="absolute right-[9px] top-[8px] w-[6px] h-[6px] rounded-full bg-red-500" />
                  )}
                  <span className="sidebar-tooltip bg-[#111827] text-white dark:bg-[#f4f4fa] dark:text-[#111827] text-[11px] font-medium px-2.5 py-1 rounded-md shadow-lg">
                    {label}
                  </span>
                </button>
              );
            })}

            <div className="flex-1" />

            {/* SETTINGS */}

            <button
              type="button"
              title="Settings"
              onClick={() => goTo("/settings")}
              className={`
                group
                relative
                w-11
                h-11
                rounded-[13px]

                flex
                items-center
                justify-center

                transition

                mb-2

                ${
                  isActive("/settings")
                    ? "bg-[#e8ecff] text-[#3049c7] dark:bg-[#232752] dark:text-[#c7d2fe]"
                    : "text-[#64709a] hover:bg-white hover:text-[#3049c7] dark:text-[#8891c7] dark:hover:bg-white/5 dark:hover:text-[#c7d2fe]"
                }
              `}
            >
              <Settings size={19} />
              <span className="sidebar-tooltip bg-[#111827] text-white dark:bg-[#f4f4fa] dark:text-[#111827] text-[11px] font-medium px-2.5 py-1 rounded-md shadow-lg">
                Settings
              </span>
            </button>

            {/* LOGOUT */}

            <button
              type="button"
              title="Log out"
              onClick={handleLogout}
              className="
                group
                relative
                w-11
                h-11
                rounded-[13px]

                flex
                items-center
                justify-center

                text-[#64709a]
                dark:text-[#8891c7]

                hover:bg-white
                hover:text-red-600
                dark:hover:bg-white/5
                dark:hover:text-red-400

                transition

                mb-5
              "
            >
              <LogOut size={19} />
              <span className="sidebar-tooltip bg-[#111827] text-white dark:bg-[#f4f4fa] dark:text-[#111827] text-[11px] font-medium px-2.5 py-1 rounded-md shadow-lg">
                Log out
              </span>
            </button>
          </div>
        )}
      </aside>

      {/* =================================================
          DELETE CONFIRM MODAL
      ================================================= */}

      <ConfirmModal
        open={!!pendingDelete}
        title="Delete this conversation?"
        description="This action cannot be undone."
        onCancel={() =>
          setPendingDelete(null)
        }
        onConfirm={confirmDelete}
      />
    </>
  );
}