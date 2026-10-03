import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Modality, GenerateVideosOperation } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Helper to get GoogleGenAI client with user-provided key.
// STRICT BYOK ENFORCEMENT: Server API key is completely cut off.
function getGeminiClient(customKey?: string): GoogleGenAI {
  const userKey = (customKey && typeof customKey === "string" ? customKey.trim() : "");
  if (!userKey || userKey.length < 8) {
    const error: any = new Error("User Gemini API key required. Please configure your personal Gemini API key in Settings.");
    error.status = 401;
    error.code = "USER_KEY_REQUIRED";
    throw error;
  }
  return new GoogleGenAI({
    apiKey: userKey,
    httpOptions: {
      headers: {
        "User-Agent": "creatordeck-app",
      },
    },
  });
}

// Fast In-Memory Audio Cache (prevents duplicate API calls & preserves rate limits)
const audioCache = new Map<string, Buffer>();
const MAX_CACHE_SIZE = 100;

function getCacheKey(text: string, voice: string, speed: number, whisper: boolean): string {
  return `${voice}_${speed}_${whisper ? "w" : "n"}_${text.trim()}`;
}

// Convert 16-bit linear PCM little-endian buffer (24000Hz, mono) into a valid RIFF WAV Buffer
function pcm16ToWavBuffer(pcmBuffer: Buffer, sampleRate: number = 24000): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// Applies gentle, intimate proximity roll-off for [quietly] and [whispers] tags
// Smooth single-pole lowpass at ~3.5kHz without ANY artificial noise or high-pitch artifacts
function applyWhisperAcoustics(pcmBuffer: Buffer): Buffer {
  const sampleCount = Math.floor(pcmBuffer.length / 2);
  const output = Buffer.alloc(pcmBuffer.length);

  let filterState = 0;
  const alpha = 0.35; // gentle warmth roll-off above 3.5kHz

  for (let i = 0; i < sampleCount; i++) {
    const rawVal = pcmBuffer.readInt16LE(i * 2);
    // Smooth low-pass
    filterState = filterState + alpha * (rawVal - filterState);
    // Intimate level (-4.5dB)
    const processed = Math.round(filterState * 0.6);
    const clamped = Math.max(-32768, Math.min(32767, processed));
    output.writeInt16LE(clamped, i * 2);
  }

  return output;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    engine: "google-gemini",
    models: ["gemini-3.1-flash-tts-preview", "gemini-2.5-flash-preview-tts"],
    authMode: "byok_mandatory",
    serverApiKeyUsed: false,
  });
});

// Download full project source as ZIP
app.get("/api/download-zip", async (req, res) => {
  try {
    const { exec } = await import("child_process");
    const fs = await import("fs");
    const zipPath = "/tmp/creatordeck-project.zip";
    
    // Package project files excluding dependencies, dist, and cache
    const script = `
import zipfile, os
exclude = {'node_modules', '.git', 'dist', '.vite', '.cache'}
with zipfile.ZipFile('${zipPath}', 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in exclude and not d.startswith('.')]
        for f in files:
            if f.endswith('.zip') or f.endswith('.tar.gz') or f == 'creatordeck-project.zip':
                continue
            p = os.path.join(root, f)
            arcname = os.path.relpath(p, '.')
            z.write(p, arcname)
`;
    exec(`python3 -c "${script.replace(/"/g, '\\"')}"`, (err) => {
      if (err) {
        console.error("Zip generation error:", err);
        return res.status(500).json({ error: "Failed to create project ZIP" });
      }
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", 'attachment; filename="creatordeck-project.zip"');
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    });
  } catch (error: any) {
    console.error("Zip endpoint error:", error);
    res.status(500).json({ error: "Server error generating zip" });
  }
});

// Models priority lists and dynamic discovery (Strictly modern non-deprecated models)
const RECOMMENDED_TEXT_MODELS = [
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-3.8-flash",
  "gemini-3.1-flash-lite",
];

// Helper to list available models for client key with fallback
async function getAvailableGeminiModels(client: GoogleGenAI): Promise<string[]> {
  try {
    const listRes = await client.models.list();
    const modelNames: string[] = [];
    if (listRes) {
      // Async iterable or array
      for await (const m of listRes as any) {
        const name = (m.name || "").replace(/^models\//, "");
        if (
          name &&
          !name.includes("1.5") &&
          !name.includes("2.0") &&
          (name.includes("flash") || name.includes("gemini-2.5") || name.includes("gemini-3"))
        ) {
          modelNames.push(name);
        }
      }
    }
    if (modelNames.length > 0) return modelNames;
  } catch (err) {
    console.warn("[Gemini Models] Failed to list models dynamically, using recommended list:", err);
  }
  return RECOMMENDED_TEXT_MODELS;
}

// Resilient generateContent with exponential backoff & model waterfall
async function generateContentWithFallback(
  client: GoogleGenAI,
  reqConfig: {
    contents: any;
    systemInstruction?: string;
    tools?: any[];
    temperature?: number;
  },
  priorityModels: string[] = RECOMMENDED_TEXT_MODELS
): Promise<{ text: string; modelUsed: string; searchQueries?: string[] }> {
  let lastError: any = null;
  const models = [...priorityModels, ...RECOMMENDED_TEXT_MODELS.filter((m) => !priorityModels.includes(m))];

  for (const model of models) {
    // Up to 2 retries per model for transient 503 or 429 backoff
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const configPayload: any = {};
        if (reqConfig.systemInstruction) configPayload.systemInstruction = reqConfig.systemInstruction;
        if (reqConfig.temperature !== undefined) configPayload.temperature = reqConfig.temperature;
        if (reqConfig.tools && reqConfig.tools.length > 0) configPayload.tools = reqConfig.tools;

        const response = await client.models.generateContent({
          model,
          contents: reqConfig.contents,
          config: Object.keys(configPayload).length > 0 ? configPayload : undefined,
        });

        const text = response.text?.trim();
        if (text) {
          const searchChunks = (response as any).candidates?.[0]?.groundingMetadata?.webSearchQueries;
          return {
            text,
            modelUsed: model,
            searchQueries: Array.isArray(searchChunks) ? searchChunks : undefined,
          };
        }
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err);
        const isQuotaOrOverload = msg.includes("429") || msg.includes("503") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota") || msg.includes("Overloaded");
        
        if (isQuotaOrOverload && attempt === 0) {
          // Jittered backoff before retry
          await new Promise((resolve) => setTimeout(resolve, 1200 + Math.random() * 800));
          continue;
        }
        // If not recoverable on this model, break to try next model in waterfall
        break;
      }
    }
  }

  throw lastError || new Error("All Gemini model endpoints were unable to fulfill the request.");
}

