import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Visibility } from "@/lib/access";

/**
 * Chapter documents: e-board-managed files and links, grouped by folder and
 * gated by visibility. Mirrors lib/announcements.ts (dual mock/Supabase); write
 * access is enforced by RLS (db/documents.sql), never here.
 *
 *  - FILE docs live in the private `documents` storage bucket; reads mint a
 *    short-lived signed URL.
 *  - LINK docs just store an external URL (Drive/Docs/etc).
 *
 * Mock mode (no Supabase env) persists metadata in localStorage so the flow is
 * demoable; uploaded file blobs are not persisted in mock (link docs are).
 */

export type DocKind = "doc" | "sheet" | "link";
export type DocSource = "file" | "link";

export interface DocItem {
  id: string;
  folder: string;
  name: string;
  kind: DocKind;
  sourceType: DocSource;
  storagePath: string | null;
  linkUrl: string | null;
  visibility: Visibility;
  uploadedBy: string | null;
  uploadedByName: string;
  createdAt: string;
  /** Resolved URL to open/download (signed URL for files, link_url for links). */
  url: string | null;
}

export interface NewDoc {
  folder: string;
  name: string;
  visibility: Visibility;
  /** Provide EITHER a file (upload) OR a linkUrl. */
  file?: File | null;
  linkUrl?: string | null;
}

const MOCK_KEY = "akpsi.ot.documents";
const BUCKET = "documents";

function newId(): string {
  return `doc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** doc vs sheet vs link, inferred from a filename or link. */
export function kindForName(name: string, source: DocSource): DocKind {
  if (source === "link") return "link";
  return /\.(xlsx?|csv|numbers|tsv)$/i.test(name) ? "sheet" : "doc";
}

// --- Mock ------------------------------------------------------------------

const MOCK_SEED: DocItem[] = [
  { id: "doc_seed_bylaws", folder: "Bylaws", name: "Chapter Bylaws 2026.pdf", kind: "doc", sourceType: "link", storagePath: null, linkUrl: "https://example.com/bylaws", visibility: "members", uploadedBy: null, uploadedByName: "Ava Thompson", createdAt: new Date("2026-06-02").toISOString(), url: "https://example.com/bylaws" },
  { id: "doc_seed_minutes", folder: "Meeting Minutes", name: "Chapter Meeting - Jul 13.docx", kind: "doc", sourceType: "link", storagePath: null, linkUrl: "https://example.com/minutes", visibility: "active", uploadedBy: null, uploadedByName: "Priya Nair", createdAt: new Date("2026-07-13").toISOString(), url: "https://example.com/minutes" },
  { id: "doc_seed_budget", folder: "Financials", name: "Budget FY26.xlsx", kind: "sheet", sourceType: "link", storagePath: null, linkUrl: "https://example.com/budget", visibility: "eboard", uploadedBy: null, uploadedByName: "Ethan Cohen", createdAt: new Date("2026-06-20").toISOString(), url: "https://example.com/budget" },
  { id: "doc_seed_rush", folder: "Recruitment Materials", name: "Fall '26 Rush Deck.pdf", kind: "doc", sourceType: "link", storagePath: null, linkUrl: "https://example.com/rush", visibility: "members", uploadedBy: null, uploadedByName: "Sofia Romano", createdAt: new Date("2026-07-15").toISOString(), url: "https://example.com/rush" },
];

function readMock(): DocItem[] {
  if (typeof window === "undefined") return [...MOCK_SEED];
  try {
    const raw = window.localStorage.getItem(MOCK_KEY);
    if (!raw) {
      window.localStorage.setItem(MOCK_KEY, JSON.stringify(MOCK_SEED));
      return [...MOCK_SEED];
    }
    return JSON.parse(raw) as DocItem[];
  } catch {
    return [...MOCK_SEED];
  }
}

function writeMock(rows: DocItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MOCK_KEY, JSON.stringify(rows));
  } catch {
    /* storage may be unavailable */
  }
}

// --- Supabase mapping ------------------------------------------------------

type Row = {
  id: string;
  folder: string;
  name: string;
  kind: DocKind;
  source_type: DocSource;
  storage_path: string | null;
  link_url: string | null;
  visibility: Visibility;
  uploaded_by: string | null;
  uploaded_by_name: string;
  created_at: string;
};

async function mapRow(row: Row): Promise<DocItem> {
  let url: string | null = row.link_url;
  if (row.source_type === "file" && row.storage_path) {
    const supabase = getSupabase();
    if (supabase) {
      const { data } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(row.storage_path, 60 * 60); // 1 hour
      url = data?.signedUrl ?? null;
    }
  }
  return {
    id: row.id,
    folder: row.folder,
    name: row.name,
    kind: row.kind,
    sourceType: row.source_type,
    storagePath: row.storage_path,
    linkUrl: row.link_url,
    visibility: row.visibility,
    uploadedBy: row.uploaded_by,
    uploadedByName: row.uploaded_by_name ?? "",
    createdAt: row.created_at,
    url,
  };
}

// --- Public API ------------------------------------------------------------

export async function listDocuments(): Promise<DocItem[]> {
  if (!isSupabaseConfigured) return readMock();
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("folder", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return Promise.all((data ?? []).map((r) => mapRow(r as Row)));
}

export async function createDocument(input: NewDoc, actorName?: string | null): Promise<void> {
  const folder = input.folder.trim() || "General";
  const name = input.name.trim();
  const isLink = Boolean(input.linkUrl && input.linkUrl.trim());
  const source: DocSource = isLink ? "link" : "file";
  const kind = kindForName(name || (input.file?.name ?? ""), source);

  if (!isSupabaseConfigured) {
    const record: DocItem = {
      id: newId(),
      folder,
      name: name || input.file?.name || "Untitled",
      kind,
      sourceType: source,
      storagePath: null,
      linkUrl: isLink ? input.linkUrl!.trim() : null,
      visibility: input.visibility,
      uploadedBy: null,
      uploadedByName: actorName ?? "You",
      createdAt: new Date().toISOString(),
      // Files aren't persisted in mock; links open normally.
      url: isLink ? input.linkUrl!.trim() : null,
    };
    writeMock([record, ...readMock()]);
    return;
  }

  const supabase = getSupabase();
  if (!supabase) throw new Error("Backend unavailable.");

  let storagePath: string | null = null;
  if (source === "file") {
    if (!input.file) throw new Error("Choose a file to upload, or paste a link.");
    const safe = input.file.name.replace(/[^\w.\-]+/g, "_");
    storagePath = `${crypto.randomUUID()}-${safe}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(storagePath, input.file, {
      upsert: false,
      contentType: input.file.type || undefined,
    });
    if (upErr) throw upErr;
  }

  const { error } = await supabase.from("documents").insert({
    folder,
    name: name || input.file?.name || "Untitled",
    kind,
    source_type: source,
    storage_path: storagePath,
    link_url: isLink ? input.linkUrl!.trim() : null,
    visibility: input.visibility,
  });
  if (error) throw error;
}

