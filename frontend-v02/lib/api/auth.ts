import { request } from "./client";

let cachedUser: any = null;
let cachedForToken = "";
let currentUserRequest: Promise<any> | null = null;

function activeToken() {
  return typeof window === "undefined" ? "" : localStorage.getItem("phx_token") || "";
}

/** Synchronous cache read for client-side route transitions. */
export function getCachedCurrentUser() {
  const token = activeToken();
  return token && token === cachedForToken ? cachedUser : null;
}

export const login = (email: string, password: string) =>
  request<any>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });

export const register = (name: string, email: string, password: string) =>
  request<any>("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });

export function currentUser(): Promise<any> {
  const token = activeToken();
  if (!token) {
    cachedUser = null;
    cachedForToken = "";
    return Promise.reject(new Error("Your session has expired. Please sign in again."));
  }

  if (cachedUser && cachedForToken === token) return Promise.resolve(cachedUser);
  if (currentUserRequest && cachedForToken === token) return currentUserRequest;

  cachedForToken = token;
  const pending = request<any>("/auth/me")
    .then((user) => {
      if (activeToken() === token) cachedUser = user;
      return user;
    })
    .catch((error) => {
      if (cachedForToken === token) {
        cachedUser = null;
        cachedForToken = "";
      }
      throw error;
    });

  currentUserRequest = pending;
  pending.then(
    () => { if (currentUserRequest === pending) currentUserRequest = null; },
    () => { if (currentUserRequest === pending) currentUserRequest = null; }
  );

  return pending;
}

export const forgotPassword = (email: string) =>
  request<any>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