// Real-time Gemini API ping, model list, and authentication verification
app.post("/api/gemini/ping", async (req, res) => {
  const startTime = Date.now();
  const customKey = (req.headers["x-gemini-api-key"] as string) || req.body?.apiKey;

  if (!customKey || customKey.trim().length < 8) {
    return res.status(401).json({
      status: "key_required",
      latencyMs: 0,
      error: "No Gemini API key provided. Please enter your personal API key in Settings.",
      keySource: "none",
    });
  }

  try {
    const client = getGeminiClient(customKey);
    let detectedModel = "gemini-2.5-flash";
    let availableModels: string[] = [];

    // Verify key with dynamic model listing
    try {
      availableModels = await getAvailableGeminiModels(client);
      if (availableModels.length > 0) {
        detectedModel = availableModels[0];
      }
    } catch {
      // fallback
    }

    // Quick verification across supported modern models
    const verificationCandidates = [
      detectedModel,
      "gemini-2.5-flash",
      "gemini-flash-latest",
      "gemini-3.8-flash",
      "gemini-3.1-flash-lite",
    ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i);

    let pingSuccess = false;
    let lastPingErr: any = null;

    for (const testModel of verificationCandidates) {
      try {
        await client.models.countTokens({
          model: testModel,
          contents: "ping",
        });
        detectedModel = testModel;
        pingSuccess = true;
        break;
      } catch (countErr: any) {
        lastPingErr = countErr;
      }
    }

    if (!pingSuccess && lastPingErr) {
      throw lastPingErr;
    }

    const latency = Date.now() - startTime;
    const activeKey = customKey.trim();
    const masked = activeKey.length > 8 ? activeKey.slice(0, 6) + "..." + activeKey.slice(-4) : "Custom Key";

    return res.json({
      status: "authenticated",
      latencyMs: latency,
      keySource: "custom",
      keyMasked: masked,
      activeModel: detectedModel,
      availableModels: availableModels.slice(0, 10),
    });
  } catch (err: any) {
    const latency = Date.now() - startTime;
    const msg = err?.message || String(err);
    const isAuth = msg.includes("API key") || msg.includes("401") || msg.includes("403") || msg.includes("UNAUTHENTICATED") || msg.includes("PERMISSION_DENIED");
    const isQuota = msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED");

    return res.status(isAuth ? 401 : isQuota ? 429 : 500).json({
      status: isAuth ? "auth_error" : isQuota ? "quota_exceeded" : "error",
      latencyMs: latency,
      error: msg,
      keySource: "custom",
    });
  }
});

// Human-Grade AI Script Writer for Google TTS Standard
app.post("/api/scripts/generate", async (req, res) => {
  try {
    const {
      topic,
      tone = "conversational",
      durationTarget = "medium",
      includeTags = true,
      humanImperfections = true,
    } = req.body;

    const customKey = (req.headers["x-gemini-api-key"] as string) || req.body?.apiKey;

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return res.status(400).json({ error: "Please enter a topic or concept for your script." });
    }

    const client = getGeminiClient(customKey);

    const lengthGuide = durationTarget === "short"
      ? "around 75 to 110 words (approx. 30 to 45 seconds read time)"
      : durationTarget === "long"
      ? "around 300 to 420 words (approx. 2 to 3 minutes read time)"
      : "around 150 to 220 words (approx. 60 to 90 seconds read time)";

    const systemInstruction = `You are a master voiceover scriptwriter creating realistic, compelling narration tailored specifically for Google Text-to-Speech (TTS) neural models.
The script must sound authentically HUMAN when spoken aloud by Google's voices (Charon, Kore, Puck, Fenrir, Zephyr, Aoede).

KEY HUMAN CONVERSATIONAL CHARACTERISTICS:
1. Speak to the listener directly, not like a dry essay or corporate PR.
2. Structure speech with dynamic rhythm: short punchy sentences interspersed with flowing thoughts.
3. Natural human speech has organic pauses, thoughtful beats when recalling memories, rhetorical questions, and occasional quiet or intimate disclosures.

SUPPORTED GOOGLE TTS VOICE TAGS:
Naturally embed these brackets tags where they enhance oral storytelling:
- [pause] : standard 0.8s breath or dramatic beat
- [long pause] : 1.2s suspenseful silence
- [whispers] : soft, intimate whispered tone for confessions, secrets, or fear
- [quietly] : calm, reflective, subdued tone
- [matter-of-fact] : grounded, dry, realistic statement
- [excited] : energetic or urgent delivery
- [dark] : eerie, grave, or suspenseful delivery
- [hesitates] : brief realistic hesitation beat (0.6s)
- [sighs] : subtle human breath or sigh

CRITICAL RESTRICTIONS:
- Return ONLY the script text itself.
- Do NOT output any headings, titles (e.g. "Title:"), meta-explanations, bullet points, or sign-offs.
- The output should be directly loadable into the script prompter for human review and recording.`;

    const prompt = `Topic / Story Concept: "${topic.trim()}"
Tone Archetype: ${tone}
Target Length: ${lengthGuide}
Embed Google Voice Tags: ${includeTags ? "Yes, embed natural [pause], [whispers], [dark], [sighs], [hesitates] tags organically" : "No, plain text only"}
Human Authenticity: ${humanImperfections ? "High. Use organic pauses, relatable spoken cadences, and realistic phrasing." : "Standard"}

Write the voiceover script now:`;

    const fallbackResult = await generateContentWithFallback(
      client,
      {
        contents: prompt,
        systemInstruction,
        temperature: 0.85,
      },
      ["gemini-2.5-flash", "gemini-flash-latest", "gemini-3.8-flash", "gemini-3.1-flash-lite"]
    );

    let generatedScript = fallbackResult.text;

    // Strip any accidental markdown code fences
    generatedScript = generatedScript.replace(/^```[a-z]*\n/i, "").replace(/\n```$/g, "").trim();

    const words = generatedScript.split(/\s+/).filter(Boolean).length;
    res.json({
      script: generatedScript,
      wordCount: words,
      estimatedSeconds: Math.round(words / 2.5),
    });
  } catch (err: any) {
    console.error("[Script Generation API Error]:", err);
    const status = err?.status || (err?.code === "USER_KEY_REQUIRED" ? 401 : 500);
    res.status(status).json({
      error: err?.message || "Script generation failed",
      code: err?.code,
    });
  }
});