export type DocPatch = { folder?: string; name?: string; visibility?: Visibility; linkUrl?: string | null };

export async function updateDocument(id: string, patch: DocPatch): Promise<void> {
  if (!isSupabaseConfigured) {
    const rows = readMock();
    const row = rows.find((d) => d.id === id);
    if (row) {
      if (patch.folder !== undefined) row.folder = patch.folder.trim() || "General";
      if (patch.name !== undefined) row.name = patch.name.trim();
      if (patch.visibility !== undefined) row.visibility = patch.visibility;
      if (patch.linkUrl !== undefined && row.sourceType === "link") {
        row.linkUrl = patch.linkUrl?.trim() || null;
        row.url = row.linkUrl;
      }
      writeMock(rows);
    }
    return;
  }
  const supabase = getSupabase();
  if (!supabase) throw new Error("Backend unavailable.");
  const db: Record<string, unknown> = {};
  if (patch.folder !== undefined) db.folder = patch.folder.trim() || "General";
  if (patch.name !== undefined) db.name = patch.name.trim();
  if (patch.visibility !== undefined) db.visibility = patch.visibility;
  if (patch.linkUrl !== undefined) db.link_url = patch.linkUrl?.trim() || null;
  const { error } = await supabase.from("documents").update(db).eq("id", id);
  if (error) throw error;
}

export async function deleteDocument(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    writeMock(readMock().filter((d) => d.id !== id));
    return;
  }
  const supabase = getSupabase();
  if (!supabase) throw new Error("Backend unavailable.");
  // Look up the storage path so the blob is cleaned up too.
  const { data } = await supabase.from("documents").select("storage_path").eq("id", id).single();
  const path = (data as { storage_path: string | null } | null)?.storage_path;
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw error;
  if (path) await supabase.storage.from(BUCKET).remove([path]);
}

/** Group a flat list into folders, preserving first-seen folder order. */
export function groupByFolder(items: DocItem[]): { name: string; files: DocItem[] }[] {
  const order: string[] = [];
  const map = new Map<string, DocItem[]>();
  for (const item of items) {
    if (!map.has(item.folder)) {
      map.set(item.folder, []);
      order.push(item.folder);
    }
    map.get(item.folder)!.push(item);
  }
  return order.map((name) => ({ name, files: map.get(name)! }));
}
