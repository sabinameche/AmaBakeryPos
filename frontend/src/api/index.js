const RAW_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const apiBaseUrl = RAW_BASE.replace(/\/+$/, ""); // remove trailing /


// Helper to save tokens to localStorage
function saveTokens(tokens) {
  localStorage.setItem("access", tokens.access);
  localStorage.setItem("refresh", tokens.refresh);
}

function safePreview(text, n = 300) {
  return (text || "").slice(0, n).replace(/\s+/g, " ").trim();
}

async function safeJson(res) {
  const text = await res.text();
  const contentType = res.headers.get("content-type") || "";

  // If server says JSON, parse it (even if empty)
  if (contentType.includes("application/json")) {
    return text ? JSON.parse(text) : null;
  }

  // If not JSON, try parse anyway (some servers don't set header)
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new Error(
      `Server did not return JSON.\n` +
      `Status: ${res.status}\n` +
      `Content-Type: ${contentType}\n` +
      `Preview: ${safePreview(text)}`
    );
  }
}

export async function loginUsers(username, password) {
  const url = apiBaseUrl + "/api/token/";

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  console.log("LOGIN:", res.status, res.headers.get("content-type"));

  const data = await safeJson(res);

  if (!res.ok) {
    throw new Error(data?.detail || data?.message || "Invalid username or password");
  }

  // expected: {access, refresh}
  if (!data?.access || !data?.refresh) {
    throw new Error("Login response missing tokens. Check backend response format.");
  }

  saveTokens(data);
  return data;
}

// Optional: if you already have an endpoint that returns role/user details.
// If you don't have it, don't call it.
export async function fetchMe() {
  const token = localStorage.getItem("access");
  if (!token) throw new Error("No access token found");

  const url = apiBaseUrl + "/api/me/";

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  console.log("ME:", res.status, res.headers.get("content-type"));

  const data = await safeJson(res);

  if (!res.ok) {
    throw new Error(data?.detail || "Failed to fetch user profile");
  }
  console.log(data);

  return data; // should include role, name, etc (if backend supports)
}

// Staff / User Management APIs
export async function fetchUsers() {
  const token = localStorage.getItem("access");
  const url = apiBaseUrl + "/api/users/";

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to fetch users");
  return data.users; // The backend returns {success, count, users}
}

export async function createUser(userData) {
  const token = localStorage.getItem("access");
  const url = apiBaseUrl + "/api/users/";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || JSON.stringify(data?.errors) || "Failed to create user");
  return data.user;
}

export async function updateUser(id, userData) {
  const token = localStorage.getItem("access");
  const url = apiBaseUrl + `/api/users/${id}/`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || JSON.stringify(data?.errors) || "Failed to update user");
  return data.user;
}

export async function deleteUser(id) {
  const token = localStorage.getItem("access");
  const url = apiBaseUrl + `/api/users/${id}/`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to delete user");
  return data;
}

// Product Management APIs
export async function fetchProducts() {
  const token = localStorage.getItem("access");
  const url = apiBaseUrl + "/api/products/";

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to fetch products");
  return data.data; // The backend returns {success, data}
}

export async function createProduct(productData) {
  const token = localStorage.getItem("access");
  const url = apiBaseUrl + "/api/products/";


  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(productData),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || JSON.stringify(data?.errors) || "Failed to create product");
  return data.data; // Return the created product object
}

export async function updateProduct(id, productData) {
  const token = localStorage.getItem("access");
  const url = apiBaseUrl + `/api/products/${id}/`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(productData),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || JSON.stringify(data?.errors) || "Failed to update product");
  return data.data; // Return the updated product object
}

export async function deleteProduct(id) {
  const token = localStorage.getItem("access");
  const url = apiBaseUrl + `/api/products/${id}/`;


  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to delete product");
  return data;
}

// Category Management APIs
export async function fetchCategories() {
  const token = localStorage.getItem("access");
  const url = apiBaseUrl + "/api/category/";

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to fetch categories");
  return data.data; // The backend returns {success, data}
}

export async function createCategory(categoryData) {
  const token = localStorage.getItem("access");
  const url = apiBaseUrl + "/api/category/";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(categoryData),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to create category");
  return data;
}

export async function updateCategory(id, categoryData) {
  const token = localStorage.getItem("access");
  const url = apiBaseUrl + `/api/category/${id}/`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(categoryData),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to update category");
  return data;
}

export async function deleteCategory(id) {
  const token = localStorage.getItem("access");
  const url = apiBaseUrl + `/api/category/${id}/`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to delete category");
  return data;
}

