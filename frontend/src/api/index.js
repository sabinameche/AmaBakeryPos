const RAW_BASE = import.meta.env.VITE_API_BASE_URL || "amabakerypos-production.up.railway.app";
const apiBaseUrl = RAW_BASE.replace(/\/+$/, ""); // remove trailing /

// --- POLLING CONFIGURATION ---
// You can change this value to adjust polling interval
export const DASHBOARD_POLL_INTERVAL = 3000; // 30 seconds (change this as needed)

// --- TOKEN MANAGEMENT ---
// In-memory access token (more secure against XSS)
let _accessToken = null;

// Helper to save tokens
function saveTokens(tokens) {
  _accessToken = tokens.access;
}

// Clear tokens (logout)
export async function clearTokens() {
  // Clear local state first
  _accessToken = null;
  localStorage.removeItem("currentUser");
  localStorage.removeItem("currentWaiter");

  // Also call backend logout to clear cookie
  try {
    const response = await fetch(apiBaseUrl + "/api/logout/", {
      method: "POST",
      credentials: "include",
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      console.warn("Backend logout returned non-OK status");
    }
  } catch (err) {
    console.error("Logout API call failed:", err);
  }
}

// Get the current access token
export function getAccessToken() {
  return _accessToken;
}

// Refresh the access token
export async function refreshAccessToken() {
  const url = apiBaseUrl + "/api/token/refresh/";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include" // This is key to send the refresh cookie
  });

  if (!res.ok) {
    _accessToken = null;
    localStorage.removeItem("currentUser");
    localStorage.removeItem("currentWaiter");
    throw new Error("Session expired. Please login again.");
  }

  const data = await res.json();
  _accessToken = data.access;
  return _accessToken;
}

// Check if we have a session to restore
export async function initializeAuth() {
  if (_accessToken) return true;

  try {
    // Attempt to refresh using cookie
    await refreshAccessToken();
    return true;
  } catch (err) {
    // No valid refresh cookie or refresh failed
    return false;
  }
}

// --- SECURE FETCHER ---
// This wrapper handles:
// 1. Automatically adding Authorization header
// 2. Handling 401 errors by attempting a token refresh
// 3. Retrying the original request after refresh
async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith("http") ? endpoint : apiBaseUrl + endpoint;

  // Prepare headers
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Add access token if available
  if (_accessToken) {
    headers["Authorization"] = `Bearer ${_accessToken}`;
  }

  const fetchOptions = {
    ...options,
    headers,
    credentials: "include", // Always include cookies
  };

  let response = await fetch(url, fetchOptions);

  // If 401 Unauthorized, try to refresh token once
  // EXCEPTION: Don't try to refresh if we're actually TRYING to login
  if (response.status === 401 && !endpoint.includes("/api/token/")) {
    console.warn("Access token expired, attempting refresh...");
    try {
      const newToken = await refreshAccessToken();
      // Retry with new token
      fetchOptions.headers["Authorization"] = `Bearer ${newToken}`;
      response = await fetch(url, fetchOptions);
    } catch (refreshErr) {
      console.error("Refresh failed:", refreshErr);
      window.dispatchEvent(new CustomEvent("unauthorized"));
    }
  }

  return response;
}

// --- UTILS ---
function safePreview(text, n = 300) {
  return (text || "").slice(0, n).replace(/\s+/g, " ").trim();
}

async function safeJson(res) {
  const text = await res.text();
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return text ? JSON.parse(text) : null;
  }

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new Error(
      `Server did not return JSON.\nStatus: ${res.status}\nContent-Type: ${contentType}\nPreview: ${safePreview(text)}`
    );
  }
}

// --- LONG POLLING FOR DASHBOARD ---

// Store polling state
let dashboardPollingActive = false;
let dashboardPollTimeout = null;
let dashboardPollCallbacks = new Set();

/**
 * Start long polling for dashboard updates
 * @param {Function} onUpdate - Callback function to handle dashboard updates
 * @param {number} interval - Polling interval in milliseconds (default: DASHBOARD_POLL_INTERVAL)
 * @returns {Function} Stop function
 */
export function startDashboardPolling(onUpdate, interval = DASHBOARD_POLL_INTERVAL) {
  // Add callback to set
  dashboardPollCallbacks.add(onUpdate);

  // Start polling if not already active
  if (!dashboardPollingActive) {
    console.log(`🔄 Starting dashboard polling every ${interval / 1000} seconds...`);
    dashboardPollingActive = true;
    pollDashboard(interval);
  }

  // Return function to stop polling for this specific callback
  return () => {
    dashboardPollCallbacks.delete(onUpdate);
    if (dashboardPollCallbacks.size === 0) {
      stopDashboardPolling();
    }
  };
}

