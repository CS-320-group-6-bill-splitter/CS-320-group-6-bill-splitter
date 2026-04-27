// Base API service for communicating with the Django backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    let message: string | undefined;
    if (body && typeof body === "object") {
      if (typeof body.error === "string") {
        message = body.error;
      } else if (typeof body.detail === "string") {
        message = body.detail;
      } else {
        // DRF validation errors come keyed by field, e.g. {"debts": ["..."]}.
        // Flatten them into a readable string.
        const parts: string[] = [];
        for (const [field, errs] of Object.entries(body)) {
          const text = Array.isArray(errs) ? errs.join(" ") : String(errs);
          parts.push(`${field}: ${text}`);
        }
        if (parts.length > 0) message = parts.join(" | ");
      }
    }
    throw new Error(message || `API error: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
