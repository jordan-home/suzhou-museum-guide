"use client";

import { useGuideStore } from "@/stores/guide-store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BottomNav } from "@/components/layout/BottomNav";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { MessageCircle, MapPin, Calendar, Building2, ChevronRight } from "lucide-react";
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

async function triggerChat() {
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

export default function HomePage() {
  const { setActiveTab } = useGuideStore();
  const [chatOpen, setChatOpen] = useState(false);

  const handleSendMessage = async (text: string) => {
    useGuideStore.getState().setIsStreaming(true);
    try {
      await triggerChat();
    } catch (err) {
      console.error("[home] chat error:", err);
      useGuideStore.getState().setIsStreaming(false);
      useGuideStore.getState().addMessage({
        role: "assistant",
        content: "抱歉，网络出了点小问题，请稍后再试。",
      });
    }
  };

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: "#F7F5F0", paddingBottom: 64 }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 bg-white shadow-sm shrink-0"
        style={{ height: 60, zIndex: 10 }}
      >
        <div>
          <h1
            className="text-lg"
            style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 700, lineHeight: 1.2 }}
          >
            苏州博物馆
          </h1>
          <p className="text-xs" style={{ color: "#999", lineHeight: 1.2 }}>
            Suzhou Museum
          </p>
        </div>
        <Badge
          className="text-xs shrink-0"
          style={{ backgroundColor: "#E8F0ED", color: "#6B9E8C", border: "none", padding: "4px 8px" }}
        >
          周二至周日 9:00-17:00
        </Badge>
      </header>

      {/* Hero */}
      <div
        className="flex flex-col items-center justify-center px-6"
        style={{
          background: "linear-gradient(160deg, #6B9E8C 0%, #4A7A6C 100%)",
          minHeight: 160,
          paddingTop: 24,
          paddingBottom: 24,
        }}
      >
        <Building2 size={40} className="mb-3 text-white opacity-80" />
        <h2
          className="mb-2 text-xl text-white text-center"
          style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, lineHeight: 1.3 }}
        >
          "中而新，苏而新"
        </h2>
        <p className="text-xs text-white opacity-75 text-center leading-relaxed">
          贝聿铭设计 · 2006年落成 · 太平天国忠王府遗址
        </p>

        {/* Info Pills */}
        <div className="flex gap-3 mt-4 w-full max-w-sm">
          <div className="flex-1 flex items-center gap-1.5 bg-white bg-opacity-20 rounded-full px-3 py-1.5">
            <MapPin size={12} className="text-white opacity-80 shrink-0" />
            <span className="text-xs text-white opacity-90 truncate">姑苏区东北街204号</span>
          </div>
          <div className="flex-1 flex items-center gap-1.5 bg-white bg-opacity-20 rounded-full px-3 py-1.5">
            <Calendar size={12} className="text-white opacity-80 shrink-0" />
            <span className="text-xs text-white opacity-90 truncate">江南造·团扇艺术展</span>
          </div>
        </div>
      </div>

      {/* Halls */}
      <div className="px-4 mt-5">
        <h3 className="mb-3 text-base" style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600 }}>
          展厅导览
        </h3>
        <div className="flex flex-col gap-2.5">
          {HALLS.map((hall) => (
            <Card
              key={hall.id}
              className="flex items-center gap-3 p-3.5 cursor-pointer transition-shadow hover:shadow-sm"
              style={{ borderRadius: 12, border: "1px solid #E8E4DC", backgroundColor: "#fff" }}
              onClick={() => setActiveTab("map")}
            >
              <span className="text-2xl shrink-0">{hall.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-semibold" style={{ fontFamily: "'Noto Serif SC', serif", lineHeight: 1.3 }}>
                    {hall.name}
                  </h4>
                  <span className="text-xs" style={{ color: "#6B9E8C" }}>
                    {hall.subtitle}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: "#888", lineHeight: 1.4 }}>
                  {hall.desc}
                </p>
              </div>
              <ChevronRight size={16} className="text-gray-300 shrink-0" />
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mt-5 mb-4">
        <h3 className="mb-3 text-base" style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600 }}>
          快捷服务
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: "参观预约", sub: "免费预约入馆", icon: "📅" },
            { label: "语音讲解", sub: "AI 实时讲解", icon: "🎧" },
            { label: "镇馆之宝", sub: "五大镇馆之宝", icon: "✨" },
            { label: "无障碍", sub: "轮椅/婴儿车", icon: "♿" },
          ].map((item) => (
            <button
              key={item.label}
              className="flex items-center gap-2.5 p-3 bg-white rounded-xl text-left"
              style={{ border: "1px solid #E8E4DC", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
            >
              <span className="text-xl">{item.icon}</span>
              <div>
                <p className="text-sm font-medium" style={{ color: "#2C2C2C", lineHeight: 1.3 }}>
                  {item.label}
                </p>
                <p className="text-xs" style={{ color: "#999", lineHeight: 1.3 }}>
                  {item.sub}
                </p>
              </div>
            </button>
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
                width: 52,
                height: 52,
                borderRadius: "50%",
                backgroundColor: "#6B9E8C",
                zIndex: 40,
                border: "none",
                cursor: "pointer",
              }}
              aria-label="打开 AI 导览"
            />
          }
        >
          <MessageCircle size={24} color="#fff" />
        </SheetTrigger>
        <SheetContent
          side="right"
          className="p-0"
          style={{ width: "100%", maxWidth: "100%", height: "100%", borderRadius: 0 }}
        >
          {/* ChatWindow 内置输入框，不需要额外包裹 */}
          <ChatWindow onSend={handleSendMessage} />
        </SheetContent>
      </Sheet>

      <BottomNav />
    </div>
  );
}
