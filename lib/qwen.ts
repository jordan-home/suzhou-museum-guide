// lib/qwen.ts
// 通义千问 API 封装（dashscope）

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  model?: "qwen-turbo" | "qwen-max";
  temperature?: number;
  maxTokens?: number;
}

const DEFAULT_MODEL = "qwen-turbo";
const API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

export async function createChatCompletion(
  messages: ChatMessage[],
  apiKey: string,
  options: ChatOptions = {}
): Promise<Response> {
  const { model = DEFAULT_MODEL, temperature = 0.7, maxTokens = 2000 } = options;

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[qwen.ts] API error:", response.status, errorText);
    throw new Error(`Qwen API error: ${response.status} - ${errorText}`);
  }

  return response;
}

export async function createChatCompletionNonStream(
  messages: ChatMessage[],
  apiKey: string,
  options: ChatOptions = {}
): Promise<string> {
  const { model = DEFAULT_MODEL, temperature = 0.7, maxTokens = 2000 } = options;

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[qwen.ts] API error:", response.status, errorText);
    throw new Error(`Qwen API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}