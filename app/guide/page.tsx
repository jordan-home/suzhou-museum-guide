"use client";

import { useGuideStore } from "@/stores/guide-store";
import { BottomNav } from "@/components/layout/BottomNav";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useRouter } from "next/navigation";

async function sendChatMessage() {
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

export default function GuidePage() {
  const { setActiveTab } = useGuideStore();
  const router = useRouter();

  const handleSendMessage = async (_text: string) => {
    useGuideStore.getState().setIsStreaming(true);
    try {
      await sendChatMessage();
    } catch (err) {
      console.error("[guide] chat error:", err);
      useGuideStore.getState().setIsStreaming(false);
      useGuideStore.getState().addMessage({
        role: "assistant",
        content: "抱歉，网络出了点小问题，请稍后再试。",
      });
    }
  };

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: "100dvh", backgroundColor: "#F7F5F0" }}
    >
      {/* 顶部栏 */}
      <header
        className="flex items-center justify-between px-4 bg-white shrink-0"
        style={{ height: 56, borderBottom: "1px solid #F0EDE8" }}
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
          <button
            className="text-xs px-3 py-1.5 rounded-full"
            style={{ backgroundColor: "#6B9E8C", color: "#fff", border: "none" }}
            onClick={() => {
              setActiveTab("map");
              router.push("/map");
            }}
          >
            去地图
          </button>
        </div>
      </header>

      {/* 聊天区域（填满剩余空间） */}
      <div className="flex-1 min-h-0">
        <ChatWindow onSend={handleSendMessage} />
      </div>

      <BottomNav />
    </div>
  );
}
