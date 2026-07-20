"use client";

import { useMemo, useState } from "react";
import { Pin, Heart, MessageSquare, Plus, X } from "lucide-react";
import PortalShell from "@/components/portal/PortalShell";
import { useAuth } from "@/context/AuthContext";
import { getInitials } from "@/data/members";
import { canAccessVisibility, isEboardOrAdmin, portalRole, visibilityLabel, type Visibility } from "@/lib/access";

interface Post {
  id: string;
  title: string;
  body: string;
  author: string;
  posted: string;
  pinned?: boolean;
  likes: number;
  comments: number;
  visibility: Visibility;
}

const POSTS: Post[] = [
  {
    id: "p1",
    title: "Spring '27 Recruitment Kicks Off Monday",
    body: "Our first info session is this Monday at 6PM in the Business School, Room 1140. Please share the flyer with anyone who might be interested and show up to represent the chapter. Let's make this our biggest rush class yet!",
    author: "Sofia Romano",
    posted: "2 hours ago",
    pinned: true,
    likes: 24,
    comments: 6,
    visibility: "members",
  },
  {
    id: "p2",
    title: "Resume Workshop — Bring a Printed Copy",
    body: "Reminder that Wednesday's alumni resume workshop is hands-on. Bring a printed copy of your resume (or two) so our alumni mentors can mark it up with you directly.",
    author: "Marcus Lee",
    posted: "Yesterday",
    likes: 18,
    comments: 3,
    visibility: "members",
  },
  {
    id: "p3",
    title: "Dues Deadline Extended to July 31",
    body: "We've extended the semester dues deadline to July 31. If you're running into any issues, reach out to me directly and we'll sort it out. Thanks all.",
    author: "Ethan Cohen",
    posted: "3 days ago",
    likes: 31,
    comments: 9,
    visibility: "active",
  },
  {
    id: "p4",
    title: "Pledge Cohort Checkpoint",
    body: "Pledges: your next checkpoint is posted in documents. Please review the interview prep guide before the values workshop.",
    author: "Sofia Romano",
    posted: "Today",
    likes: 12,
    comments: 2,
    visibility: "pledge",
  },
  {
    id: "p5",
    title: "Board Coverage for Rush Interviews",
    body: "E-board: update your availability before Friday so we can finalize interview rooms, attendance owners, and evaluator pairings.",
    author: "Ava Thompson",
    posted: "1 hour ago",
    likes: 7,
    comments: 4,
    visibility: "eboard",
  },
];

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
  const [posts, setPosts] = useState<Post[]>(POSTS);
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [showComposer, setShowComposer] = useState(false);
  const toggle = (id: string) =>
    setLikes((prev) => ({ ...prev, [id]: !prev[id] }));

  const sorted = useMemo(
    () =>
      posts
        .filter((post) => canAccessVisibility(post.visibility, role))
        .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned)),
    [posts, role]
  );

  function addPost(post: Pick<Post, "title" | "body" | "visibility" | "pinned">) {
    setPosts((current) => [
      {
        id: `local-${Date.now()}`,
        title: post.title,
        body: post.body,
        author: user?.name ?? "Admin",
        posted: "Just now",
        pinned: post.pinned,
        likes: 0,
        comments: 0,
        visibility: post.visibility,
      },
      ...current,
    ]);
    setShowComposer(false);
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
            onClick={() => setShowComposer(true)}
            className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy/90"
          >
            <Plus size={15} /> Add announcement
          </button>
        )}
      </div>

      {showComposer && (
        <AnnouncementComposer
          onClose={() => setShowComposer(false)}
          onCreate={addPost}
        />
      )}

      <div className="mt-6 space-y-4">
        {sorted.map((post) => {
          const liked = likes[post.id];
          return (
            <article
              key={post.id}
              className={`rounded-xl border bg-white p-5 ${
                post.pinned ? "border-gold/50" : "border-line"
              }`}
            >
              {post.pinned && (
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#a97f2f]">
                  <Pin size={11} /> Pinned
                </div>
              )}
              {isBoard && (
                <span className="mb-2 ml-2 inline-flex rounded-full bg-navy/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-navy">
                  {visibilityLabel(post.visibility)}
                </span>
              )}
              <h2 className="text-lg font-bold text-ink">{post.title}</h2>

              <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-navy text-[10px] font-bold text-white">
                  {getInitials(post.author)}
                </span>
                {post.author} · {post.posted}
              </div>

              <p className="mt-3 text-sm leading-relaxed text-ink/80">
                {post.body}
              </p>

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
    </div>
  );
}

function AnnouncementComposer({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (post: Pick<Post, "title" | "body" | "visibility" | "pinned">) => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("members");
  const [pinned, setPinned] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    onCreate({ title: title.trim(), body: body.trim(), visibility, pinned });
    setTitle("");
    setBody("");
  }

  return (
    <form
      onSubmit={submit}
      className="mt-6 rounded-2xl border border-gold/30 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-ink">Create announcement</h2>
          <p className="text-xs text-muted">
            Mock write flow — ready to connect to POST /api/announcements.
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
      <button className="mt-4 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy/90">
        Publish announcement
      </button>
    </form>
  );
}
