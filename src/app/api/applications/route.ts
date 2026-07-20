import { NextResponse } from "next/server";

/**
 * Mock application intake endpoint.
 *
 * Scaffolded for a real backend: swap the in-memory store for a DB insert
 * (e.g. Supabase / Prisma) with columns matching `Application` plus a
 * server-generated `id`, `status` ("pending" | "interview" | "accepted" |
 * "rejected"), `createdAt`, and admin `notes`. The resume file would be
 * uploaded to object storage (Supabase Storage / S3) and referenced by URL.
 */

interface Application {
  fullName: string;
  email: string;
  phone: string;
  gradYear: string;
  major: string;
  minor?: string;
  gpa: string;
  why: string;
  linkedin?: string;
  heardFrom: string;
  resumeName?: string;
}

// Ephemeral in-memory store (resets on server restart) — placeholder for a DB.
const submissions: (Application & {
  id: string;
  status: string;
  createdAt: string;
})[] = [];

function isRutgersEmail(email: string) {
  return /^[^@\s]+@rutgers\.edu$/i.test(email.trim());
}

export async function POST(request: Request) {
  let body: Partial<Application>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const required: (keyof Application)[] = [
    "fullName",
    "email",
    "phone",
    "gradYear",
    "major",
    "gpa",
    "why",
    "heardFrom",
  ];
  const missing = required.filter((k) => !body[k]);
  if (missing.length) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  if (!isRutgersEmail(body.email!)) {
    return NextResponse.json(
      { error: "A valid @rutgers.edu email is required." },
      { status: 422 }
    );
  }

  const gpa = Number(body.gpa);
  if (Number.isNaN(gpa) || gpa < 0 || gpa > 4) {
    return NextResponse.json(
      { error: "GPA must be between 0.0 and 4.0." },
      { status: 422 }
    );
  }

  const record = {
    ...(body as Application),
    id: crypto.randomUUID(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  submissions.push(record);

  return NextResponse.json(
    { ok: true, id: record.id, message: "Application received." },
    { status: 201 }
  );
}
