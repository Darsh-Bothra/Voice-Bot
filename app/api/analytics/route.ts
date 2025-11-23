// app/api/analytics/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !body.name) return NextResponse.json({ error: 'Missing name' }, { status: 400 });
  const { name, value = 1, metadata } = body as { name: string; value?: number; metadata?: any };
  const rec = await prisma.metric.create({ data: { name, value: Number(value), metadata: metadata ? JSON.stringify(metadata) : null } });
  return NextResponse.json({ ok: true, rec });
}
