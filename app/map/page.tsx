"use client";

import { MuseumMap } from "@/components/map/MuseumMap";
import { BottomNav } from "@/components/layout/BottomNav";
import { useGuideStore } from "@/stores/guide-store";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MessageCircle, MapPin } from "lucide-react";
import { useState } from "react";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default function MapPage() {
  const { currentHall } = useGuideStore();
  const [chatOpen, setChatOpen] = useState(false);

  const handleHallSelect = (_hall: any) => {
    // 地图点击展厅时不自动触发 AI，先打开聊天入口
    setChatOpen(true);
  };

  const handleSendMessage = async (_text: string) => {
    useGuideStore.getState().setIsStreaming(true);
    const allMessages = useGuideStore.getState().messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
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
    } catch (err) {
      console.error("[map] chat error:", err);
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
        className="flex items-center px-4 bg-white border-b shrink-0"
        style={{ borderColor: "#F0EDE8", height: 56 }}
      >
        <MapPin size={20} style={{ color: "#6B9E8C", marginRight: 8, flexShrink: 0 }} />
        <div>
          <h1
            className="text-base font-semibold"
            style={{ fontFamily: "'Noto Serif SC', serif" }}
          >
            展厅地图
          </h1>
          {currentHall && (
            <p className="text-xs" style={{ color: "#6B9E8C" }}>
              📍 当前：{currentHall}
            </p>
          )}
        </div>
      </header>

      {/* 地图主体 */}
      <div className="flex-1 min-h-0">
        <MuseumMap onHallSelect={handleHallSelect} />
      </div>

      {/* AI 助手 FAB */}
      <div className="fixed bottom-20 right-4 z-40">
        <Sheet open={chatOpen} onOpenChange={setChatOpen}>
          <SheetTrigger
            render={
              <button
                className="rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95"
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: "#6B9E8C",
                  borderRadius: "50%",
                  border: "none",
                  cursor: "pointer",
                  zIndex: 40,
                }}
                aria-label="打开 AI 导览"
              />
            }
          >
            <MessageCircle size={22} color="#fff" />
          </SheetTrigger>
          <SheetContent
            side="right"
            className="p-0"
            style={{ width: "100%", maxWidth: "100%", height: "100%", borderRadius: 0 }}
          >
            <ChatWindow onSend={handleSendMessage} />
          </SheetContent>
        </Sheet>
      </div>

      <BottomNav />
    </div>
  );
}
