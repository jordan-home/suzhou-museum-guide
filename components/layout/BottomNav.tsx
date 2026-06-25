"use client";

import { useGuideStore } from "@/stores/guide-store";
import { useRouter, usePathname } from "next/navigation";
import { Home, MessageCircle, Map, User } from "lucide-react";

const TABS = [
  { id: "home" as const, label: "首页", icon: Home, href: "/" },
  { id: "guide" as const, label: "导览", icon: MessageCircle, href: "/guide" },
  { id: "map" as const, label: "地图", icon: Map, href: "/map" },
  { id: "me" as const, label: "我的", icon: User, href: "/me" },
];

export function BottomNav() {
  const { activeTab, setActiveTab } = useGuideStore();
  const router = useRouter();
  const pathname = usePathname();

  // 同步 pathname → activeTab（解决刷新后状态丢失问题）
  const currentTab = TABS.find((t) => t.href === pathname)?.id ?? "home";

  const handleTabClick = (tab: (typeof TABS)[number]) => {
    setActiveTab(tab.id);
    router.push(tab.href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-around border-t bg-white shadow-lg"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {TABS.map(({ id, label, icon: Icon, href }) => {
        const isActive = currentTab === id;
        return (
          <button
            key={id}
            onClick={() => handleTabClick({ id, label, icon: Icon, href })}
            className="flex flex-col items-center justify-center gap-0.5"
            style={{ minWidth: 60, minHeight: 44 }}
          >
            <Icon
              size={22}
              style={{ color: isActive ? "#6B9E8C" : "#999" }}
            />
            <span
              className="text-xs"
              style={{
                color: isActive ? "#6B9E8C" : "#999",
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
