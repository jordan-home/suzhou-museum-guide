"use client";

import { useGuideStore } from "@/stores/guide-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Bot, User, Volume2 } from "lucide-react";
import { useEffect, useRef } from "react";

const QUICK_QUESTIONS = [
  "镇馆之宝有哪些？",
  "今天的特展是什么？",
  "贝聿铭的建筑设计有什么特色？",
  "如何预约参观？",
  "吴地遗珍讲的是什么？",
];

export function ChatWindow() {
  const { messages, isStreaming, ttsEnabled } = useGuideStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const handleTTS = async (text: string) => {
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[ChatWindow] TTS error:", err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b bg-white"
        style={{ height: 64 }}
      >
        <Avatar className="shrink-0" style={{ backgroundColor: "var(--szm-blue-pale, #E8F0ED)" }}>
          <AvatarFallback style={{ backgroundColor: "var(--szm-blue, #6B9E8C)", color: "#fff" }}>
            <Bot size={20} />
          </AvatarFallback>
        </Avatar>
        <div>
          <h2
            className="text-lg"
            style={{ fontFamily: "var(--font-serif, 'Noto Serif SC', serif)", fontWeight: 600 }}
          >
            苏博 AI 导览
          </h2>
          <p className="text-xs" style={{ color: "var(--szm-blue, #6B9E8C)" }}>
            随时为你讲解苏州博物馆
          </p>
        </div>
        <div className="ml-auto">
          <Badge
            variant="outline"
            style={{
              borderColor: "var(--szm-blue, #6B9E8C)",
              color: "var(--szm-blue, #6B9E8C)",
              fontSize: 12,
            }}
          >
            AI 在线
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef} style={{ backgroundColor: "var(--szm-light, #F7F5F0)" }}>
        <div className="flex flex-col gap-3 p-4" style={{ minHeight: "100%" }}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div
                className="mb-6 text-4xl"
                style={{ fontFamily: "var(--font-serif, serif)" }}
              >
                🏛️
              </div>
              <h3
                className="mb-2 text-xl"
                style={{ fontFamily: "var(--font-serif, 'Noto Serif SC', serif)", fontWeight: 600 }}
              >
                欢迎来到苏州博物馆
              </h3>
              <p className="mb-6 text-sm" style={{ color: "#999", maxWidth: 280 }}>
                我是你的 AI 导览员，有什么想了解的尽管问我吧！
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      useGuideStore.getState().addMessage({ role: "user", content: q });
                      useGuideStore.getState().setIsStreaming(true);
                      fetch("/api/chat", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          messages: [
                            ...useGuideStore.getState().messages.map((m) => ({
                              role: m.role,
                              content: m.content,
                            })),
                            { role: "user", content: q },
                          ],
                        }),
                      })
                        .then((r) => r.body)
                        .then((body) => {
                          if (!body) throw new Error("No body");
                          const reader = body.getReader();
                          const decoder = new TextDecoder();
                          let buffer = "";

                          const process = () => {
                            reader.read().then(({ done, value }) => {
                              if (done) {
                                useGuideStore.getState().setIsStreaming(false);
                                return;
                              }
                              buffer += decoder.decode(value, { stream: true });
                              const lines = buffer.split("\n");
                              buffer = lines.pop() || "";

                              for (const line of lines) {
                                if (line.startsWith("data: ")) {
                                  const data = line.slice(6);
                                  if (data === "[DONE]") {
                                    useGuideStore.getState().setIsStreaming(false);
                                    return;
                                  }
                                  try {
                                    const parsed = JSON.parse(data);
                                    const content = parsed.choices?.[0]?.delta?.content;
                                    if (content) {
                                      const state = useGuideStore.getState();
                                      const lastMsg = state.messages[state.messages.length - 1];
                                      if (lastMsg?.role === "assistant" && !lastMsg.content.endsWith("\n")) {
                                        useGuideStore.getState().messages[state.messages.length - 1].content += content;
                                      } else {
                                        useGuideStore.getState().addMessage({ role: "assistant", content });
                                      }
                                    }
                                  } catch {}
                                }
                              }
                              process();
                            });
                          };
                          process();
                        })
                        .catch((err) => {
                          console.error("[chat] error:", err);
                          useGuideStore.getState().setIsStreaming(false);
                        });
                    }}
                    className="px-3 py-1.5 text-sm transition-colors"
                    style={{
                      borderRadius: "var(--szm-radius-full, 9999px)",
                      border: "1px solid var(--szm-gray, #E8E4DC)",
                      backgroundColor: "#fff",
                      color: "var(--szm-dark, #2C2C2C)",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-2",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <Avatar className="shrink-0 mt-1" style={{ width: 32, height: 32 }}>
                <AvatarFallback
                  style={{
                    backgroundColor:
                      msg.role === "assistant"
                        ? "var(--szm-blue, #6B9E8C)"
                        : "var(--szm-gray, #E8E4DC)",
                    color: msg.role === "assistant" ? "#fff" : "var(--szm-dark, #2C2C2C)",
                    width: 32,
                    height: 32,
                    fontSize: 14,
                  }}
                >
                  {msg.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
                </AvatarFallback>
              </Avatar>

              <div
                className={cn(
                  "ai-bubble max-w-[75%]",
                  msg.role === "user" ? "user-bubble" : "ai-bubble"
                )}
                style={
                  msg.role === "user"
                    ? {
                        backgroundColor: "var(--szm-gray, #E8E4DC)",
                        borderRadius: "var(--szm-radius-lg, 12px) var(--szm-radius-xl, 16px) var(--szm-radius-sm, 4px) var(--szm-radius-lg, 12px)",
                      }
                    : {
                        backgroundColor: "var(--szm-blue-pale, #E8F0ED)",
                        borderRadius: "var(--szm-radius-xl, 16px) var(--szm-radius-lg, 12px) var(--szm-radius-lg, 12px) var(--szm-radius-sm, 4px)",
                      }
                }
              >
                <p style={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{msg.content}</p>
                {msg.role === "assistant" && ttsEnabled && (
                  <button
                    onClick={() => handleTTS(msg.content)}
                    className="flex items-center gap-1 mt-2 text-xs transition-opacity opacity-60 hover:opacity-100"
                    style={{ color: "var(--szm-blue, #6B9E8C)" }}
                  >
                    <Volume2 size={12} />
                    朗读
                  </button>
                )}
              </div>
            </div>
          ))}

          {isStreaming && (
            <div className="flex gap-2">
              <Avatar className="shrink-0 mt-1" style={{ width: 32, height: 32 }}>
                <AvatarFallback
                  style={{
                    backgroundColor: "var(--szm-blue, #6B9E8C)",
                    color: "#fff",
                    width: 32,
                    height: 32,
                    fontSize: 14,
                  }}
                >
                  <Bot size={16} />
                </AvatarFallback>
              </Avatar>
              <div
                className="ai-bubble"
                style={{
                  backgroundColor: "var(--szm-blue-pale, #E8F0ED)",
                  borderRadius: "var(--szm-radius-xl, 16px) var(--szm-radius-lg, 12px) var(--szm-radius-lg, 12px) var(--szm-radius-sm, 4px)",
                }}
              >
                <span className="inline-flex gap-1">
                  <span className="animate-bounce" style={{ animationDelay: "0ms" }}>●</span>
                  <span className="animate-bounce" style={{ animationDelay: "150ms" }}>●</span>
                  <span className="animate-bounce" style={{ animationDelay: "300ms" }}>●</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}