// Branch Management APIs (SuperAdmin)
export async function fetchBranches() {
  const token = localStorage.getItem("access");
  const url = apiBaseUrl + "/api/branch/";

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to fetch branches");
  return data; // Returns {success, count, data: [...]}
}

export async function createBranch(branchData) {
  const token = localStorage.getItem("access");
  const url = apiBaseUrl + "/api/branch/";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(branchData),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to create branch");
  return data; // Returns {success, message, data}
}

export async function updateBranch(id, branchData) {
  const token = localStorage.getItem("access");
  const url = apiBaseUrl + `/api/branch/${id}/`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(branchData),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to update branch");
  return data;
}

export async function deleteBranch(id) {
  const token = localStorage.getItem("access");
  const url = apiBaseUrl + `/api/branch/${id}/`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to delete branch");
  return data;
}

// Customer Management APIs
export async function fetchCustomers() {
  const token = localStorage.getItem("access");
  const url = apiBaseUrl + "/api/customer/";

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to fetch customers");
  return data.data; // The backend returns {success, count, data: [...]}
}

export async function createCustomer(customerData) {
  const token = localStorage.getItem("access");
  const url = apiBaseUrl + "/api/customer/";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(customerData),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to create customer");
  return data.data;
}

export async function updateCustomer(id, customerData) {
  const token = localStorage.getItem("access");
  const url = apiBaseUrl + `/api/customer/${id}/`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(customerData),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to update customer");
  return data.data;
}

export async function deleteCustomer(id) {
  const token = localStorage.getItem("access");
  const url = apiBaseUrl + `/api/customer/${id}/`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await safeJson(res);
  // Some delete endpoints return 204 No Content, check status too
  if (!res.ok) throw new Error(data?.message || "Failed to delete customer");
  return data;
}

// Invoice & Checkout APIs
export async function createInvoice(invoiceData) {
  const token = localStorage.getItem("access");
  const url = apiBaseUrl + "/api/invoice/";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(invoiceData),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to create invoice");
  return data.data;
}

export async function fetchInvoices() {
  const token = localStorage.getItem("access");
  const url = apiBaseUrl + "/api/invoice/";

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to fetch invoices");
  return data.data; // The backend returns { success: true, data: [...] }
}
export async function updateInvoiceStatus(id, status) {
  const token = localStorage.getItem("access");
  const url = apiBaseUrl + `/api/invoice/${id}/`;

  console.log("PATCH URL:", url);
  console.log("PATCH BODY:", { invoice_status: status });

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ invoice_status: status }),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to update invoice status");
  return data.data;
}
export async function addPayment(invoiceId, paymentData) {
  const token = localStorage.getItem("access");
  const url = apiBaseUrl + `/api/invoice/${invoiceId}/payments/`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(paymentData),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to add payment");
  return data;
}

export async function createTable(tableData) {
  const token = localStorage.getItem("access");
  const url = apiBaseUrl + "/api/floor/";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(tableData),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to create table");
  return data;
}

export async function fetchTables() {
  const token = localStorage.getItem("access");
  const url = apiBaseUrl + "/api/floor/";

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to fetch tables");
  return data.data; // Expected {success, data: [...]}
}

export async function patchTable(id, tableData) {
  const token = localStorage.getItem("access");
  const url = apiBaseUrl + `/api/floor/${id}/`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(tableData),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to update table");
  return data.data;
}

export async function deleteTable(id) {
  const token = localStorage.getItem("access");
  const url = apiBaseUrl + `/api/floor/${id}/`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const data = await safeJson(res);
    throw new Error(data?.message || "Failed to delete table");
  }
  return true;
}

// Item Activity & Stock Management
export async function addItemActivity(productId, type, activityData) {
  const token = localStorage.getItem("access");
  // type is either 'add' or 'reduce'
  const url = apiBaseUrl + `/api/itemactivity/${productId}/${type}/`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(activityData),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to modify product");
  return data;
}

export async function fetchItemActivity(productId) {
  const token = localStorage.getItem("access");
  const url = apiBaseUrl + `/api/itemactivity/${productId}/detail/`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to fetch item activity");
  return data.data;
}

export async function fetchDashboardDetails(branchId = null) {
  const token = localStorage.getItem("access");
  const url = branchId 
    ? `${apiBaseUrl}/api/calculate/dashboard-details/${branchId}/`
    : `${apiBaseUrl}/api/calculate/dashboard-details/`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to fetch dashboard details");
  return data;
}

export async function fetchReportDashboard(branchId = null) {
  const token = localStorage.getItem("access");
  const url = branchId 
    ? `${apiBaseUrl}/api/calculate/report-dashboard/${branchId}/`
    : `${apiBaseUrl}/api/calculate/report-dashboard/`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to fetch report dashboard");
  return data;
}
