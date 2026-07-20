"use client";

import { useState } from "react";
import {
  Folder,
  FileText,
  FileSpreadsheet,
  Download,
  ChevronRight,
  Upload,
} from "lucide-react";
import PortalShell from "@/components/portal/PortalShell";
import { useAuth } from "@/context/AuthContext";
import { canAccessVisibility, portalRole, visibilityLabel, type Visibility } from "@/lib/access";

interface Doc {
  name: string;
  kind: "doc" | "sheet";
  uploaded: string;
  by: string;
  visibility: Visibility;
}

const FOLDERS: { name: string; visibility: Visibility; files: Doc[] }[] = [
  {
    name: "Bylaws",
    visibility: "members",
    files: [
      { name: "Chapter Bylaws 2026.pdf", kind: "doc", uploaded: "Jun 2, 2026", by: "Ava Thompson", visibility: "members" },
      { name: "National Constitution.pdf", kind: "doc", uploaded: "Jan 14, 2026", by: "Ava Thompson", visibility: "members" },
    ],
  },
  {
    name: "Meeting Minutes",
    visibility: "active",
    files: [
      { name: "Chapter Meeting — Jul 13.docx", kind: "doc", uploaded: "Jul 13, 2026", by: "Priya Nair", visibility: "active" },
      { name: "Chapter Meeting — Jul 6.docx", kind: "doc", uploaded: "Jul 6, 2026", by: "Priya Nair", visibility: "active" },
      { name: "Board Sync — Jul 1.docx", kind: "doc", uploaded: "Jul 1, 2026", by: "Priya Nair", visibility: "eboard" },
    ],
  },
  {
    name: "Financials",
    visibility: "eboard",
    files: [
      { name: "Budget FY26.xlsx", kind: "sheet", uploaded: "Jun 20, 2026", by: "Ethan Cohen", visibility: "eboard" },
      { name: "Dues Tracker.xlsx", kind: "sheet", uploaded: "Jul 10, 2026", by: "Ethan Cohen", visibility: "eboard" },
    ],
  },
  {
    name: "Recruitment Materials",
    visibility: "members",
    files: [
      { name: "Spring '27 Rush Deck.pdf", kind: "doc", uploaded: "Jul 15, 2026", by: "Sofia Romano", visibility: "members" },
      { name: "Interview Rubric.xlsx", kind: "sheet", uploaded: "Jul 12, 2026", by: "Sofia Romano", visibility: "eboard" },
    ],
  },
  {
    name: "Pledge Resources",
    visibility: "pledge",
    files: [
      { name: "Pledge Education Guide.pdf", kind: "doc", uploaded: "Jul 18, 2026", by: "Sofia Romano", visibility: "pledge" },
      { name: "Interview Prep Checklist.docx", kind: "doc", uploaded: "Jul 19, 2026", by: "Marcus Lee", visibility: "pledge" },
    ],
  },
];

export default function DocumentsPage() {
  return (
    <PortalShell>
      <Documents />
    </PortalShell>
  );
}

function Documents() {
  const { user } = useAuth();
  const [open, setOpen] = useState<string | null>("Meeting Minutes");
  const role = portalRole(user);
  const isBoard = role === "board";
  const visibleFolders = FOLDERS.map((folder) => ({
    ...folder,
    files: folder.files.filter((file) => canAccessVisibility(file.visibility, role)),
  })).filter((folder) => canAccessVisibility(folder.visibility, role) && folder.files.length > 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Documents</h1>
          <p className="mt-1 text-sm text-muted">
            Chapter resources, organized by folder.
          </p>
        </div>
        {isBoard && (
          <button className="inline-flex items-center gap-2 rounded-full border border-dashed border-navy/40 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5">
            <Upload size={15} /> Upload
          </button>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {visibleFolders.map((folder) => {
          const expanded = open === folder.name;
          return (
            <div
              key={folder.name}
              className="overflow-hidden rounded-xl border border-line bg-white"
            >
              <button
                onClick={() => setOpen(expanded ? null : folder.name)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
              >
                <ChevronRight
                  size={16}
                  className={`text-muted transition-transform ${
                    expanded ? "rotate-90" : ""
                  }`}
                />
                <Folder size={18} className="text-gold" />
                <span className="font-semibold text-ink">{folder.name}</span>
                {isBoard && (
                  <span className="rounded-full bg-navy/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-navy">
                    {visibilityLabel(folder.visibility)}
                  </span>
                )}
                <span className="ml-auto text-xs text-muted">
                  {folder.files.length} files
                </span>
              </button>

              {expanded && (
                <div className="divide-y divide-line border-t border-line">
                  {folder.files.map((f) => (
                    <div
                      key={f.name}
                      className="flex items-center gap-3 px-4 py-3 pl-12 transition-colors hover:bg-slate-50"
                    >
                      {f.kind === "sheet" ? (
                        <FileSpreadsheet size={17} className="text-green-600" />
                      ) : (
                        <FileText size={17} className="text-blue" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">
                          {f.name}
                        </p>
                        <p className="text-xs text-muted">
                          {f.uploaded} · {f.by}
                        </p>
                      </div>
                      <button
                        className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-navy hover:text-white"
                        aria-label={`Download ${f.name}`}
                      >
                        <Download size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
