# 🎤 VoiceBot — AI Voice Assistant (Next.js + OpenRouter + Whisper)

VoiceBot is a **voice-driven AI assistant** built with **Next.js (App Router)**.  
It allows users to speak naturally, converts voice → text, generates intelligent responses using an LLM, and speaks them back using browser TTS.

💬 Fully voice-based — **no document ingestion**  
🔓 Uses **free or open** models (Whisper + OpenRouter)  
⚡ End-to-end Next.js architecture  

---

## 🚀 Features

### 🎙 Voice Recording  
- Browser-native `MediaRecorder`
- Captures microphone audio and sends it to the server

### 📝 Speech-to-Text (STT)  
- Whisper STT via Hugging Face Inference API  
- Automatic fallbacks when no API key is set

### 🤖 AI Response (LLM)  
- Powered by **OpenRouter** (supports free-tier models)  
- Default recommended model: `Qwen/Qwen2.5-1.5B-Instruct`  
- Automatic fallback responses prevent crashes

### 🔊 Text-to-Speech  
- Uses browser `speechSynthesis` (free, no API needed)

### 💬 Chat UI  
- Message bubbles  
- Timestamp display  
- Replay message (TTS)  
- Copy message  
- Clear chat  
- Optional metadata like file paths (for developer testing)

---

## 🏛 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| STT | Whisper via Hugging Face |
| LLM | OpenRouter |
| TTS | Web Speech API |
| UI | React Client Components |

---

## 📁 Project Structure
```
app/
  api/
    transcribe/route.ts      # Whisper STT endpoint
    generate/route.ts        # LLM generation using OpenRouter
  components/
    Recorder.client.tsx      # Handles audio recording and STT/LLM calls
    ChatHistory.client.tsx   # Displays chat messages and UI actions
  page.tsx                   # Main chat interface
public/
README.md
.env
package.json
```


---

# 🧩 How VoiceBot Works
User Speaks 🎤
→ Audio captured via MediaRecorder
→ Sent to /api/transcribe
→ Whisper converts audio → text
→ Text sent to /api/generate
→ OpenRouter model generates reply
→ Browser speaks reply (speechSynthesis) 🔊
→ Chat UI displays messages


---
# ⚙️ Installation & Setup

## 1️⃣ Clone repository

```bash
git clone <your-repo-url>
cd voicebot


---

# Whisper STT (optional)
HF_API_KEY=your_hf_key
HF_STT_MODEL=openai/whisper-large

# LLM (recommended)
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=Qwen/Qwen2.5-1.5B-Instruct

# API base
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Model tuning
GENERATE_TEMPERATURE=0.7
GENERATE_MAX_TOKENS=256
