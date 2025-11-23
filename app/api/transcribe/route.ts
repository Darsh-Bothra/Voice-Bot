// app/api/transcribe/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function base64ToUint8Array(base64: string) {
  return Uint8Array.from(Buffer.from(base64, 'base64'));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

    const { audio, mime } = body as { audio?: string; mime?: string };
    if (!audio || !mime) return NextResponse.json({ error: 'Missing audio or mime' }, { status: 400 });

    const HF_API_KEY = process.env.HF_API_KEY?.trim();
    const hfModel = process.env.HF_STT_MODEL || 'openai/whisper-large';

    // If HF key missing, return a tiny fallback so voice demos still work.
    if (!HF_API_KEY) {
      // Fallback: naive silence -> "I didn't catch that" or echo placeholder
      return NextResponse.json({ transcript: 'fallback: transcribed speech (HF_API_KEY not configured). Try typing or set HF_API_KEY.' });
    }

    const bytes = base64ToUint8Array(audio);
    const r = await fetch(`https://api-inference.huggingface.co/models/${hfModel}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        'Content-Type': mime
      },
      body: bytes
    });

    const text = await r.text();
    if (!r.ok) {
      // upstream error: pass details (trimmed) to client for debugging
      return NextResponse.json({ error: 'STT upstream error', details: text?.slice(0, 1000) }, { status: 502 });
    }

    // hf STT often returns { text: "..." }
    let parsed: any;
    try { parsed = JSON.parse(text); } catch { parsed = text; }
    const transcript = (typeof parsed === 'string' ? parsed : parsed?.text ?? JSON.stringify(parsed)) as string;
    return NextResponse.json({ transcript });
  } catch (err) {
    console.error('transcribe error', err);
    return NextResponse.json({ error: 'Internal transcribe error', details: String(err) }, { status: 500 });
  }
}
