"use client";

import { useEffect, useMemo, useState } from "react";
import { Pin, Heart, MessageSquare, Plus, X, Pencil, Trash2 } from "lucide-react";
import PortalShell from "@/components/portal/PortalShell";
import { useAuth } from "@/context/AuthContext";
import { getInitials } from "@/data/members";
import { canAccessVisibility, isEboardOrAdmin, portalRole, visibilityLabel, type Visibility } from "@/lib/access";
import { relativeTime } from "@/lib/date";
import { sendPushToChapter } from "@/lib/push";
import {
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  type Announcement,
  type NewAnnouncement,
} from "@/lib/announcements";

export default function AnnouncementsPage() {
  return (
    <PortalShell>
      <Announcements />
    </PortalShell>
  );
}

function Announcements() {
  const { user } = useAuth();
  const role = portalRole(user);
  const isBoard = isEboardOrAdmin(role);

  const [posts, setPosts] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [showComposer, setShowComposer] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) =>
    setLikes((prev) => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await listAnnouncements();
        if (active) setPosts(rows);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Could not load announcements.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const sorted = useMemo(
    () =>
      posts
        .filter((post) => canAccessVisibility(post.visibility, role))
        .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned)),
    [posts, role]
  );

  async function handleCreate(input: NewAnnouncement) {
    setError(null);
    try {
      await createAnnouncement(input, user?.name);
      setShowComposer(false);
      setReloadKey((k) => k + 1);
      void sendPushToChapter({
        title: input.title,
        body: input.body,
        url: "/portal/announcements/",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not publish the announcement.");
    }
  }

  async function handleUpdate(id: string, input: NewAnnouncement) {
    setError(null);
    try {
      await updateAnnouncement(id, input);
      setEditing(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the announcement.");
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await deleteAnnouncement(id);
      setConfirmDeleteId(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the announcement.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Announcements</h1>
          <p className="mt-1 text-sm text-muted">
            The latest from the chapter board.
          </p>
        </div>
        {isBoard && (
          <button
            onClick={() => {
              setEditing(null);
              setShowComposer(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy/90"
          >
            <Plus size={15} /> Add announcement
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-scarlet/30 bg-scarlet/5 px-4 py-3 text-sm text-scarlet">
          {error}
        </div>
      )}

      {showComposer && !editing && (
        <AnnouncementComposer
          onClose={() => setShowComposer(false)}
          onSubmit={handleCreate}
        />
      )}

      {loading ? (
        <p className="mt-8 text-sm text-muted">Loading announcements...</p>
      ) : sorted.length === 0 ? (
        <p className="mt-8 text-sm text-muted">No announcements yet.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {sorted.map((post) => {
            const liked = likes[post.id];
            const isEditingThis = editing?.id === post.id;

            if (isEditingThis) {
              return (
                <AnnouncementComposer
                  key={post.id}
                  initial={post}
                  onClose={() => setEditing(null)}
                  onSubmit={(input) => handleUpdate(post.id, input)}
                />
              );
            }

            return (
              <article
                key={post.id}
                className={`rounded-xl border bg-white p-5 ${
                  post.pinned ? "border-gold/50" : "border-line"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {post.pinned && (
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#a97f2f]">
                        <Pin size={11} /> Pinned
                      </div>
                    )}
                    {isBoard && (
                      <span className="inline-flex rounded-full bg-navy/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-navy">
                        {visibilityLabel(post.visibility)}
                      </span>
                    )}
                  </div>
                  {isBoard && (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => {
                          setShowComposer(false);
                          setEditing(post);
                        }}
                        className="rounded-lg p-1.5 text-muted hover:bg-slate-100 hover:text-navy"
                        aria-label="Edit announcement"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(post.id)}
                        className="rounded-lg p-1.5 text-muted hover:bg-scarlet/10 hover:text-scarlet"
                        aria-label="Delete announcement"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>

                <h2 className="mt-2 text-lg font-bold text-ink">{post.title}</h2>

                <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-navy text-[10px] font-bold text-white">
                    {getInitials(post.authorName)}
                  </span>
                  {post.authorName} · {relativeTime(post.createdAt)}
                </div>

                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink/80">
                  {post.body}
                </p>

                {confirmDeleteId === post.id && (
                  <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-scarlet/30 bg-scarlet/5 px-3 py-2.5 text-sm">
                    <span className="text-scarlet">Delete this announcement?</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={busyId === post.id}
                        className="rounded-full bg-scarlet px-3 py-1.5 text-xs font-semibold text-white hover:bg-scarlet/90 disabled:opacity-60"
                      >
                        {busyId === post.id ? "Deleting..." : "Delete"}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:text-navy"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-4 border-t border-line pt-3 text-sm">
                  <button
                    onClick={() => toggle(post.id)}
                    className={`inline-flex items-center gap-1.5 transition-colors ${
                      liked ? "text-scarlet" : "text-muted hover:text-scarlet"
                    }`}
                  >
                    <Heart size={16} fill={liked ? "currentColor" : "none"} />
                    {post.likes + (liked ? 1 : 0)}
                  </button>
                  <button className="inline-flex items-center gap-1.5 text-muted hover:text-navy">
                    <MessageSquare size={16} /> {post.comments}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AnnouncementComposer({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: Announcement;
  onClose: () => void;
  onSubmit: (input: NewAnnouncement) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [visibility, setVisibility] = useState<Visibility>(initial?.visibility ?? "members");
  const [pinned, setPinned] = useState(initial?.pinned ?? false);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(initial);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    await onSubmit({ title: title.trim(), body: body.trim(), visibility, pinned });
    setSubmitting(false);
  }

  return (
    <form
      onSubmit={submit}
      className="mt-6 rounded-2xl border border-gold/30 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-ink">
            {isEdit ? "Edit announcement" : "Create announcement"}
          </h2>
          <p className="text-xs text-muted">
            Visible to the members you select below.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-muted hover:bg-slate-100"
          aria-label="Close composer"
        >
          <X size={17} />
        </button>
      </div>
      <div className="mt-4 grid gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Announcement title"
          className="rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-blue"
        />
        <textarea
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write the update..."
          className="rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-blue"
        />
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as Visibility)}
            className="rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-blue"
          >
            <option value="members">All members</option>
            <option value="active">Active only</option>
            <option value="pledge">Pledge only</option>
            <option value="eboard">E-Board only</option>
          </select>
          <label className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
            />
            Pin post
          </label>
        </div>
      </div>
      <button
        disabled={submitting}
        className="mt-4 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-60"
      >
        {submitting
          ? "Saving..."
          : isEdit
            ? "Save changes"
            : "Publish announcement"}
      </button>
    </form>
  );
}