// Conversational Script Director & YouTube Funnel Engine
app.post("/api/scripts/chat", async (req, res) => {
  try {
    const {
      messages = [],
      currentShortScript = "",
      currentLongScript = "",
      useSearch = false,
    } = req.body;

    const customKey = (req.headers["x-gemini-api-key"] as string) || req.body?.apiKey;
    const client = getGeminiClient(customKey);

    const systemInstruction = `You are an elite YouTube Creative Director, Story Architect, and Scriptwriter specializing in YouTube Shorts, Long-Form video narratives, and Google Neural TTS narration scripts.

YOUR MISSION:
Collaborate conversationally with the user to turn rough ideas, raw stories, Reddit posts, true crime cases, or creative prompts into high-performing voiceover scripts.
- Speak naturally, constructively, and concisely to the creator like a veteran Hollywood / YouTube creative director.
- Filter out fluff: When the user shares messy or rambling thoughts, extract only the gripping narrative beats for the actual voiceover script.
- Support TWO DISTINCT SCRIPT MODES according to creator's intent:

PART 1: SHORTS ONLY (e.g. 15s, 30s, 45s, 60s as requested)
- Speaking rate: ~145 words per minute (e.g., 30-sec short = ~70–75 words; 60-sec short = ~130–150 words).
- 0:00–0:03 Scroll-Stopper Hook: Starts in media res with the most shocking/captivating beat.
- High-Retention Narrative Beats: Fast pacing, dramatic setups, vivid word choices.
- Strong finish: Punchy twist, high-suspense cliffhanger, or engaging CTA.

PART 2: LONG-FORM ONLY (e.g. 2–3 minutes, 5 minutes, 8–10 minutes as requested)
- Speaking rate: ~145 words per minute (e.g., 2–3 min = ~300–450 words; 5 min = ~700 words; 8–10 min = ~1,200–1,500 words).
- If 8+ minutes (monetized): Structure with TWO strategic retention anchors:
  - Place [MID-ROLL AD RETENTION ANCHOR 1] around minute 3:45 to 4:00 with a mini-cliffhanger.
  - Place [MID-ROLL AD RETENTION ANCHOR 2] around minute 7:45 to 8:00 before the climactic resolution.
- If shorter (e.g., 2–3 minutes): Focus on tight pacing, clean story escalation, and emotional payoff without artificial ad breaks.
- Complete with satisfying conclusion, takeaway, or subscribe callout.

ANTI-COPYRIGHT & ORIGINALIZER PROTOCOL (CRITICAL):
- Protect the creator from YouTube Content ID claims, DMCA copyright strikes, and 'Reused Content' demonetization.
- Whenever working with user-provided stories, Reddit threads, news cases, or forum posts:
  1. NEVER copy phrases or sentences verbatim.
  2. AUTOMATICALLY alter, anonymize, or scramble personal names, private usernames, specific non-public addresses, and distinct identifiers to create original dramatized equivalents.
  3. Write 100% original cinematic voiceover prose from scratch while preserving the gripping mystery, suspense arc, and emotional payoff.

DYNAMIC INTENT HANDLING:
- If the user asks for ONLY Shorts (or asks for a 30s or 60s short), output ONLY the <<<SHORT_SCRIPT>>> block.
- If the user asks for ONLY Long-Form (e.g. a 2–3 min video), output ONLY the <<<LONG_SCRIPT>>> block.
- If the user provides a story without specifying, or asks for both, craft both synchronized scripts.

EMBED GOOGLE TTS DELIVERY TAGS:
Naturally embed bracketed stage direction tags for Google's neural voices:
- [pause] : standard breath / hesitation (0.8s)
- [long pause] : dramatic silence (1.5s)
- [whispers] : intimate, eerie or secretive delivery
- [quietly] : soft, reflective delivery
- [dark] : chilling, ominous or true-crime gravity
- [excited] : sudden surge of energy or urgency
- [sighs] : natural breath release
- [gasps] : sharp breath intake
- [hesitates] : authentic pause beat

OUTPUT FORMATTING PROTOCOL (CRITICAL):
Whenever generating or revising scripts, your message MUST cleanly package the voiceover copies in these exact designated blocks:
<<<SHORT_SCRIPT>>>
[Pure voiceover text for the short, with tags. NO Markdown bold/italics symbols (**), NO scene labels like 'Hook:'. Just the script.]
<<<END_SHORT_SCRIPT>>>

<<<LONG_SCRIPT>>>
[Pure voiceover text for the long-form video, with tags. NO Markdown bold/italics symbols (**), NO scene headers. Just the narration script.]
<<<END_LONG_SCRIPT>>>

Outside of these <<<SHORT_SCRIPT>>> and <<<LONG_SCRIPT>>> blocks, write your conversational reply to the creator (e.g. explaining creative choices, asking what they want to tweak next, answering questions, or discussing the story beats).`;

    // Format messages for Gemini API
    const contents: any[] = [];

    let contextNote = "";
    if (currentShortScript.trim() || currentLongScript.trim()) {
      contextNote = `Current active drafts in the canvas:\n`;
      if (currentShortScript.trim()) {
        contextNote += `CURRENT SHORT SCRIPT:\n${currentShortScript.trim()}\n\n`;
      }
      if (currentLongScript.trim()) {
        contextNote += `CURRENT LONG-FORM SCRIPT:\n${currentLongScript.trim().slice(0, 1000)}...\n\n`;
      }
    }

    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      const isLast = i === messages.length - 1;
      let text = m.text || "";
      if (isLast && m.role === "user" && contextNote) {
        text = `${contextNote}CREATOR MESSAGE:\n${text}`;
      }
      contents.push({
        role: m.role === "assistant" || m.role === "model" ? "model" : "user",
        parts: [{ text }],
      });
    }

    if (contents.length === 0) {
      return res.status(400).json({ error: "No messages provided." });
    }

    const modelsToTry = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    let aiResponseText = "";
    let lastErr: any = null;

    for (const m of modelsToTry) {
      try {
        const config: any = {
          systemInstruction,
          temperature: 0.75,
        };
        if (useSearch) {
          config.tools = [{ googleSearch: {} }];
        }
        const response = await client.models.generateContent({
          model: m,
          contents,
          config,
        });
        if (response.text && response.text.trim()) {
          aiResponseText = response.text.trim();
          break;
        }
      } catch (err: any) {
        lastErr = err;
        console.warn(`[Script Chat] Model ${m} with search failed:`, err?.message || err);
        // If it failed with search, try without search tool in case tool rate limits were hit
        if (useSearch) {
          try {
            const fallbackResponse = await client.models.generateContent({
              model: m,
              contents,
              config: {
                systemInstruction,
                temperature: 0.75,
              },
            });
            if (fallbackResponse.text && fallbackResponse.text.trim()) {
              aiResponseText = fallbackResponse.text.trim();
              break;
            }
          } catch (innerErr: any) {
            lastErr = innerErr;
          }
        }
        continue;
      }
    }

    if (!aiResponseText) {
      throw new Error(lastErr?.message || "Failed to generate AI response.");
    }

    let extractedShort: string | null = null;
    let extractedLong: string | null = null;

    const shortMatch = aiResponseText.match(/<<<SHORT_SCRIPT>>>([\s\S]*?)<<<END_SHORT_SCRIPT>>>/i);
    if (shortMatch) {
      extractedShort = shortMatch[1].trim().replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1");
    }

    const longMatch = aiResponseText.match(/<<<LONG_SCRIPT>>>([\s\S]*?)<<<END_LONG_SCRIPT>>>/i);
    if (longMatch) {
      extractedLong = longMatch[1].trim().replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1");
    }

    let cleanChatReply = aiResponseText
      .replace(/<<<SHORT_SCRIPT>>>[\s\S]*?<<<END_SHORT_SCRIPT>>>/gi, "")
      .replace(/<<<LONG_SCRIPT>>>[\s\S]*?<<<END_LONG_SCRIPT>>>/gi, "")
      .trim();

    if (!cleanChatReply && (extractedShort || extractedLong)) {
      cleanChatReply = "I have drafted both the Viral Short and the 8–10 Minute Long-Form master scripts with retention hooks and ad markers on your canvas. Take a look on the right and let me know what you'd like to refine!";
    }

    res.json({
      reply: cleanChatReply,
      shortScript: extractedShort,
      longScript: extractedLong,
    });
  } catch (err: any) {
    console.error("[Script Chat API Error]:", err);
    const status = err?.status || (err?.code === "USER_KEY_REQUIRED" ? 401 : 500);
    res.status(status).json({
      error: err?.message || "Script chat failed",
      code: err?.code,
    });
  }
});

// Voices list endpoint
app.get("/api/tts/voices", (req, res) => {
  res.json({
    voices: [
      { id: "gemini-charon", name: "Charon", gender: "male", style: "Deep Cinematic Storyteller" },
      { id: "gemini-kore", name: "Kore", gender: "female", style: "Expressive Narrative & Drama" },
      { id: "gemini-puck", name: "Puck", gender: "male", style: "Dynamic & Modern Narrator" },
      { id: "gemini-fenrir", name: "Fenrir", gender: "male", style: "Gritty Suspense & True Crime" },
      { id: "gemini-zephyr", name: "Zephyr", gender: "female", style: "Clear Commentary & Audiobooks" },
      { id: "gemini-aoede", name: "Aoede", gender: "female", style: "Rich Dramatic & Classical Storyteller" },
    ],
  });
});

