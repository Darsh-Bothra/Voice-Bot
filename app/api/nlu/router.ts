// app/api/nlu/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Simple rule-based intent matcher
function ruleBasedParse(text: string) {
  const t = text.toLowerCase();
  if (t.includes('balance') || t.includes('account')) return { intent: 'get_account', entities: {} };
  if (t.includes('help') || t.includes('support')) return { intent: 'support', entities: {} };
  if (t.includes('faq') || t.includes('rules')) return { intent: 'faq', entities: {} };
  return null; // fallback
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const { text } = body as { text?: string };
  if (!text) return NextResponse.json({ error: 'Missing text' }, { status: 400 });

  const rule = ruleBasedParse(text);
  if (rule) return NextResponse.json({ nlu: rule });

  // fallback: call HF zero-shot-classification or a small classifier
  const HF_API_KEY = process.env.HF_API_KEY;
  const model = process.env.HF_NLU_MODEL || 'facebook/bart-large-mnli';

  if (!HF_API_KEY) return NextResponse.json({ error: 'HF_API_KEY not configured' }, { status: 500 });

  const candidate_labels = ['get_account', 'support', 'faq', 'smalltalk', 'other'];
  const r = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${HF_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: text, parameters: { candidate_labels } })
  });

  if (!r.ok) {
    const txt = await r.text();
    return NextResponse.json({ error: 'NLU model error', details: txt }, { status: 500 });
  }

  const data = await r.json();
  // HF zero-shot returns a structure with labels and scores
  const label = (data as any)?.labels?.[0] ?? (Array.isArray(data) ? data[0] : null);
  return NextResponse.json({ nlu: { intent: label, entities: {} }, raw: data });
}
