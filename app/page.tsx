"use client";

import { useGuideStore } from "@/stores/guide-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BottomNav } from "@/components/layout/BottomNav";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageCircle, MapPin, Clock, Calendar, Building2 } from "lucide-react";
import { useState } from "react";

const HALLS = [
  {
    id: "wudi",
    name: "吴地遗珍",
    subtitle: "苏州历史基本陈列",
    desc: "从新石器时代到明清，完整呈现苏州万年文明史",
    icon: "🏛️",
  },
  {
    id: "paintings",
    name: "书画馆",
    subtitle: "吴门画派与历代书画",
    desc: "文徵明、唐寅、仇英，领略吴门画派风采",
    icon: "🖌️",
  },
  {
    id: "porcelain",
    name: "陶瓷馆",
    subtitle: "历代陶瓷精品",
    desc: "从青瓷到粉彩，瓷器之美尽收眼底",
    icon: "🏺",
  },
  {
    id: "twinpagodas",
    name: "两塔瑰宝",
    subtitle: "虎丘塔与瑞光塔出土",
    desc: "佛塔地宫珍宝，穿越千年的佛教艺术",
    icon: "🗼",
  },
];

export default function HomePage() {
  const { setActiveTab, addMessage, setIsStreaming } = useGuideStore();
  const [chatOpen, setChatOpen] = useState(false);

  const handleSendMessage = async (text: string) => {
    addMessage({ role: "user", content: text });
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
      console.error("[home] chat error:", err);
      setIsStreaming(false);
      addMessage({
        role: "assistant",
        content: "抱歉，网络出了点小问题，请稍后再试。",
      });
    }
  };

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: "var(--szm-light, #F7F5F0)", paddingBottom: 64 }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-4 bg-white shadow-sm"
        style={{ height: 64 }}
      >
        <div>
          <h1
            className="text-xl"
            style={{ fontFamily: "var(--font-serif, 'Noto Serif SC', serif)", fontWeight: 700 }}
          >
            苏州博物馆
          </h1>
          <p className="text-xs" style={{ color: "#999" }}>
            Suzhou Museum · 贝聿铭设计
          </p>
        </div>
        <Badge
          style={{
            backgroundColor: "var(--szm-blue-pale, #E8F0ED)",
            color: "var(--szm-blue, #6B9E8C)",
            border: "none",
          }}
        >
          <Clock size={12} className="mr-1" />
          周二至周日 9:00-17:00
        </Badge>
      </header>

      {/* Hero */}
      <div
        className="relative flex flex-col items-center justify-center py-12 text-center text-white"
        style={{
          background: "linear-gradient(135deg, #6B9E8C 0%, #4A7A6C 100%)",
          minHeight: 200,
        }}
      >
        <Building2 size={48} className="mb-3 opacity-80" />
        <h2
          className="mb-2 text-2xl"
          style={{ fontFamily: "var(--font-serif, 'Noto Serif SC', serif)", fontWeight: 600 }}
        >
          "中而新，苏而新"
        </h2>
        <p className="text-sm opacity-80 max-w-xs">
          贝聿铭设计 · 2006年落成 · 太平天国忠王府遗址
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-3 px-4 -mt-6">
        <Card
          className="p-3"
          style={{ borderRadius: "var(--szm-radius-lg, 12px)", border: "none", boxShadow: "var(--szm-shadow-md)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={16} style={{ color: "var(--szm-blue, #6B9E8C)" }} />
            <span className="text-xs font-medium">地址</span>
          </div>
          <p className="text-xs" style={{ color: "#666" }}>
            姑苏区东北街204号
          </p>
        </Card>
        <Card
          className="p-3"
          style={{ borderRadius: "var(--szm-radius-lg, 12px)", border: "none", boxShadow: "var(--szm-shadow-md)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={16} style={{ color: "var(--szm-blue, #6B9E8C)" }} />
            <span className="text-xs font-medium">当前展览</span>
          </div>
          <p className="text-xs" style={{ color: "#666" }}>
            江南造·蔡念群团扇艺术展
          </p>
        </Card>
      </div>

      {/* Halls */}
      <div className="px-4 mt-6">
        <h3
          className="mb-3 text-lg"
          style={{ fontFamily: "var(--font-serif, 'Noto Serif SC', serif)", fontWeight: 600 }}
        >
          展厅导览
        </h3>
        <div className="flex flex-col gap-3">
          {HALLS.map((hall) => (
            <Card
              key={hall.id}
              className="p-4 transition-shadow cursor-pointer hover:shadow-md"
              style={{ borderRadius: "var(--szm-radius-lg, 12px)", border: "1px solid var(--szm-gray)" }}
              onClick={() => setActiveTab("map")}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{hall.icon}</span>
                <div className="flex-1 min-w-0">
                  <h4
                    className="font-semibold"
                    style={{ fontFamily: "var(--font-serif, 'Noto Serif SC', serif)" }}
                  >
                    {hall.name}
                  </h4>
                  <p className="text-xs mb-1" style={{ color: "var(--szm-blue, #6B9E8C)" }}>
                    {hall.subtitle}
                  </p>
                  <p className="text-xs" style={{ color: "#888" }}>
                    {hall.desc}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* AI FAB */}
      <Sheet open={chatOpen} onOpenChange={setChatOpen}>
        <SheetTrigger
          render={
            <button
              className="fixed bottom-20 right-4 flex items-center justify-center shadow-lg transition-transform active:scale-95"
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                backgroundColor: "var(--szm-blue, #6B9E8C)",
                color: "#fff",
                zIndex: 40,
              }}
            />
          }
        />
        <SheetContent
          side="right"
          className="p-0 flex flex-col"
          style={{
            width: "100%",
            height: "100%",
            maxWidth: "100%",
            borderRadius: 0,
          }}
        >
          <div className="flex flex-col" style={{ height: "100%" }}>
            <ChatWindow />
            <ChatInput onSend={handleSendMessage} disabled={useGuideStore((s) => s.isStreaming)} />
          </div>
        </SheetContent>
      </Sheet>

      <BottomNav />
    </div>
  );
}