// Google Gemini TTS Generation Endpoint
app.post("/api/tts/generate", async (req, res) => {
  try {
    const {
      text,
      voice = "Charon",
      speed = 1.0,
      whisper = false,
      stylePrompt = "",
    } = req.body;

    const customKey = (req.headers["x-gemini-api-key"] as string) || req.body?.apiKey;
    const client = getGeminiClient(customKey);

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Missing or invalid text parameter" });
    }

    // Strip any lingering brackets from clean spoken text
    const cleanText = text.replace(/\[[^\]]+\]/g, "").replace(/\s+/g, " ").trim();
    if (!cleanText) {
      // 0.2s clean silence
      const silenceBytes = Buffer.alloc(24000 * 2 * 0.2);
      const silenceWav = pcm16ToWavBuffer(silenceBytes, 24000);
      res.set("Content-Type", "audio/wav");
      return res.send(silenceWav);
    }

    // Map any legacy voice keys to Google Gemini voice names
    let targetVoice = "Charon";
    const validGoogleVoices = ["Puck", "Charon", "Kore", "Fenrir", "Zephyr", "Aoede"];

    const voiceLower = String(voice).toLowerCase();
    if (validGoogleVoices.map((v) => v.toLowerCase()).includes(voiceLower)) {
      targetVoice = validGoogleVoices.find((v) => v.toLowerCase() === voiceLower) || "Charon";
    } else if (voiceLower.includes("kore") || voiceLower.includes("bella") || voiceLower.includes("female") || voiceLower.includes("sarah")) {
      targetVoice = "Kore";
    } else if (voiceLower.includes("zephyr") || voiceLower.includes("nicole") || voiceLower.includes("emma")) {
      targetVoice = "Zephyr";
    } else if (voiceLower.includes("aoede") || voiceLower.includes("drama")) {
      targetVoice = "Aoede";
    } else if (voiceLower.includes("puck") || voiceLower.includes("shorts") || voiceLower.includes("fast")) {
      targetVoice = "Puck";
    } else if (voiceLower.includes("fenrir") || voiceLower.includes("crime") || voiceLower.includes("gritty")) {
      targetVoice = "Fenrir";
    } else {
      targetVoice = "Charon";
    }

    // Check in-memory cache
    const cacheKey = getCacheKey(cleanText, targetVoice, speed, whisper);
    if (audioCache.has(cacheKey)) {
      const cachedWav = audioCache.get(cacheKey)!;
      res.set({
        "Content-Type": "audio/wav",
        "Content-Length": cachedWav.length.toString(),
        "X-Cache-Hit": "true",
      });
      return res.send(cachedWav);
    }

    // Format text for Google Gemini TTS
    // Provide natural vocal delivery guidance if specified
    let speechInput = cleanText;
    if (stylePrompt && typeof stylePrompt === "string" && stylePrompt.trim()) {
      speechInput = `${stylePrompt.trim()}: ${cleanText}`;
    }

    // Models in priority order with graceful fallback
    const modelsToTry = [
      "gemini-3.1-flash-tts-preview",
      "gemini-2.5-flash-preview-tts",
    ];

    let pcmRawBuffer: Buffer | null = null;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await client.models.generateContent({
          model: modelName,
          contents: [{ parts: [{ text: speechInput }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: targetVoice },
              },
            },
          },
        });

        const base64Data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Data) {
          pcmRawBuffer = Buffer.from(base64Data, "base64");
          break; // Success!
        }
      } catch (err: any) {
        console.warn(`[Gemini TTS] Model ${modelName} notice:`, err.message || err);
        lastError = err;
        // If 429 quota or 503 high demand, try the next model
        continue;
      }
    }

    // If both direct models returned an error, attempt a short backoff retry with the secondary model
    if (!pcmRawBuffer) {
      console.warn("[Gemini TTS] Retrying with secondary model after brief backoff...");
      await new Promise((r) => setTimeout(r, 600));
      try {
        const response = await client.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: cleanText }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: targetVoice },
              },
            },
          },
        });
        const base64Data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Data) {
          pcmRawBuffer = Buffer.from(base64Data, "base64");
        }
      } catch (retryErr: any) {
        lastError = retryErr;
      }
    }

    if (!pcmRawBuffer) {
      const errorMsg = lastError?.message || "Google Gemini TTS service unavailable";
      console.error("[Gemini TTS] Generation failed:", errorMsg);
      return res.status(500).json({
        error: "Google Gemini TTS Generation Failed",
        details: errorMsg,
      });
    }

    // Apply smooth whisper acoustic warmth if requested (zero noise, zero screeching)
    const finalPcm = whisper ? applyWhisperAcoustics(pcmRawBuffer) : pcmRawBuffer;

    // Convert raw 16-bit linear PCM into compliant 24000Hz RIFF WAV
    const wavBuffer = pcm16ToWavBuffer(finalPcm, 24000);

    // Save to LRU cache
    if (audioCache.size >= MAX_CACHE_SIZE) {
      const firstKey = audioCache.keys().next().value;
      if (firstKey) audioCache.delete(firstKey);
    }
    audioCache.set(cacheKey, wavBuffer);

    res.set({
      "Content-Type": "audio/wav",
      "Content-Length": wavBuffer.length.toString(),
      "X-Audio-Duration": (finalPcm.length / (24000 * 2)).toFixed(3),
    });

    return res.send(wavBuffer);
  } catch (err: any) {
    console.error("[Gemini TTS] Unhandled synthesis error:", err);
    const status = err?.status || (err?.code === "USER_KEY_REQUIRED" ? 401 : 500);
    return res.status(status).json({
      error: err?.message || "TTS Generation Failed",
      code: err?.code,
    });
  }
});

/**
 * Clean and format quota or rate-limit messages to prevent raw JSON dumps
 */
function cleanQuotaMessage(raw?: string): string {
  if (!raw) return "Generated via Algorithmic Engine (Gemini API rate limit reached).";
  const str = String(raw);
  if (str.includes("429") || str.includes("RESOURCE_EXHAUSTED") || str.includes("quota")) {
    return "User API key reached standard Gemini rate limits (429). Algorithmic engine generated your packaging successfully.";
  }
  return str.length > 100 ? "API request rate limit reached. Algorithmic content generated successfully." : str;
}

/**
 * Helper: Algorithmic SEO & Packaging Fallback Generator
 * Used when Gemini API limits (429 RESOURCE_EXHAUSTED) are encountered
 */
