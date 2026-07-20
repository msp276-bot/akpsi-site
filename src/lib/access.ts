import type { ChapterUser } from "@/context/AuthContext";

export type PortalRole = ChapterUser["role"];
export type Visibility = "public" | "members" | "active" | "pledge" | "eboard";
export type Permission =
  | "read:public"
  | "read:calendar"
  | "read:directory"
  | "read:documents"
  | "read:announcements"
  | "read:eboard_content"
  | "read:applications"
  | "write:event"
  | "write:announcement"
  | "write:document"
  | "edit:member"
  | "admin:*";

export const ROLE_PERMISSIONS: Record<PortalRole, Permission[]> = {
  pledge: [
    "read:public",
    "read:calendar",
    "read:documents",
    "read:announcements",
  ],
  active: [
    "read:public",
    "read:calendar",
    "read:directory",
    "read:documents",
    "read:announcements",
  ],
  board: [
    "read:public",
    "read:calendar",
    "read:directory",
    "read:documents",
    "read:announcements",
    "read:eboard_content",
    "read:applications",
    "write:event",
    "write:announcement",
    "write:document",
    "edit:member",
  ],
  admin: ["admin:*"],
};

export function portalRole(user: ChapterUser | null | undefined): PortalRole {
  return user?.role ?? "active";
}

export function canAccessVisibility(
  visibility: Visibility | undefined,
  role: PortalRole
) {
  const scope = visibility ?? "members";

  if (role === "admin" || role === "board") return true;
  if (scope === "public" || scope === "members") return true;
  if (scope === "active") return role === "active";
  if (scope === "pledge") return role === "pledge";
  return false;
}

export function hasPermission(role: PortalRole, permission: Permission) {
  const permissions = ROLE_PERMISSIONS[role] ?? [];
  return permissions.includes("admin:*") || permissions.includes(permission);
}

export function isEboardOrAdmin(role: PortalRole) {
  return role === "board" || role === "admin";
}

export function roleLabel(role: PortalRole) {
  switch (role) {
    case "admin":
      return "Admin Portal";
    case "board":
      return "E-Board Portal";
    case "pledge":
      return "Pledge Portal";
    case "active":
      return "Active Brother Portal";
  }
}

export function visibilityLabel(visibility: Visibility | undefined) {
  switch (visibility ?? "members") {
    case "public":
      return "Public";
    case "members":
      return "All members";
    case "active":
      return "Active only";
    case "pledge":
      return "Pledge only";
    case "eboard":
      return "E-Board only";
  }
}
