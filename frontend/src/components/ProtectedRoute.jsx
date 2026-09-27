import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../services/api";

/**
 * Guards a route so it can only be reached with a real JWT issued by the
 * backend. This is enforced on the server too (every API call requires
 * the same token) — this wrapper just avoids flashing protected UI before
 * redirecting to /auth.
 */
export default function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}
