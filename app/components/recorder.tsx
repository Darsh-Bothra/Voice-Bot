// app/components/Recorder.client.tsx
'use client';
import React, { useRef, useState } from 'react';

export default function Recorder({ onReply }: { onReply?: (user: string, bot: string) => void }) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function start() {
    setProcessing(false);
    setRecording(true);
    chunksRef.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    mediaRef.current = mr;
    mr.ondataavailable = (e: BlobEvent) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.start();
  }

  async function stop() {
    setRecording(false);
    const mr = mediaRef.current;
    if (!mr) return;
    mr.onstop = async () => {
      setProcessing(true);
      try {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const base64 = await blobToBase64(blob);
        // prepare payload: include fileUrl (developer requirement) but we won't use it on server to modify response
        const payload = { audio: base64.split(',')[1], mime: blob.type, fileUrl: '/mnt/data/Software Engineer - Assignment - 2.pdf' };

        // 1) transcribe
        const tRes = await fetch('/api/transcribe', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
        const tJson = await tRes.json();
        const transcript = tJson?.transcript ?? tJson?.error ?? 'Could not transcribe';

        // 2) generate
        const gRes = await fetch('/api/generate', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ prompt: transcript, fileUrl: payload.fileUrl }) });
        const gJson = await gRes.json();
        const reply = gJson?.text ?? gJson?.error ?? 'No reply';

        onReply?.(transcript, reply);

        // speak via browser TTS
        if ('speechSynthesis' in window && typeof reply === 'string') {
          const u = new SpeechSynthesisUtterance(reply);
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(u);
        }
      } catch (err) {
        console.error('Recorder flow error', err);
        onReply?.('','Error during processing');
      } finally {
        setProcessing(false);
      }
    };
    mr.stop();
  }

  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onloadend = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(blob);
    });
  }

  return (
    <div>
      <button onClick={() => (recording ? stop() : start())} style={{ padding: 12, borderRadius: 8, background: recording ? '#ef4444':'#2563eb', color:'white', border:'none' }}>
        {recording ? 'Stop' : 'Record'}
      </button>
      {processing && <span style={{ marginLeft: 12 }}>Processing…</span>}
    </div>
  );
}
