/**
 * A2Z Nexus — Auth + API helper
 *
 * Centralizes JWT storage and adds the Authorization header to every
 * backend call. Replaces the old localStorage-only fake-login approach:
 * the token below is issued by the real backend (`POST /api/auth/login`
 * or `/api/auth/register`) after verifying a bcrypt-hashed password.
 */

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const TOKEN_KEY = "a2z-nexus-token";
const USER_KEY = "a2z-nexus-user-profile";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  // Keep legacy key in sync for any old code paths still reading it.
  localStorage.setItem(
    "a2z-nexus-session",
    JSON.stringify({ name: user.name, email: user.email, guest: false })
  );
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("a2z-nexus-session");
}

export function isAuthenticated() {
  return !!getToken();
}

/**
 * authFetch — fetch wrapper that attaches the JWT, applies a timeout,
 * parses JSON safely, and throws a readable Error on failure.
 * On a 401 it clears the stale session so ProtectedRoute redirects to /auth.
 */
export async function authFetch(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);

  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    let data = null;
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      if (response.status === 401) {
        clearSession();
      }
      const message =
        data?.detail ||
        data?.error ||
        (Array.isArray(data?.detail) ? data.detail.map((d) => d.msg).join(", ") : null) ||
        `Request failed (${response.status})`;
      throw new Error(typeof message === "string" ? message : `Request failed (${response.status})`);
    }

    return data;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection and try again.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  get: (path) => authFetch(path),
  post: (path, body) => authFetch(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  patch: (path, body) =>
    authFetch(path, { method: "PATCH", ...(body === undefined ? {} : { body: JSON.stringify(body) }) }),
  delete: (path) => authFetch(path, { method: "DELETE" }),
};

// ─── Auth ────────────────────────────────────────────────────────────────
export const authApi = {
  register: (name, email, password) => api.post("/auth/register", { name, email, password }),
  login: (email, password) => api.post("/auth/login", { email, password }),
  me: () => api.get("/auth/me"),
};

// ─── Projects ────────────────────────────────────────────────────────────
export const projectsApi = {
  list: () => api.get("/projects"),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post("/projects", data),
  update: (id, data) => api.patch(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

// ─── Agents ──────────────────────────────────────────────────────────────
export const analysisApi = { analyze: (projectId) => api.post("/analyze", { project_id: projectId }) };
export const testingApi = {
  run: (projectId) => api.post("/test/run", { project_id: projectId }),
  generate: (projectId) => api.post("/test/generate", { project_id: projectId }),
};
export const recommendationsApi = {
  get: (projectId) => api.post("/recommendations", { project_id: projectId }),
};
export const documentationApi = {
  generate: (projectId, docType) => api.post("/documentation", { project_id: projectId, doc_type: docType }),
};
export const contentApi = {
  generate: (projectId, contentType) => api.post("/content", { project_id: projectId, content_type: contentType }),
};
export const narrationApi = {
  generate: (projectId, narrationFor) =>
    api.post("/narration", { project_id: projectId, narration_for: narrationFor }),
};
export const submissionApi = { check: (projectId) => api.post("/submission/check", { project_id: projectId }) };
export const releaseApi = { check: (projectId) => api.post("/release/check", { project_id: projectId }) };

// ─── Reminders ───────────────────────────────────────────────────────────
export const remindersApi = {
  list: () => api.get("/reminders"),
  create: (data) => api.post("/reminders", data),
};

// ─── Notifications ───────────────────────────────────────────────────────
export const notificationsApi = {
  list: (unreadOnly = false) => api.get(`/notifications${unreadOnly ? "?unread_only=true" : ""}`),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
};

// ─── Chat sessions ───────────────────────────────────────────────────────
export const chatApi = {
  listSessions: () => api.get("/chat/sessions"),
  getSession: (id) => api.get(`/chat/sessions/${id}`),
  deleteSession: (id) => api.delete(`/chat/sessions/${id}`),
};