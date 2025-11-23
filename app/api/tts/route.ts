// app/api/tts/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  const { text } = body as { text?: string };
  if (!text) return NextResponse.json({ error: 'Missing text' }, { status: 400 });
  // Placeholder — return text and let the browser speak it via speechSynthesis
  return NextResponse.json({ text });
}
