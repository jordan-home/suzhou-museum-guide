"use client";

import { MuseumMap } from "@/components/map/MuseumMap";
import { BottomNav } from "@/components/layout/BottomNav";
import { useGuideStore } from "@/stores/guide-store";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MessageCircle, MapPin } from "lucide-react";
import { useState } from "react";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatInput } from "@/components/chat/ChatInput";

export default function MapPage() {
  const { currentHall, addMessage, setIsStreaming, isStreaming } = useGuideStore();
  const [chatOpen, setChatOpen] = useState(false);

  const handleHallSelect = (hall: any) => {
    if (hall) {
      addMessage({
        role: "user",
        content: `我想了解${hall.name}的详细导览`,
      });
      // 触发 AI 回复
      triggerChat(`我想了解${hall.name}的详细导览`);
    }
  };

  const triggerChat = async (text: string) => {
    setIsStreaming(true);
    setChatOpen(true);

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
            setIsStreaming(false);
            return;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                setIsStreaming(false);
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
                    addMessage({ role: "assistant", content });
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
      setIsStreaming(false);
      addMessage({
        role: "assistant",
        content: "抱歉，网络出了点小问题，请稍后再试。",
      });
    }
  };

  return (
    <div
      className="flex flex-col"
      style={{ height: "100dvh", backgroundColor: "var(--szm-light, #F7F5F0)" }}
    >
      {/* 顶部栏 */}
      <header
        className="flex items-center justify-between px-4 py-3 bg-white border-b"
        style={{ borderColor: "var(--szm-gray)", height: 56, flexShrink: 0 }}
      >
        <div className="flex items-center gap-2">
          <MapPin size={20} style={{ color: "var(--szm-blue)" }} />
          <div>
            <h1
              className="text-base font-semibold"
              style={{ fontFamily: "var(--font-serif, serif)" }}
            >
              展厅地图
            </h1>
            {currentHall && (
              <p className="text-xs" style={{ color: "var(--szm-blue)" }}>
                📍 当前：{currentHall}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* 地图主体 */}
      <div className="flex-1 overflow-hidden">
        <MuseumMap onHallSelect={handleHallSelect} />
      </div>

      {/* AI 助手入口 */}
      <div className="absolute bottom-20 right-4 z-40">
        <Sheet open={chatOpen} onOpenChange={setChatOpen}>
          <SheetTrigger
            render={
              <Button
                className="rounded-full shadow-lg w-12 h-12 flex items-center justify-center"
                style={{
                  backgroundColor: "var(--szm-blue)",
                  borderRadius: "50%",
                }}
              >
                <MessageCircle size={22} color="#fff" />
              </Button>
            }
          />
          <SheetContent
            side="right"
            className="p-0 flex flex-col"
            style={{ width: "100%", maxWidth: "100%", height: "100%", borderRadius: 0 }}
          >
            <div className="flex flex-col" style={{ height: "100%" }}>
              <ChatWindow />
              <ChatInput
                onSend={(text) => {
                  addMessage({ role: "user", content: text });
                  triggerChat(text);
                }}
                disabled={isStreaming}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <BottomNav />
    </div>
  );
}
