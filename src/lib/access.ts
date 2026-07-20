import type { ChapterUser } from "@/context/AuthContext";

export type PortalRole = ChapterUser["role"];
export type Visibility = "public" | "members" | "active" | "pledge" | "eboard";

export function portalRole(user: ChapterUser | null | undefined): PortalRole {
  return user?.role ?? "active";
}

export function canAccessVisibility(
  visibility: Visibility | undefined,
  role: PortalRole
) {
  const scope = visibility ?? "members";

  if (role === "board") return true;
  if (scope === "public" || scope === "members") return true;
  if (scope === "active") return role === "active";
  if (scope === "pledge") return role === "pledge";
  return false;
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