function generateAlgorithmicSeo(script: string, topic: string, videoType: string, quotaReason?: string) {
  const cleanScript = (script || "").trim();
  const rawTopic = (topic || "").trim();
  
  // Extract key phrases and topic words
  const words = cleanScript.split(/\s+/).filter(w => w.length > 3 && !/^(this|that|with|from|have|were|they|their|what|when|where|which|about|there|then|into|could|would)$/i.test(w));
  const mainSubject = rawTopic || words.slice(0, 3).join(" ") || "The Untold Story";
  const capitalSubject = mainSubject.charAt(0).toUpperCase() + mainSubject.slice(1);
  
  const titles = [
    {
      title: `The Shocking Truth Behind ${capitalSubject} Nobody Told You`,
      style: "Curiosity Gap",
      charCount: `The Shocking Truth Behind ${capitalSubject} Nobody Told You`.length,
      rationale: "Creates an urgent knowledge gap that compels high click-throughs.",
    },
    {
      title: `Why ${capitalSubject} Is Far Worse Than You Think`,
      style: "High Stakes",
      charCount: `Why ${capitalSubject} Is Far Worse Than You Think`.length,
      rationale: "Leverages intense psychological stakes and heightened tension.",
    },
    {
      title: `Did Anyone Notice What Really Happened to ${capitalSubject}?`,
      style: "Question",
      charCount: `Did Anyone Notice What Really Happened to ${capitalSubject}?`.length,
      rationale: "Poses a direct question that turns casual scrollers into curious viewers.",
    },
    {
      title: `The Real Story of ${capitalSubject} (They Wanted This Hidden)`,
      style: "Extreme Contrast",
      charCount: `The Real Story of ${capitalSubject} (They Wanted This Hidden)`.length,
      rationale: "Triggers classic investigative intrigue and insider discovery.",
    },
    {
      title: `The Disturbing Mystery of ${capitalSubject}`,
      style: "Mystery",
      charCount: `The Disturbing Mystery of ${capitalSubject}`.length,
      rationale: "Punchy, under 50 characters, optimized for mobile video feeds.",
    },
  ];

  const first150 = cleanScript.slice(0, 150) || `The complete story and investigative breakdown of ${mainSubject}.`;
  const body = cleanScript.slice(0, 650) || `In this documentary breakdown, we uncover the hidden details behind ${mainSubject}. Every piece of evidence points toward a mystery that few fully understand. Watch until the very end to understand how all the clues connect.`;

  // Dynamic chapters based on script text
  const paragraphs = cleanScript.split(/\n\n+/).filter(p => p.trim().length > 20);
  let chapters: { time: string; title: string }[] = [];
  if (paragraphs.length >= 3) {
    const chapterTitles = ["The Cold Open", "The First Clue", "The Turning Point", "Unraveling The Truth", "The Final Revelation"];
    let accumulatedSeconds = 0;
    chapters = paragraphs.slice(0, 5).map((p, idx) => {
      const mins = Math.floor(accumulatedSeconds / 60).toString().padStart(2, '0');
      const secs = (accumulatedSeconds % 60).toString().padStart(2, '0');
      const title = chapterTitles[idx] || `Chapter ${idx + 1}`;
      accumulatedSeconds += Math.max(45, Math.floor(p.split(/\s+/).length / 2.3));
      return { time: `${mins}:${secs}`, title };
    });
  } else {
    chapters = [
      { time: "00:00", title: "The Cold Open" },
      { time: "01:15", title: "The Incident" },
      { time: "03:40", title: "The Hidden Details" },
      { time: "06:20", title: "What Really Happened" },
      { time: "08:50", title: "Final Thoughts" },
    ];
  }

  // Tags based on subject & keywords
  const cleanSubjectWords = mainSubject.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const baseTags = [
    mainSubject.toLowerCase(),
    ...cleanSubjectWords,
    "documentary",
    "mystery",
    "true story",
    "investigation",
    "explained",
    "untold story",
    "deep dive",
    "storytime",
    "history",
    "video essay",
  ];
  const tags = Array.from(new Set(baseTags)).slice(0, 15);
  const hashtags = [
    `#${(cleanSubjectWords[0] || 'Documentary').replace(/^#/, '')}`,
    "#Investigation",
    "#Mystery",
    "#Storytime",
  ];

  return {
    titles,
    description: {
      aboveTheFold: first150,
      bodySynopsis: body,
      keyTopics: [mainSubject, "Full Timeline Investigation", "Unsolved Questions"],
      pinnedComment: `What part of this breakdown shocked you the most? Drop your theory in the comments below! 👇`,
    },
    chapters,
    tags,
    hashtags,
    groundingQueries: [mainSubject, "YouTube video SEO trends", "high retention storytelling"],
    analyzedAt: Date.now(),
    isQuotaFallback: true,
    quotaWarning: cleanQuotaMessage(quotaReason),
  };
}

/**
 * Helper: Algorithmic B-Roll & Thumbnail Fallback Generator
 * Used when Gemini API limits (429 RESOURCE_EXHAUSTED) are encountered
 */
function generateAlgorithmicBRoll(script: string, genre: string, topic: string, userFeedback?: string, quotaReason?: string) {
  const cleanScript = (script || topic || "").trim();
  const rawTopic = topic || genre || "Mysterious Investigation";
  
  // Break script into sentences
  const rawSentences = cleanScript.match(/[^.!?]+[.!?]+/g) || [cleanScript.slice(0, 120), cleanScript.slice(120, 240), cleanScript.slice(240, 360)].filter(Boolean);
  const sentences = rawSentences.map(s => s.trim()).filter(Boolean);

  const shotSheet: Array<{
    timestamp: string;
    durationSec?: number;
    spokenText: string;
    visualAction: string;
    sfxCue: string;
    stockKeywords: string;
    veoPrompt: string;
    veoCameraMotion?: string;
    veoLighting?: string;
    veoShotType?: string;
    veoStylePreset?: string;
  }> = [];

  let currentTime = 0;

  const visualActions = [
    "Cinematic slow push-in with warm directional spotlight cutting through dark atmosphere",
    "Macro lens detail shot with shallow depth of field, dust motes floating in shaft of light",
    "Wide aerial drone tracking shot sweeping across misty desolate landscape at dusk",
    "Rapid montage of vintage archival photographs and redacted documents with subtle film grain",
    "High-contrast silhouette walking past rain-streaked neon window, anamorphic bokeh",
    "Slow-motion close-up of a clock ticking with rhythmic camera shake",
    "Sudden whip-pan transition into dark corridor with flickering fluorescent backlight",
    "Cinematic freeze frame with subtle desaturation and vignette darkening the edges",
  ];

  const sfxCues = [
    "[Low cinematic sub-bass rumble + muffled vinyl crackle]",
    "[Eerie reversed piano chord with subtle tape hiss]",
    "[Sharp metallic tape deck click + distant atmospheric drone]",
    "[Muffled heartbeat accelerating in tempo]",
    "[Subtle high-frequency riser leading into silence]",
    "[Distant thunder boom with resonant room reverb]",
    "[Deep cinematic hit with echoing metallic decay]",
  ];

  const stockKeywordsList = [
    "cinematic dark mystery slow push in 4k",
    "macro hands typing investigation evidence",
    "foggy forest aerial drone moody dusk",
    "vintage archive documents redacted file slow motion",
    "neon rain night window silhouette bokeh",
    "clock ticking slow motion dark room",
    "dramatic dark corridor flickering light",
  ];

  const numShots = Math.max(6, Math.min(10, Math.max(sentences.length, 6)));
  for (let i = 0; i < numShots; i++) {
    const textSnippet = (sentences[i] || `Narrative beat ${i + 1}: Key narrative progression and revelation`).trim();
    const duration = Math.max(3, Math.min(8, Math.round((textSnippet.split(/\s+/).length || 8) / 2.5)));
    const startMins = Math.floor(currentTime / 60);
    const startSecs = (currentTime % 60).toString().padStart(2, '0');
    currentTime += duration;
    const endMins = Math.floor(currentTime / 60);
    const endSecs = (currentTime % 60).toString().padStart(2, '0');

    shotSheet.push({
      timestamp: `${startMins}:${startSecs} - ${endMins}:${endSecs}`,
      durationSec: duration,
      spokenText: textSnippet.slice(0, 80) + (textSnippet.length > 80 ? "..." : ""),
      visualAction: visualActions[i % visualActions.length],
      sfxCue: sfxCues[i % sfxCues.length],
      stockKeywords: stockKeywordsList[i % stockKeywordsList.length],
      veoPrompt: `Cinematic 4K hyper-detailed shot: ${visualActions[i % visualActions.length]}. Camera Movement: Slow steady tracking dolly shot, ARRI Alexa Mini LF 35mm anamorphic prime lens, shallow depth of field f/1.8, atmospheric volumetric haze, rich natural color grading, photorealistic physics, 24fps --ar 16:9`,
      veoCameraMotion: "Slow steady tracking dolly shot",
      veoLighting: "Atmospheric volumetric lighting with subtle rim contrast",
      veoShotType: i % 2 === 0 ? "Medium cinematic shot" : "Close-up detail shot",
      veoStylePreset: "cinematic",
    });
  }

  const thumbnails = [
    {
      conceptTitle: "The Classified Dossier",
      visualComposition: "Extreme close-up of a cracked confidential evidence folder with red stamp, illuminated by a stark warm spotlight on a dark mahogany desk.",
      textOverlay: "THEY LIED",
      colorGrading: "Moody obsidian blacks with piercing 3200K amber tungsten glow for extreme mobile scroll-stopping contrast.",
      aiImagePrompt: `cinematic hyper-detailed shot of confidential evidence folder with classified stamp on dark wooden desk, harsh warm spotlight, volumetric dust, anamorphic lens, 8k --ar 16:9`,
    },
    {
      conceptTitle: "The Glowing Monitor",
      visualComposition: "Shocked investigator silhouette seen from over-the-shoulder, staring into a blinding cyan computer screen revealing a hidden map.",
      textOverlay: "DON'T LOOK",
      colorGrading: "Deep indigo shadows with electric cyan-blue monitor glare cutting across the subject's face.",
      aiImagePrompt: `cinematic shot of investigator in silhouette staring at glowing blue computer screen in pitch dark room, dramatic rim lighting, film grain, 8k --ar 16:9`,
    },
    {
      conceptTitle: "The Solitary Figure",
      visualComposition: "Lone silhouette standing before a massive steel vault door cracked open with blinding white light pouring through heavy fog.",
      textOverlay: "EXPOSED",
      colorGrading: "High-contrast monochrome chiaroscuro with subtle emerald green undertones in the shadows.",
      aiImagePrompt: `cinematic wide shot of solitary silhouette standing in front of cracked open vault door emitting blinding light, heavy volumetric fog, dramatic lighting, 8k --ar 16:9`,
    },
  ];

  const pacingTips = [
    "Cut to a new angle, focal length, or digital push-in every 3.5 to 4.5 seconds during the hook to maintain >70% retention.",
    "Drop background music by -5dB right before every major revelation to draw full psychological focus to the vocal line.",
    "Pair every on-screen visual cut with a tactile audio cue (low riser, click, or sub-boom) so the edit feels physical.",
  ];

  return {
    replyText: `I activated our high-retention Algorithmic Art Engine (Gemini API quota fallback) to build your second-by-second B-Roll shot sheet and 3 mobile-optimized thumbnail concepts. Everything is calibrated for maximum viewer retention!`,
    shotSheet,
    thumbnails,
    pacingTips,
    groundingQueries: [rawTopic, "high CTR thumbnail compositions", "YouTube retention editing"],
    analyzedAt: Date.now(),
    isQuotaFallback: true,
    quotaWarning: cleanQuotaMessage(quotaReason),
  };
}

