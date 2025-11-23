// app/page.tsx
'use client';
import React, { useState } from 'react';
import Recorder from './components/recorder';

type Msg = { role: 'user' | 'bot'; text: string };

export default function Page() {
  const [history, setHistory] = useState<Msg[]>([]);

  function add(user: string, bot: string) {
    setHistory((h) => [...h, { role: 'user', text: user }, { role: 'bot', text: bot }]);
  }

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h1>Voice Chatbot</h1>
      <p style={{ color: '#666' }}>Press record, speak your question, and the bot will reply aloud.</p>

      <div style={{ marginTop: 18 }}>
        <Recorder onReply={(user, bot) => add(user, bot)} />
      </div>

      <section style={{ marginTop: 24 }}>
        <h3>Conversation</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.length === 0 && <div style={{ color: '#888' }}>No messages yet — record to start.</div>}
          {history.map((m, i) => (
            <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              <div style={{ background: m.role === 'user' ? '#2563eb' : '#f3f4f6', color: m.role === 'user' ? 'white':'black', padding:10, borderRadius:10 }}>
                {m.text}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