/**
 * Stop all dashboard polling
 */
export function stopDashboardPolling() {
  console.log("🛑 Stopping dashboard polling...");
  dashboardPollingActive = false;
  if (dashboardPollTimeout) {
    clearTimeout(dashboardPollTimeout);
    dashboardPollTimeout = null;
  }
}

/**
 * Internal polling function
 */
async function pollDashboard(interval) {
  if (!dashboardPollingActive) return;

  try {
    console.log('📊 Polling dashboard...', new Date().toLocaleTimeString());

    // Use your existing apiFetch to get dashboard data
    const data = await fetchDashboardDetails();

    // Notify all callbacks
    dashboardPollCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (err) {
        console.error('Error in dashboard polling callback:', err);
      }
    });

    console.log('✅ Dashboard updated', new Date().toLocaleTimeString());

  } catch (error) {
    console.error('❌ Dashboard polling failed:', error);

    // Don't stop polling on error, just log it
    // The apiFetch will handle token refresh automatically

  } finally {
    // Schedule next poll
    if (dashboardPollingActive) {
      dashboardPollTimeout = setTimeout(() => {
        pollDashboard(interval);
      }, interval);
    }
  }
}

/**
 * Get current polling status
 * @returns {boolean} Whether polling is active
 */
export function isDashboardPollingActive() {
  return dashboardPollingActive;
}

/**
 * Get number of active polling listeners
 * @returns {number} Number of active callbacks
 */
export function getDashboardPollingListenerCount() {
  return dashboardPollCallbacks.size;
}

// --- API METHODS ---

export async function loginUsers(username, password) {
  const url = "/api/token/";
  const res = await apiFetch(url, {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  const data = await safeJson(res);
  if (!res.ok) {
    // Return specific error message from server if possible
    throw new Error(data?.detail || data?.message || (data?.non_field_errors ? data.non_field_errors[0] : "Invalid username or password"));
  }

  if (!data?.access) {
    throw new Error("Login response missing access token.");
  }
  saveTokens(data);
  return data;
}

export async function changePassword(oldPassword, newPassword) {
  const res = await apiFetch("/api/change-password/", {
    method: "POST",
    body: JSON.stringify({
      old_password: oldPassword,
      new_password: newPassword
    }),
  });
  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(data?.message || JSON.stringify(data?.errors) || "Failed to change password");
  }
  return data;
}

export async function adminResetPassword(userId, newPassword) {
  const res = await apiFetch(`/api/admin-reset-password/${userId}/`, {
    method: "POST",
    body: JSON.stringify({
      new_password: newPassword
    }),
  });
  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(data?.message || "Failed to reset password");
  }
  return data;
}

export async function fetchMe() {
  const res = await apiFetch("/api/me/");
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.detail || "Failed to fetch user profile");
  return data;
}

export async function fetchUsers() {
  const res = await apiFetch("/api/users/");
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to fetch users");
  return data.users;
}

