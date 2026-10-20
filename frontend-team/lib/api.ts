const BASE = (process.env.NEXT_PUBLIC_API_URL || "https://learnora-backend.vercel.app").replace(/\/$/, "");

export const token = () =>
  typeof window === "undefined" ? "" : sessionStorage.getItem("learnora_team_token") || "";

export const setToken = (value: string) => {
  sessionStorage.setItem("learnora_team_token", value);
  sessionStorage.setItem("learnora_team_last_activity", String(Date.now()));
};

export const clearToken = () => {
  sessionStorage.removeItem("learnora_team_token");
  sessionStorage.removeItem("learnora_team_last_activity");
};

export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const accessToken = token();
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  let response: Response;
  try {
    response = await fetch(`${BASE}/api/internal${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new ApiRequestError("Cannot reach Learnora's backend. Check your connection and try again.", 0);
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof body.detail === "string"
        ? body.detail
        : typeof body.message === "string"
          ? body.message
          : `Internal request failed (${response.status})`;
    throw new ApiRequestError(message, response.status);
  }
  return body as T;
}

export const teamLogin = (email: string, password: string) =>
  request<any>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });

export const teamMe = () => request<any>("/auth/me");
export const staff = () => request<any>("/staff");
export const staffRoles = () => request<any>("/staff/roles/catalog");
export const departments = () => request<any>("/departments");
export const teams = () => request<any>("/teams");
export const teamMembers = (id: string) => request<any>(`/teams/${encodeURIComponent(id)}/members`);
export const aiHealth = () => request<any>("/ai/health");
export const aiProfiles = () => request<any>("/ai/profiles");
export const updateAiProfile = (key: string, payload: any) =>
  request<any>(`/ai/profiles/${encodeURIComponent(key)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
export const testAiProfile = (key: string) =>
  request<any>(`/ai/profiles/${encodeURIComponent(key)}/test`, { method: "POST" });
