// app/api/tts/route.ts
// 阿里云 TTS 语音合成 API

import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const apiKey = process.env.DASHSCOPE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "DASHSCOPE_API_KEY not configured" }, { status: 500 });
  }

  try {
    const { text, voice = "aixia" } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // 阿里云语音合成 API（dashscope 统一入口）
    const response = await fetch(
      "https://dashscope.aliyuncs.com/api/v1/services/audio/speech/generation",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "cosyvoice-v1",
          input: { text: text.substring(0, 1000) }, // 限制字数
          parameters: {
            voice,
            response_format: "mp3",
            sample_rate: 32000,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("[tts/route.ts] TTS API error:", response.status, errText);
      return NextResponse.json({ error: `TTS error: ${response.status}` }, { status: 500 });
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audioBuffer.byteLength),
      },
    });
  } catch (err: any) {
    console.error("[tts/route.ts] Error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}