export async function createUser(userData) {
  const res = await apiFetch("/api/users/", {
    method: "POST",
    body: JSON.stringify(userData),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || JSON.stringify(data?.errors) || "Failed to create user");
  return data.user;
}

export async function updateUser(id, userData) {
  const res = await apiFetch(`/api/users/${id}/`, {
    method: "PUT",
    body: JSON.stringify(userData),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || JSON.stringify(data?.errors) || "Failed to update user");
  return data.user;
}

export async function deleteUser(id) {
  const res = await apiFetch(`/api/users/${id}/`, {
    method: "DELETE",
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to delete user");
  return data;
}

export async function fetchProducts() {
  const res = await apiFetch("/api/products/");
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to fetch products");
  return data.data;
}

export async function createProduct(productData) {
  const res = await apiFetch("/api/products/", {
    method: "POST",
    body: JSON.stringify(productData),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || JSON.stringify(data?.errors) || "Failed to create product");
  return data.data;
}

export async function updateProduct(id, productData) {
  const res = await apiFetch(`/api/products/${id}/`, {
    method: "PUT",
    body: JSON.stringify(productData),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || JSON.stringify(data?.errors) || "Failed to update product");
  return data.data;
}

export async function deleteProduct(id) {
  const res = await apiFetch(`/api/products/${id}/`, {
    method: "DELETE",
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to delete product");
  return data;
}

export async function fetchCategories() {
  const res = await apiFetch("/api/category/");
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to fetch categories");
  return data.data;
}

export async function createCategory(categoryData) {
  const res = await apiFetch("/api/category/", {
    method: "POST",
    body: JSON.stringify(categoryData),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to create category");
  return data;
}

export async function updateCategory(id, categoryData) {
  const res = await apiFetch(`/api/category/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(categoryData),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to update category");
  return data;
}

export async function deleteCategory(id) {
  const res = await apiFetch(`/api/category/${id}/`, {
    method: "DELETE",
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to delete category");
  return data;
}

export async function fetchBranches() {
  const res = await apiFetch("/api/branch/");
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to fetch branches");
  return data;
}

export async function createBranch(branchData) {
  const res = await apiFetch("/api/branch/", {
    method: "POST",
    body: JSON.stringify(branchData),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to create branch");
  return data;
}

export async function updateBranch(id, branchData) {
  const res = await apiFetch(`/api/branch/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(branchData),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to update branch");
  return data;
}

export async function deleteBranch(id) {
  const res = await apiFetch(`/api/branch/${id}/`, {
    method: "DELETE",
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to delete branch");
  return data;
}

export async function fetchCustomers() {
  const res = await apiFetch("/api/customer/");
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to fetch customers");
  return data.data;
}

export async function createCustomer(customerData) {
  const res = await apiFetch("/api/customer/", {
    method: "POST",
    body: JSON.stringify(customerData),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to create customer");
  return data.data;
}

export async function updateCustomer(id, customerData) {
  const res = await apiFetch(`/api/customer/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(customerData),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to update customer");
  return data.data;
}

export async function deleteCustomer(id) {
  const res = await apiFetch(`/api/customer/${id}/`, {
    method: "DELETE",
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to delete customer");
  return data;
}

export async function createInvoice(invoiceData) {
  const res = await apiFetch("/api/invoice/", {
    method: "POST",
    body: JSON.stringify(invoiceData),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to create invoice");
  return data.data;
}

export async function fetchInvoices() {
  const res = await apiFetch("/api/invoice/");
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to fetch invoices");
  return data.data;
}

export async function updateInvoiceStatus(id, status) {
  const res = await apiFetch(`/api/invoice/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ invoice_status: status }),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to update invoice status");
  return data.data;
}

export async function addPayment(invoiceId, paymentData) {
  const res = await apiFetch(`/api/invoice/${invoiceId}/payments/`, {
    method: "POST",
    body: JSON.stringify(paymentData),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to add payment");
  return data;
}

export async function createTable(tableData) {
  const res = await apiFetch("/api/floor/", {
    method: "POST",
    body: JSON.stringify(tableData),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to create table");
  return data;
}

export async function fetchTables() {
  const res = await apiFetch("/api/floor/");
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to fetch tables");
  return data.data;
}

export async function patchTable(id, tableData) {
  const res = await apiFetch(`/api/floor/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(tableData),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to update table");
  return data.data;
}

export async function deleteTable(id) {
  const res = await apiFetch(`/api/floor/${id}/`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await safeJson(res);
    throw new Error(data?.message || "Failed to delete table");
  }
  return true;
}

export async function addItemActivity(productId, type, activityData) {
  const res = await apiFetch(`/api/itemactivity/${productId}/${type}/`, {
    method: "POST",
    body: JSON.stringify(activityData),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to modify product");
  return data;
}

export async function fetchItemActivity(productId) {
  const res = await apiFetch(`/api/itemactivity/${productId}/detail/`);
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to fetch item activity");
  return data.data;
}

export async function fetchDashboardDetails(branchId = null) {
  const url = branchId
    ? `/api/calculate/dashboard-details/${branchId}/`
    : `/api/calculate/dashboard-details/`;
  const res = await apiFetch(url);
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to fetch dashboard details");
  return data;
}

/**
 * Fetch dashboard stats (alias for fetchDashboardDetails)
 * Use this for polling to keep naming consistent
 */
export async function fetchDashboardStats(branchId = null) {
  return fetchDashboardDetails(branchId);
}

export async function fetchReportDashboard(branchId = null) {
  const url = branchId
    ? `/api/calculate/report-dashboard/${branchId}/`
    : `/api/calculate/report-dashboard/`;
  const res = await apiFetch(url);
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to fetch report dashboard");
  return data;
}

export async function fetchStaffReport(branchId = null) {
  const url = branchId
    ? `/api/calculate/staff-report/${branchId}/`
    : `/api/calculate/staff-report/`;
  const res = await apiFetch(url);
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to fetch staff report");
  return data;
}

/**
 * Manual refresh dashboard (one-time fetch)
 */
export async function refreshDashboard(branchId = null) {
  return fetchDashboardDetails(branchId);
}

export async function fetchInvoicesByCustomer(customerId) {
  const res = await apiFetch(`/api/invoice/?customer=${customerId}`);
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to fetch invoices for customer");
  return data.data;
}