/**
 * POST /api/youtube/seo
 * 100% Google Search Grounded YouTube SEO & Packaging Engine with multi-model resilience
 */
app.post("/api/youtube/seo", async (req, res) => {
  try {
    const { script = "", topic = "", videoType = "long-form" } = req.body;
    if (!script.trim() && !topic.trim()) {
      return res.status(400).json({ error: "Script or topic is required for SEO generation." });
    }

    const customKey = (req.headers["x-gemini-api-key"] as string) || req.body?.apiKey;
    const client = getGeminiClient(customKey);

    const prompt = `You are an elite YouTube Algorithm Strategist, CTR Scientist, and SEO Director.
Perform real-time Google Search Grounding to identify active search interest, trending queries, related topics, and competitor video angles for this YouTube content.

SCRIPT / TOPIC CONTEXT:
${topic ? `TOPIC/NICHE: ${topic}\n` : ""}
SCRIPT CONTENT:
${script.slice(0, 4000)}

YOUR TASK:
Use Google Search Grounding to research what real viewers are searching for on Google & YouTube regarding this topic.
Then produce an end-to-end, high-conversion YouTube packaging suite in strict JSON format.

JSON STRUCTURE REQUIRED:
\`\`\`json
{
  "titles": [
    {
      "title": "High-CTR Title under 60 characters",
      "style": "Curiosity Gap | High Stakes | Extreme Contrast | Question | Mystery",
      "charCount": 45,
      "rationale": "Why this triggers high click-through rate without being spammy"
    }
  ],
  "description": {
    "aboveTheFold": "150-character punchy teaser shown before 'Show More' with primary keyword",
    "bodySynopsis": "2-3 rich paragraphs incorporating secondary search phrases and entity keywords naturally for SEO indexing",
    "keyTopics": ["Topic / Query 1", "Topic / Query 2", "Topic / Query 3"],
    "pinnedComment": "Engaging question or Shorts-to-Long funnel bridge ready to pin at the top of comments"
  },
  "chapters": [
    { "time": "00:00", "title": "The Cold Open" },
    { "time": "01:45", "title": "Chapter 2 Title" }
  ],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10", "tag11", "tag12"],
  "hashtags": ["#TrendingTopic", "#Mystery", "#Documentary"],
  "groundingQueries": ["queries searched on Google to ground this packaging"]
}
\`\`\`
Provide 5 distinct titles, 4-8 chapter markers, and 12-15 tags. Return ONLY the valid JSON block.`;

    let rawText = "";
    let lastError: any = null;
    let searchQueriesUsed: string[] = [];

    try {
      const response = await generateContentWithFallback(
        client,
        {
          contents: prompt,
          tools: [{ googleSearch: {} }],
        },
        ["gemini-2.5-flash", "gemini-flash-latest", "gemini-3.8-flash", "gemini-3.1-flash-lite"]
      );
      rawText = response.text;
      if (response.searchQueries) searchQueriesUsed = response.searchQueries;
    } catch (err: any) {
      lastError = err;
      try {
        const responseNoTool = await generateContentWithFallback(
          client,
          { contents: prompt },
          ["gemini-2.5-flash", "gemini-flash-latest", "gemini-3.8-flash", "gemini-3.1-flash-lite"]
        );
        rawText = responseNoTool.text;
      } catch (innerErr: any) {
        lastError = innerErr;
      }
    }

    let parsedJson: any = null;
    if (rawText) {
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          parsedJson = JSON.parse(jsonMatch[1]);
        } catch (e) {
          console.warn("[SEO] Failed parsing extracted JSON block, trying whole text");
        }
      }

      if (!parsedJson) {
        try {
          parsedJson = JSON.parse(rawText.trim());
        } catch (e) {
          console.warn("[SEO] Failed parsing raw text JSON");
        }
      }
    }

    if (!parsedJson) {
      console.log("[YouTube SEO] Serving algorithmic fallback due to API limits or rate constraints");
      parsedJson = generateAlgorithmicSeo(script, topic, videoType, lastError?.message);
    } else {
      if (searchQueriesUsed.length > 0) {
        parsedJson.groundingQueries = searchQueriesUsed;
      }
    }

    parsedJson.analyzedAt = Date.now();
    return res.json(parsedJson);
  } catch (err: any) {
    if (err?.code === "USER_KEY_REQUIRED" || err?.status === 401) {
      return res.status(401).json({
        error: "Gemini API key required. Please enter your personal Gemini API key in Settings to generate SEO packaging.",
        code: "USER_KEY_REQUIRED",
      });
    }
    console.log("[YouTube SEO] Serving algorithmic fallback for request");
    const fallback = generateAlgorithmicSeo(req.body?.script || "", req.body?.topic || "", req.body?.videoType || "long-form", err?.message);
    return res.json(fallback);
  }
});

