"use client";

import { useGuideStore } from "@/stores/guide-store";
import { Home, MessageCircle, Map, User } from "lucide-react";

export function BottomNav() {
  const { activeTab, setActiveTab } = useGuideStore();

  const tabs = [
    { id: "home" as const, label: "首页", icon: Home },
    { id: "guide" as const, label: "导览", icon: MessageCircle },
    { id: "map" as const, label: "地图", icon: Map },
    { id: "me" as const, label: "我的", icon: User },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-around border-t bg-white shadow-lg"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className="flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 transition-colors"
          style={{ minWidth: 60, minHeight: 44 }}
        >
          <Icon
            size={22}
            style={{
              color: activeTab === id ? "var(--szm-blue, #6B9E8C)" : "#999",
            }}
          />
          <span
            className="text-xs"
            style={{
              color: activeTab === id ? "var(--szm-blue, #6B9E8C)" : "#999",
              fontWeight: activeTab === id ? 600 : 400,
            }}
          >
            {label}
          </span>
        </button>
      ))}
    </nav>
  );
}