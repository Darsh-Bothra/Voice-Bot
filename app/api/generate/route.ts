// app/api/generate/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

function safeLog(...args: any[]) {
  if (process.env.NODE_ENV !== 'production') console.log('[api/generate]', ...args);
}
function parseHFResponse(data: any): string {
  if (!data) return '';
  if (typeof data === 'string') return data;
  if (Array.isArray(data)) {
    const first = data[0];
    return (first?.generated_text ?? first?.text ?? JSON.stringify(first ?? data)).toString();
  }
  return (data.generated_text ?? data.text ?? JSON.stringify(data)).toString();
}

async function callHuggingFace(model: string, prompt: string, key: string | undefined) {
  if (!key) throw new Error('HF key missing');
  const url = `https://api-inference.huggingface.co/models/${model}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: Number(process.env.GENERATE_MAX_TOKENS ?? 256),
        temperature: Number(process.env.GENERATE_TEMPERATURE ?? 0.7)
      }
    })
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`HF ${resp.status}: ${text}`);
  try { return JSON.parse(text); } catch { return text; }
}

async function callOpenRouter(model: string, prompt: string, key: string) {
  const url = 'https://api.openrouter.ai/v1/chat/completions';
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: 'You are a helpful assistant. Answer concisely.' }, { role: 'user', content: prompt }],
      max_tokens: Number(process.env.GENERATE_MAX_TOKENS ?? 256),
      temperature: Number(process.env.GENERATE_TEMPERATURE ?? 0.7)
    })
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`OpenRouter ${resp.status}: ${text}`);
  try { return JSON.parse(text); } catch { return text; }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Missing JSON body' }, { status: 400 });

    const prompt = (body.prompt ?? body.question ?? body.text) as string | undefined;
    const fileUrl = (body.fileUrl ?? '/mnt/data/Software Engineer - Assignment - 2.pdf') as string | undefined;
    if (!prompt) return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });

    const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY?.trim();
    const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? 'deepseek/deepseek-chat-v3-0324:free'; // example free model
    const HF_API_KEY = process.env.HF_API_KEY?.trim();
    const HF_MODEL = process.env.HF_TEXT_MODEL ?? 'google/flan-t5-small';

    // Try OpenRouter first if configured
    if (OPENROUTER_KEY) {
      safeLog('Attempting OpenRouter model:', OPENROUTER_MODEL);
      try {
        const orResp = await callOpenRouter(OPENROUTER_MODEL, prompt, OPENROUTER_KEY);
        // OpenRouter common shape: { choices: [{ message: { content } }] }
        const content = orResp?.choices?.[0]?.message?.content ?? orResp?.choices?.[0]?.text ?? (typeof orResp === 'string' ? orResp : JSON.stringify(orResp));
        return NextResponse.json({ text: String(content), provider: 'openrouter', fileUrl });
      } catch (err: any) {
        safeLog('OpenRouter failed:', err?.message ?? String(err).slice(0, 400));
        // fallthrough to Hugging Face
      }
    }

    // Then try Hugging Face with configured model
    if (HF_API_KEY) {
      safeLog('Calling HF model:', HF_MODEL);
      try {
        const hfParsed = await callHuggingFace(HF_MODEL, prompt, HF_API_KEY);
        const answer = parseHFResponse(hfParsed);
        return NextResponse.json({ text: answer, provider: 'huggingface', model: HF_MODEL, fileUrl });
      } catch (err) {
        safeLog('Primary HF call failed:', String(err).slice(0, 800));
        // Retry with gpt2 as a fallback model if it wasn't the primary
        if (HF_MODEL !== 'gpt2') {
          safeLog('Retrying with gpt2 fallback model.');
          try {
            const hfParsed2 = await callHuggingFace('gpt2', prompt, HF_API_KEY);
            const answer2 = parseHFResponse(hfParsed2);
            return NextResponse.json({ text: answer2, provider: 'huggingface', model: 'gpt2', fileUrl });
          } catch (err2) {
            safeLog('gpt2 retry failed:', String(err2).slice(0, 800));
            // continue to final fallback
          }
        }
        // if we reach here HF failed
        return NextResponse.json({ error: 'Upstream model error (Hugging Face)', details: String(err).slice(0, 1000) }, { status: 502 });
      }
    }

    // No provider configured: local fallback so the UI still works
    safeLog('No LLM provider keys found — returning local fallback.');
    const fallback = `Fallback reply: I heard "${prompt.slice(0, 200)}". (No external model configured.)`;
    return NextResponse.json({ text: fallback, provider: 'fallback', fileUrl });
  } catch (err) {
    safeLog('Unhandled error in generate route:', String(err));
    return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 });
  }
}
