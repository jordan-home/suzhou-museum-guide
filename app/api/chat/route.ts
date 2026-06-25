// app/api/chat/route.ts
// AI 对话 API（流式返回）

import { NextRequest } from "next/server";
import { createChatCompletion } from "@/lib/deepseek";
import { retrieveRelevantArtifacts, buildContextFromArtifacts } from "@/lib/rag";
import { SYSTEM_PROMPT } from "@/prompts/system-prompt";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "DEEPSEEK_API_KEY not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { messages, useRAG = true } = await req.json();

    let systemContent = SYSTEM_PROMPT;

    if (useRAG && messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find((m: any) => m.role === "user");
      if (lastUserMessage) {
        const relevant = retrieveRelevantArtifacts(lastUserMessage.content, 5);
        if (relevant.length > 0) {
          const context = buildContextFromArtifacts(relevant);
          systemContent = `${SYSTEM_PROMPT}\n\n【相关文物知识】（请优先参考这些信息）：\n${context}`;
        }
      }
    }

    const allMessages = [
      { role: "system", content: systemContent },
      ...messages,
    ];

    const response = await createChatCompletion(allMessages, apiKey);

    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: any) {
    console.error("[chat/route.ts] Error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}