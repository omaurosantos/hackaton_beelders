"use client";

export function getStoredRole() {
  if (typeof window === "undefined" || typeof window.localStorage?.getItem !== "function") {
    return null;
  }

  const role = window.localStorage.getItem("role");
  return role === "ies" || role === "professor" ? role : null;
}

export function setStoredRole(role: "professor" | "ies") {
  if (typeof window !== "undefined" && typeof window.localStorage?.setItem === "function") {
    window.localStorage.setItem("role", role);
  }
}

export function removeStoredRole() {
  if (typeof window !== "undefined" && typeof window.localStorage?.removeItem === "function") {
    window.localStorage.removeItem("role");
  }
}