/**
 * POST /api/youtube/broll-thumbnails
 * Visual B-Roll & SFX Cue Sheet + Conversational Thumbnail Art Director
 * Powered by Google Search Grounding with algorithmic fallback resilience
 */
app.post("/api/youtube/broll-thumbnails", async (req, res) => {
  try {
    const { 
      script = "", 
      genre = "documentary / mystery", 
      topic = "",
      userFeedback = "",
      messages = [],
      audioBase64 = "", // Optional generated voice audio buffer
      audioMimeType = "audio/wav",
    } = req.body;

    if (!script.trim() && !topic.trim() && !userFeedback.trim()) {
      return res.status(400).json({ error: "Script, topic, or message is required for B-Roll & Thumbnail generation." });
    }

    const customKey = (req.headers["x-gemini-api-key"] as string) || req.body?.apiKey;
    const client = getGeminiClient(customKey);

    let conversationHistory = "";
    if (Array.isArray(messages) && messages.length > 0) {
      conversationHistory = "\nPRIOR ART DIRECTOR DISCUSSION:\n" + messages.map((m: any) => `${m.role === 'user' ? 'CREATOR' : 'ART DIRECTOR'}: ${m.content}`).join("\n");
    }

    const prompt = `You are a master YouTube Video Editor and Art Director specializing in high-retention faceless channels and visual storytelling.
${audioBase64 ? "NOTE: You are given the actual spoken narration voice audio alongside the script. LISTEN carefully to the speaker's vocal inflection, pauses, emotional intensity, and pacing to match visual cuts and SFX precisely to the audio cues." : "Rely on the provided narration text to create precise visual cuts."}
You MUST rely on Google Search Grounding to check live YouTube visual trends, thumbnail compositions that are currently earning high CTR in this genre, and modern retention editing patterns.

NARRATION SCRIPT / TOPIC:
${(script || topic).slice(0, 4000)}

GENRE / ATMOSPHERE: ${genre}
${conversationHistory}
${userFeedback ? `\nLATEST USER CREATIVE REQUEST / FEEDBACK:\n"${userFeedback}"\nAdjust the thumbnail concepts and shot sheet according to this exact feedback.` : ''}

CRITICAL OBJECTIVES:
1. Grounding: Research what top-performing YouTube channels are doing for this topic or genre (color palettes, text overlay styles, pacing of B-roll, sound design).
2. Conversational Pitch (replyText): Provide a direct, professional, friendly conversational response to the creator explaining the creative direction, answering any question they asked, or summarizing the changes you just made to their concepts.
3. Editor's B-Roll & SFX Cue Sheet: Second-by-second shot list with visual action, sound effects, and stock footage search keywords. Every cut should be timed to narration beats.
4. Thumbnail Art Director: Exactly 3 high-CTR thumbnail concepts designed for mobile feeds, including composition, 2–4 word text overlays, color grading, and ready-to-use AI art prompts (for Midjourney, Flux, or Imagen with --ar 16:9).
5. 3 Retention & Pacing Tips for the video editor.

OUTPUT MUST BE STRICT JSON:
\`\`\`json
{
  "replyText": "Hey! I've researched top-performing YouTube videos in this genre and designed these visual cues and high-CTR thumbnail concepts...",
  "shotSheet": [
    {
      "timestamp": "0:00 - 0:04",
      "durationSec": 4,
      "spokenText": "First sentence or hook words...",
      "visualAction": "Visual instruction for editor (e.g., Slow push-in on rain-streaked window at night with silhouette passing)",
      "sfxCue": "[Low sub-bass boom + muffled rain ambiance]",
      "stockKeywords": "rainy window night mystery silhouette",
      "veoPrompt": "Cinematic 4k shot of rain-streaked window at night, lone silhouette passing outside, anamorphic 35mm lens, shallow depth of field f/1.8, warm interior tungsten lighting against cold cyan rain, smooth slow push-in, volumetric haze, photorealistic physics, 24fps --ar 16:9",
      "veoCameraMotion": "Slow deliberate push-in",
      "veoLighting": "Cold cyan exterior rain vs warm interior tungsten light",
      "veoShotType": "Medium close-up",
      "veoStylePreset": "cinematic"
    }
  ],
  "thumbnails": [
    {
      "conceptTitle": "The Glowing Evidence",
      "visualComposition": "Extreme close-up of a cracked police bodycam lying face-up in the mud, screen emitting eerie cyan static glow, dark moody forest backdrop",
      "textOverlay": "DON'T LOOK",
      "colorGrading": "Cold teal shadows with piercing warm amber lantern light for extreme mobile contrast",
      "aiImagePrompt": "cinematic hyper-detailed shot of cracked police bodycam in dark forest mud, screen glowing with static, anamorphic lens flare, moody volumetric mist, dramatic lighting, 8k --ar 16:9"
    }
  ],
  "pacingTips": [
    "Cut to a new angle or subtle digital push-in every 4 seconds to maintain above 65% retention through the hook.",
    "Drop ambient music by -6dB during whisper tags so the vocal presence cuts straight through."
  ],
  "groundingQueries": ["queries used to check YouTube visual trends"]
}
\`\`\`
Produce 6-12 shot sheet entries covering key beats of the script, and exactly 3 distinct thumbnail concepts. Return ONLY valid JSON.`;

    // Construct multimodal content parts if audioBase64 is passed
    const contentsPayload: any[] = [];
    if (audioBase64 && typeof audioBase64 === "string" && audioBase64.length > 50) {
      contentsPayload.push({
        inlineData: {
          mimeType: audioMimeType || "audio/wav",
          data: audioBase64.replace(/^data:[^;]+;base64,/, ""),
        },
      });
    }
    contentsPayload.push(prompt);

    let rawText = "";
    let lastError: any = null;
    let searchQueriesUsed: string[] = [];

    try {
      const response = await generateContentWithFallback(
        client,
        {
          contents: contentsPayload,
          tools: [{ googleSearch: {} }],
        },
        ["gemini-2.5-flash", "gemini-flash-latest", "gemini-3.8-flash", "gemini-3.1-flash-lite"]
      );
      rawText = response.text;
      if (response.searchQueries) searchQueriesUsed = response.searchQueries;
    } catch (err: any) {
      lastError = err;
      try {
        const responseNoTool = await generateContentWithFallback(
          client,
          { contents: contentsPayload },
          ["gemini-2.5-flash", "gemini-flash-latest", "gemini-3.8-flash", "gemini-3.1-flash-lite"]
        );
        rawText = responseNoTool.text;
      } catch (innerErr: any) {
        lastError = innerErr;
      }
    }

    let parsedJson: any = null;
    if (rawText) {
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          parsedJson = JSON.parse(jsonMatch[1]);
        } catch (e) {
          console.warn("[B-Roll] Failed parsing extracted JSON block, trying whole text");
        }
      }

      if (!parsedJson) {
        try {
          parsedJson = JSON.parse(rawText.trim());
        } catch (e) {
          console.warn("[B-Roll] Failed parsing raw text JSON");
        }
      }
    }

    if (!parsedJson) {
      console.log("[YouTube B-Roll] Serving algorithmic fallback due to API limits or rate constraints");
      parsedJson = generateAlgorithmicBRoll(script, genre, topic, userFeedback, lastError?.message);
    } else {
      if (searchQueriesUsed.length > 0) {
        parsedJson.groundingQueries = searchQueriesUsed;
      }
    }

    parsedJson.analyzedAt = Date.now();
    return res.json(parsedJson);
  } catch (err: any) {
    if (err?.code === "USER_KEY_REQUIRED" || err?.status === 401) {
      return res.status(401).json({
        error: "Gemini API key required. Please enter your personal Gemini API key in Settings to generate B-Roll & Thumbnails.",
        code: "USER_KEY_REQUIRED",
      });
    }
    console.log("[YouTube B-Roll] Serving algorithmic fallback for request");
    const fallback = generateAlgorithmicBRoll(
      req.body?.script || "",
      req.body?.genre || "documentary / mystery",
      req.body?.topic || "",
      req.body?.userFeedback,
      err?.message
    );
    return res.json(fallback);
  }
});

