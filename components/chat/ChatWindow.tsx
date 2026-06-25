"use client";

import { useGuideStore } from "@/stores/guide-store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Bot, User, Volume2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const QUICK_QUESTIONS = [
  "镇馆之宝有哪些？",
  "今天的特展是什么？",
  "贝聿铭的建筑设计有什么特色？",
  "如何预约参观？",
  "吴地遗珍讲的是什么？",
];

interface ChatWindowProps {
  /** 外部传入的发送处理器（如不传，则由 ChatWindow 内部自己处理） */
  onSend?: (text: string) => void;
}

export function ChatWindow({ onSend }: ChatWindowProps) {
  const { messages, isStreaming, ttsEnabled, addMessage, setIsStreaming } = useGuideStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    // 消息先入 store，立即显示
    addMessage({ role: "user", content: text });
    // 再触发 API（如有回调）
    onSend?.(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickQuestion = (text: string) => {
    if (isStreaming) return;
    if (onSend) {
      onSend(text);
    } else {
      addMessage({ role: "user", content: text });
    }
  };

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
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
        style={{ borderColor: "#F0EDE8" }}
      >
        <Avatar style={{ width: 36, height: 36, backgroundColor: "#E8F0ED" }}>
          <AvatarFallback
            style={{ backgroundColor: "#6B9E8C", color: "#fff" }}
          >
            <Bot size={18} />
          </AvatarFallback>
        </Avatar>
        <div>
          <h2
            className="text-base"
            style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, lineHeight: 1.2 }}
          >
            苏博 AI 导览
          </h2>
          <p className="text-xs" style={{ color: "#6B9E8C", lineHeight: 1.2 }}>
            随时为你讲解苏州博物馆
          </p>
        </div>
        <div className="ml-auto">
          <Badge
            style={{
              borderColor: "#6B9E8C",
              color: "#6B9E8C",
              fontSize: 11,
              padding: "2px 8px",
            }}
          >
            AI 在线
          </Badge>
        </div>
      </div>

      {/* Messages — scrollable */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        style={{ backgroundColor: "#F7F5F0" }}
      >
        <div className="flex flex-col gap-3 p-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="text-3xl mb-4">🏛️</div>
              <h3
                className="mb-2 text-lg"
                style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: "#2C2C2C" }}
              >
                欢迎来到苏州博物馆
              </h3>
              <p className="mb-5 text-sm" style={{ color: "#999", maxWidth: 280 }}>
                我是你的 AI 导览员，有什么想了解的尽管问我吧！
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleQuickQuestion(q)}
                    className="px-3 py-1.5 text-sm"
                    style={{
                      borderRadius: 999,
                      border: "1px solid #E8E4DC",
                      backgroundColor: "#fff",
                      color: "#444",
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
              className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
            >
              <Avatar style={{ width: 32, height: 32, flexShrink: 0 }}>
                <AvatarFallback
                  style={{
                    backgroundColor: msg.role === "assistant" ? "#6B9E8C" : "#E8E4DC",
                    color: msg.role === "assistant" ? "#fff" : "#2C2C2C",
                    fontSize: 13,
                  }}
                >
                  {msg.role === "assistant" ? <Bot size={14} /> : <User size={14} />}
                </AvatarFallback>
              </Avatar>

              <div
                className="max-w-[75%]"
                style={
                  msg.role === "user"
                    ? {
                        backgroundColor: "#E8E4DC",
                        borderRadius: "12px 16px 4px 12px",
                        padding: "10px 12px",
                      }
                    : {
                        backgroundColor: "#E8F0ED",
                        borderRadius: "16px 12px 12px 4px",
                        padding: "10px 12px",
                      }
                }
              >
                <p style={{ lineHeight: 1.7, whiteSpace: "pre-wrap", fontSize: 14 }}>
                  {msg.content}
                </p>
                {msg.role === "assistant" && ttsEnabled && (
                  <button
                    onClick={() => handleTTS(msg.content)}
                    className="flex items-center gap-1 mt-1.5 text-xs opacity-60 hover:opacity-100 transition-opacity"
                    style={{ color: "#6B9E8C" }}
                  >
                    <Volume2 size={11} />
                    朗读
                  </button>
                )}
              </div>
            </div>
          ))}

          {isStreaming && (
            <div className="flex gap-2">
              <Avatar style={{ width: 32, height: 32, flexShrink: 0 }}>
                <AvatarFallback
                  style={{ backgroundColor: "#6B9E8C", color: "#fff", fontSize: 13 }}
                >
                  <Bot size={14} />
                </AvatarFallback>
              </Avatar>
              <div
                style={{
                  backgroundColor: "#E8F0ED",
                  borderRadius: "16px 12px 12px 4px",
                  padding: "10px 12px",
                }}
              >
                <span className="flex gap-0.5">
                  <span className="animate-bounce" style={{ animationDelay: "0ms", color: "#6B9E8C" }}>●</span>
                  <span className="animate-bounce" style={{ animationDelay: "150ms", color: "#6B9E8C" }}>●</span>
                  <span className="animate-bounce" style={{ animationDelay: "300ms", color: "#6B9E8C" }}>●</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input — always at bottom */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 border-t shrink-0"
        style={{ borderColor: "#F0EDE8", backgroundColor: "#fff" }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="问我关于苏州博物馆的一切..."
          disabled={isStreaming}
          className="flex-1"
          style={{ borderRadius: 20 }}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          size="icon"
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            backgroundColor: "#6B9E8C",
            border: "none",
            flexShrink: 0,
          }}
        >
          <Send size={15} color="#fff" />
        </Button>
      </div>
    </div>
  );
}
