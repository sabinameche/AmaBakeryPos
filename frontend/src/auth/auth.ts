import { jwtDecode } from "jwt-decode";
import { getAccessToken, clearTokens } from "../api/index.js";

interface DecodedToken {
  user_id: string;
  username: string;
  user_type: string;
  is_superuser: boolean;
  is_staff: boolean;
  branch_id?: number;
  branch_name?: string;
  exp: number;
}

export function isLoggedIn() {
  const token = getAccessToken();
  if (!token) return false;

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    // Check if token is expired
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function getDecodedToken(): DecodedToken | null {
  const token = getAccessToken();
  if (!token) return null;
  try {
    return jwtDecode<DecodedToken>(token);
  } catch {
    return null;
  }
}

export function getCurrentUser() {
  const decoded = getDecodedToken();
  if (decoded) {
    const userRole = decoded.user_type;
    const isSuperuser = decoded.is_superuser || userRole === 'SUPER_ADMIN';

    // If SuperAdmin has selected a specific branch, override the branch details
    if (isSuperuser) {
      const selectedBranchStr = localStorage.getItem('selectedBranch');
      if (selectedBranchStr) {
        try {
          const selectedBranch = JSON.parse(selectedBranchStr);
          return {
            id: decoded.user_id,
            username: decoded.username,
            role: userRole,
            is_superuser: true,
            is_staff: decoded.is_staff,
            branch_id: selectedBranch.id,
            branch_name: selectedBranch.name,
            is_branch_scoped: true // Added flag to indicate this is a scoped view
          };
        } catch (e) {
          console.error("Error parsing selectedBranch", e);
        }
      }
    }

    return {
      id: decoded.user_id,
      username: decoded.username,
      role: userRole,
      is_superuser: isSuperuser,
      is_staff: decoded.is_staff,
      branch_id: decoded.branch_id,
      branch_name: decoded.branch_name,
    };
  }

  // Fallback for legacy data (if any)
  const u = localStorage.getItem("currentUser");
  return u ? JSON.parse(u) : null;
}

export async function logout() {
  await clearTokens();
  window.location.href = "/login";
}