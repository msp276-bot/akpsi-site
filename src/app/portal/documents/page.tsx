"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Folder, FileText, FileSpreadsheet, Link2, Download, ExternalLink,
  ChevronRight, Plus, Pencil, Trash2, X, Upload,
} from "lucide-react";
import PortalShell from "@/components/portal/PortalShell";
import { useAuth } from "@/context/AuthContext";
import { canAccessVisibility, isEboardOrAdmin, portalRole, visibilityLabel, type Visibility } from "@/lib/access";
import {
  listDocuments, createDocument, updateDocument, deleteDocument, groupByFolder,
  type DocItem, type NewDoc,
} from "@/lib/documents";

export default function DocumentsPage() {
  return (
    <PortalShell>
      <Documents />
    </PortalShell>
  );
}

function Documents() {
  const { user } = useAuth();
  const role = portalRole(user);
  const isBoard = isEboardOrAdmin(role);

  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [editing, setEditing] = useState<DocItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await listDocuments();
        if (active) {
          setDocs(rows);
          setOpen((cur) => cur ?? rows[0]?.folder ?? null);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Could not load documents.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const folders = useMemo(() => {
    const visible = docs.filter((d) => canAccessVisibility(d.visibility, role));
    return groupByFolder(visible);
  }, [docs, role]);

  const existingFolderNames = useMemo(
    () => Array.from(new Set(docs.map((d) => d.folder))),
    [docs]
  );

  async function handleCreate(input: NewDoc) {
    setError(null);
    try {
      await createDocument(input, user?.name);
      setShowComposer(false);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the document.");
    }
  }

  async function handleUpdate(id: string, patch: { folder: string; name: string; visibility: Visibility; linkUrl?: string | null }) {
    setError(null);
    try {
      await updateDocument(id, patch);
      setEditing(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the document.");
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await deleteDocument(id);
      setConfirmDeleteId(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the document.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Documents</h1>
          <p className="mt-1 text-sm text-muted">Chapter resources, organized by folder.</p>
        </div>
        {isBoard && (
          <button
            onClick={() => { setEditing(null); setShowComposer((s) => !s); }}
            className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy/90"
          >
            <Plus size={15} /> Add document
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-scarlet/30 bg-scarlet/5 px-4 py-3 text-sm text-scarlet">{error}</div>
      )}

      {isBoard && showComposer && !editing && (
        <DocComposer
          folders={existingFolderNames}
          onClose={() => setShowComposer(false)}
          onSubmit={handleCreate}
        />
      )}

      {loading ? (
        <p className="mt-8 text-sm text-muted">Loading documents...</p>
      ) : folders.length === 0 ? (
        <p className="mt-8 text-sm text-muted">No documents yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {folders.map((folder) => {
            const expanded = open === folder.name;
            return (
              <div key={folder.name} className="overflow-hidden rounded-xl border border-line bg-white">
                <button
                  onClick={() => setOpen(expanded ? null : folder.name)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                >
                  <ChevronRight size={16} className={`text-muted transition-transform ${expanded ? "rotate-90" : ""}`} />
                  <Folder size={18} className="text-gold" />
                  <span className="font-semibold text-ink">{folder.name}</span>
                  <span className="ml-auto text-xs text-muted">{folder.files.length} files</span>
                </button>

                {expanded && (
                  <div className="divide-y divide-line border-t border-line">
                    {folder.files.map((f) => {
                      const isEditingThis = editing?.id === f.id;
                      if (isEditingThis) {
                        return (
                          <div key={f.id} className="p-4">
                            <DocComposer
                              folders={existingFolderNames}
                              initial={f}
                              onClose={() => setEditing(null)}
                              onSubmit={(input) => handleUpdate(f.id, {
                                folder: input.folder,
                                name: input.name,
                                visibility: input.visibility,
                                linkUrl: input.linkUrl,
                              })}
                            />
                          </div>
                        );
                      }
                      return (
                        <div key={f.id} className="flex items-center gap-3 px-4 py-3 pl-12 transition-colors hover:bg-slate-50">
                          {f.kind === "sheet" ? (
                            <FileSpreadsheet size={17} className="text-green-600" />
                          ) : f.kind === "link" ? (
                            <Link2 size={17} className="text-blue" />
                          ) : (
                            <FileText size={17} className="text-blue" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-ink">{f.name}</p>
                            <p className="text-xs text-muted">
                              {f.uploadedByName || "Unknown"}
                              {isBoard && (
                                <span className="ml-2 rounded-full bg-navy/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-navy">
                                  {visibilityLabel(f.visibility)}
                                </span>
                              )}
                            </p>
                          </div>
                          {f.url ? (
                            <a
                              href={f.url}
                              target="_blank"
                              rel="noreferrer"
                              className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-navy hover:text-white"
                              aria-label={`Open ${f.name}`}
                            >
                              {f.sourceType === "link" ? <ExternalLink size={15} /> : <Download size={15} />}
                            </a>
                          ) : (
                            <span className="text-[11px] text-muted" title="File not available in preview mode">n/a</span>
                          )}
                          {isBoard && (
                            <>
                              <button
                                onClick={() => { setShowComposer(false); setEditing(f); }}
                                className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-slate-100 hover:text-navy"
                                aria-label={`Edit ${f.name}`}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(f.id)}
                                className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-scarlet/10 hover:text-scarlet"
                                aria-label={`Delete ${f.name}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                          {confirmDeleteId === f.id && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDelete(f.id)}
                                disabled={busyId === f.id}
                                className="rounded-full bg-scarlet px-2.5 py-1 text-xs font-semibold text-white hover:bg-scarlet/90 disabled:opacity-60"
                              >
                                {busyId === f.id ? "..." : "Delete"}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="rounded-full border border-line px-2.5 py-1 text-xs font-semibold text-muted hover:text-navy"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DocComposer({
  folders,
  initial,
  onClose,
  onSubmit,
}: {
  folders: string[];
  initial?: DocItem;
  onClose: () => void;
  onSubmit: (input: NewDoc) => void;
}) {
  const isEdit = Boolean(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [folder, setFolder] = useState(initial?.folder ?? (folders[0] ?? "General"));
  const [visibility, setVisibility] = useState<Visibility>(initial?.visibility ?? "members");
  // On edit, keep the original source type (blob can't be swapped here); on
  // create, let the user pick file vs link.
  const [mode, setMode] = useState<"file" | "link">(initial?.sourceType === "link" ? "link" : "file");
  const [file, setFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState(initial?.linkUrl ?? "");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim() && (isEdit || (mode === "link" ? linkUrl.trim() : file));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    await onSubmit({
      folder: folder.trim() || "General",
      name: name.trim(),
      visibility,
      file: !isEdit && mode === "file" ? file : null,
      linkUrl: mode === "link" ? linkUrl.trim() : null,
    });
    setSubmitting(false);
  }

  return (
    <form onSubmit={submit} className="mt-6 rounded-2xl border border-gold/30 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-ink">{isEdit ? "Edit document" : "Add document"}</h2>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-slate-100" aria-label="Close">
          <X size={17} />
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Display name (e.g. Chapter Bylaws 2026)"
          className="rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-blue"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted">Folder</label>
            <input
              list="doc-folders"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              placeholder="Folder"
              className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-blue"
            />
            <datalist id="doc-folders">
              {folders.map((f) => <option key={f} value={f} />)}
            </datalist>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as Visibility)}
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-blue"
            >
              <option value="members">All members</option>
              <option value="active">Active only</option>
              <option value="pledge">Pledge only</option>
              <option value="eboard">E-Board only</option>
              <option value="public">Public</option>
            </select>
          </div>
        </div>

        {/* Source: on create, choose file or link. On edit, only the link URL is
            editable (a file's blob can't be swapped here). */}
        {!isEdit && (
          <div className="inline-flex rounded-lg border border-line bg-white p-1 text-sm">
            {(["file", "link"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-md px-3 py-1.5 font-medium capitalize ${mode === m ? "bg-navy text-white" : "text-muted"}`}
              >
                {m === "file" ? "Upload file" : "Link"}
              </button>
            ))}
          </div>
        )}

        {mode === "file" && !isEdit && (
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-line px-3 py-2.5 text-sm text-muted hover:border-navy/40">
            <Upload size={15} />
            {file ? <span className="truncate text-ink">{file.name}</span> : "Choose a file to upload"}
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
        )}

        {mode === "link" && (
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://drive.google.com/..."
            className="rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-blue"
          />
        )}

        {isEdit && initial?.sourceType === "file" && (
          <p className="text-xs text-muted">Uploaded file. To replace the file itself, delete and re-upload.</p>
        )}
      </div>

      <button
        disabled={submitting || !canSubmit}
        className="mt-4 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-60"
      >
        {submitting ? "Saving..." : isEdit ? "Save changes" : "Add document"}
      </button>
    </form>
  );
}
