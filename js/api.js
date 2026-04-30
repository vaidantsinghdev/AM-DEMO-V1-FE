// Network layer — talks to the BE.
// CORS is wide open on the BE; cookies are not used.

export const BASE = import.meta.env.VITE_API_BASE;

export async function api(path, { method = "GET", body, headers } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "ngrok-skip-browser-warning": "true",
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let detail;
    try {
      detail = await res.json();
    } catch {
      detail = await res.text();
    }
    throw Object.assign(new Error(`HTTP ${res.status}`), {
      status: res.status,
      detail,
    });
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.blob();
}

export const pdfUrl = (relPath) => BASE + relPath;
