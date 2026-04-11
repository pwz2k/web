import { NextResponse } from 'next/server';

/** No DB/auth — use to verify nginx → Node (curl https://your-domain/api/health). */
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ ok: true, ts: new Date().toISOString() });
}