/**
 * POST /api/generate-image
 * High quality Text-to-Image generation for Thumbnails using gemini-3.1-flash-image / gemini-3.1-flash-lite-image
 */
app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt, aspectRatio = "16:9", imageSize = "1K" } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "Image prompt is required." });
    }

    const customKey = (req.headers["x-gemini-api-key"] as string) || req.body?.apiKey;
    const client = getGeminiClient(customKey);

    // Supported models in order of priority: gemini-3.1-flash-image -> gemini-3.1-flash-lite-image
    const imageModels = ["gemini-3.1-flash-image", "gemini-3.1-flash-lite-image"];
    let base64Image = "";
    let mimeType = "image/png";
    let lastError: any = null;

    for (const modelName of imageModels) {
      try {
        const response = await client.models.generateContent({
          model: modelName,
          contents: {
            parts: [{ text: prompt.trim() }],
          },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio as any,
              ...(modelName === "gemini-3.1-flash-image" ? { imageSize: imageSize as any } : {}),
            },
          },
        });

        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            base64Image = part.inlineData.data;
            mimeType = part.inlineData.mimeType || "image/png";
            break;
          }
        }

        if (base64Image) break;
      } catch (err: any) {
        console.warn(`[ImageGen] Model ${modelName} error:`, err?.message || err);
        lastError = err;
      }
    }

    if (!base64Image) {
      throw lastError || new Error("Failed to generate image from AI model");
    }

    const imageUrl = `data:${mimeType};base64,${base64Image}`;
    return res.json({
      imageUrl,
      mimeType,
      aspectRatio,
      prompt,
    });
  } catch (err: any) {
    console.error("[ImageGen] Route failure:", err?.message || err);
    if (err?.code === "USER_KEY_REQUIRED" || err?.status === 401) {
      return res.status(401).json({
        error: "Gemini API key required. Please configure your personal Gemini API key in Settings.",
        code: "USER_KEY_REQUIRED",
      });
    }
    return res.status(500).json({
      error: err?.message || "Image generation failed. Ensure your API key has Image Generation quota.",
    });
  }
});

/**
 * POST /api/generate-video
 * Step 1 of Veo Video generation: initiate job and return operationName
 */
app.post("/api/generate-video", async (req, res) => {
  try {
    const {
      prompt,
      model = "veo-3.1-lite-generate-preview",
      aspectRatio = "16:9",
      resolution = "720p",
      imageBytes,
      imageMimeType = "image/png",
    } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "Video prompt is required." });
    }

    const customKey = (req.headers["x-gemini-api-key"] as string) || req.body?.apiKey;
    const client = getGeminiClient(customKey);

    const videoConfig: any = {
      numberOfVideos: 1,
      resolution: resolution === "1080p" ? "1080p" : "720p",
      aspectRatio: aspectRatio === "9:16" ? "9:16" : "16:9",
    };

    const payload: any = {
      model: model || "veo-3.1-lite-generate-preview",
      prompt: prompt.trim(),
      config: videoConfig,
    };

    if (imageBytes) {
      payload.image = {
        imageBytes,
        mimeType: imageMimeType,
      };
    }

    const operation = await client.models.generateVideos(payload);

    return res.json({
      operationName: operation.name,
      status: "pending",
      prompt,
      aspectRatio,
      resolution,
      model,
    });
  } catch (err: any) {
    console.error("[Veo] Video generation failed to start:", err?.message || err);
    if (err?.code === "USER_KEY_REQUIRED" || err?.status === 401) {
      return res.status(401).json({
        error: "Gemini API key required. Please configure your personal Gemini API key in Settings.",
        code: "USER_KEY_REQUIRED",
      });
    }
    return res.status(500).json({
      error: err?.message || "Failed to initiate Veo video generation.",
    });
  }
});

/**
 * POST /api/video-status
 * Step 2 of Veo Video generation: poll operation status
 */
app.post("/api/video-status", async (req, res) => {
  try {
    const { operationName } = req.body;
    if (!operationName || typeof operationName !== "string") {
      return res.status(400).json({ error: "operationName is required." });
    }

    const customKey = (req.headers["x-gemini-api-key"] as string) || req.body?.apiKey;
    const client = getGeminiClient(customKey);

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await client.operations.getVideosOperation({ operation: op });

    const isDone = Boolean(updated.done);
    return res.json({
      done: isDone,
      error: updated.error ? updated.error.message || "Video generation failed" : null,
      metadata: updated.metadata || null,
    });
  } catch (err: any) {
    console.error("[Veo Status] Polling error:", err?.message || err);
    return res.status(500).json({
      error: err?.message || "Failed to poll video status",
      done: false,
    });
  }
});

/**
 * POST /api/video-download
 * Step 3 of Veo Video generation: fetch generated MP4 video buffer from Google Cloud Storage using backend credentials
 */
app.post("/api/video-download", async (req, res) => {
  try {
    const { operationName } = req.body;
    if (!operationName || typeof operationName !== "string") {
      return res.status(400).json({ error: "operationName is required." });
    }

    const customKey = (req.headers["x-gemini-api-key"] as string) || req.body?.apiKey;
    const client = getGeminiClient(customKey);

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await client.operations.getVideosOperation({ operation: op });

    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) {
      return res.status(404).json({ error: "Generated video URI not ready or not found." });
    }

    const videoRes = await fetch(uri, {
      headers: { "x-goog-api-key": (customKey || "").trim() },
    });

    if (!videoRes.ok) {
      throw new Error(`Failed to fetch video stream from Google storage: ${videoRes.statusText}`);
    }

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", 'inline; filename="veo-clip.mp4"');

    const arrayBuffer = await videoRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return res.send(buffer);
  } catch (err: any) {
    console.error("[Veo Download] Failed to stream video:", err?.message || err);
    return res.status(500).json({
      error: err?.message || "Failed to download generated video.",
    });
  }
});

// Start Express server and mount Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`  ➜  Local:   http://localhost:${PORT}/`);
    console.log(`  ➜  Network: http://0.0.0.0:${PORT}/`);
    console.log(`NarratorStudio Server listening on http://0.0.0.0:${PORT} (Google Gemini TTS Online Mode)`);
  });

  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`[Server] Port ${PORT} busy, retrying in 1s...`);
      setTimeout(() => {
        try {
          server.close();
        } catch {
          // ignore
        }
        server.listen(PORT, "0.0.0.0");
      }, 1000);
    } else {
      console.error("[Server] Fatal error:", err);
    }
  });

  const shutdown = () => {
    console.log("[Server] Gracefully shutting down...");
    server.close(() => {
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 1500).unref();
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer().catch((err) => {
  console.error("[Server] Failed to initialize:", err);
  process.exit(1);
});
