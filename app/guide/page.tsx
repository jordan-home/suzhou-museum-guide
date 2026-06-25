"use client";

import { useEffect } from "react";
import { useGuideStore } from "@/stores/guide-store";
import { BottomNav } from "@/components/layout/BottomNav";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatInput } from "@/components/chat/ChatInput";
import { useRouter } from "next/navigation";

async function sendChatMessage(text: string) {
  const allMessages = useGuideStore.getState().messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: allMessages }),
  });

  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const processStream = () => {
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
                state.messages[state.messages.length - 1].content += content;
              } else {
                state.addMessage({ role: "assistant", content });
              }
            }
          } catch {}
        }
      }
      processStream();
    });
  };
  processStream();
}

const WELCOME_SUGGESTIONS = [
  { icon: "🏛️", label: "镇馆之宝有哪些？", text: "镇馆之宝有哪些？" },
  { icon: "🗺️", label: "帮我规划参观路线", text: "帮我规划一条参观路线，大约2小时" },
  { icon: "🎨", label: "今天有什么特展？", text: "今天有什么特展？" },
  { icon: "📅", label: "如何预约参观？", text: "如何预约参观苏州博物馆？" },
  { icon: "🏺", label: "吴地遗珍讲了什么？", text: "吴地遗珍展厅讲的是什么历史？" },
  { icon: "🏗️", label: "贝聿铭的设计特色", text: "贝聿铭的建筑设计有什么特色？" },
];

export default function GuidePage() {
  const { addMessage, setActiveTab, isStreaming } = useGuideStore();
  const router = useRouter();

  // 切换到 guide tab 时清空之前可能残留的消息（可选）
  // 也可以保留，看产品需求——这里保留，让对话有上下文

  const handleSuggestion = (text: string) => {
    addMessage({ role: "user", content: text });
    useGuideStore.getState().setIsStreaming(true);
    sendChatMessage(text).catch((err) => {
      console.error("[guide] chat error:", err);
      useGuideStore.getState().setIsStreaming(false);
      addMessage({ role: "assistant", content: "抱歉，网络出了点小问题，请稍后再试。" });
    });
  };

  const handleSendMessage = async (text: string) => {
    addMessage({ role: "user", content: text });
    useGuideStore.getState().setIsStreaming(true);
    try {
      await sendChatMessage(text);
    } catch (err) {
      console.error("[guide] chat error:", err);
      useGuideStore.getState().setIsStreaming(false);
      addMessage({ role: "assistant", content: "抱歉，网络出了点小问题，请稍后再试。" });
    }
  };

  const messages = useGuideStore((s) => s.messages);

  return (
    <div
      className="flex flex-col"
      style={{ height: "100dvh", backgroundColor: "#F7F5F0" }}
    >
      {/* 顶部栏 */}
      <header
        className="flex items-center justify-between px-4 bg-white shadow-sm"
        style={{ height: 56, flexShrink: 0, borderBottom: "1px solid #F0EDE8" }}
      >
        <div>
          <h1
            className="text-base font-semibold"
            style={{ fontFamily: "'Noto Serif SC', serif", color: "#2C2C2C" }}
          >
            AI 导览
          </h1>
          <p className="text-xs" style={{ color: "#6B9E8C" }}>
            🗣️ 说一句话，带你深入了解苏博
          </p>
        </div>
        <div className="flex gap-2">
          {messages.length > 0 && (
            <button
              className="text-xs px-3 py-1.5 rounded-full transition-colors"
              style={{
                border: "1px solid #E8E4DC",
                color: "#999",
                backgroundColor: "#fff",
              }}
              onClick={() => {
                useGuideStore.getState().clearMessages();
              }}
            >
              新对话
            </button>
          )}
          <button
            className="text-xs px-3 py-1.5 rounded-full transition-colors"
            style={{
              backgroundColor: "#6B9E8C",
              color: "#fff",
              border: "none",
            }}
            onClick={() => setActiveTab("map")}
          >
            去地图
          </button>
        </div>
      </header>

      {/* 消息区域 */}
      <div className="flex-1 overflow-hidden">
        {messages.length === 0 ? (
          /* 欢迎页 */
          <div
            className="flex flex-col items-center px-6 pt-8"
            style={{ height: "100%", overflowY: "auto" }}
          >
            {/* 欢迎语 */}
            <div className="text-center mb-6">
              <div
                className="inline-flex items-center justify-center rounded-full mb-3"
                style={{
                  width: 56,
                  height: 56,
                  backgroundColor: "#E8F0ED",
                  fontSize: 28,
                }}
              >
                🏛️
              </div>
              <h2
                className="text-lg mb-1"
                style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: "#2C2C2C" }}
              >
                欢迎来到苏州博物馆
              </h2>
              <p className="text-sm" style={{ color: "#999" }}>
                我是你的专属导览员，有什么想了解的？
              </p>
            </div>

            {/* 快捷问题 */}
            <div className="w-full max-w-sm">
              <p
                className="text-xs mb-3 text-center"
                style={{ color: "#BBB", letterSpacing: "0.05em" }}
              >
                — 试试这样问 —
              </p>
              <div className="grid grid-cols-2 gap-2">
                {WELCOME_SUGGESTIONS.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => handleSuggestion(s.text)}
                    className="flex items-start gap-2 p-3 text-left rounded-xl transition-shadow hover:shadow-sm"
                    style={{
                      backgroundColor: "#fff",
                      border: "1px solid #E8E4DC",
                    }}
                  >
                    <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>
                      {s.icon}
                    </span>
                    <span className="text-xs" style={{ color: "#444", lineHeight: 1.4 }}>
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <ChatWindow />
        )}
      </div>

      {/* 输入框 */}
      <ChatInput
        onSend={handleSendMessage}
        disabled={isStreaming}
      />

      <BottomNav />
    </div>
  );
}
