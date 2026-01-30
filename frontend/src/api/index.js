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