"use client";

import { useGuideStore } from "@/stores/guide-store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/layout/BottomNav";
import { MapPin, Heart, CheckSquare, Clock, Settings, ChevronRight, Bell } from "lucide-react";

export default function MePage() {
  const { checkins, favorites } = useGuideStore();

  const checkinList = Object.entries(checkins).slice(0, 5);
  const favoriteCount = favorites.length;

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: "#F7F5F0", paddingBottom: 64 }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 bg-white shadow-sm"
        style={{ height: 60, flexShrink: 0 }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 40,
              height: 40,
              backgroundColor: "#E8F0ED",
              color: "#6B9E8C",
            }}
          >
            <span style={{ fontSize: 20 }}>🏛️</span>
          </div>
          <div>
            <h1 className="text-base font-semibold" style={{ color: "#2C2C2C" }}>
              苏博游客
            </h1>
            <p className="text-xs" style={{ color: "#999" }}>
              探索苏州博物馆
            </p>
          </div>
        </div>
        <button
          className="p-2 rounded-full"
          style={{ color: "#6B9E8C" }}
          aria-label="设置"
        >
          <Settings size={20} />
        </button>
      </header>

      {/* 参观统计 */}
      <div className="px-4 mt-4">
        <div
          className="grid grid-cols-3 gap-2 p-4 bg-white rounded-xl"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)", border: "1px solid #E8E4DC" }}
        >
          {[
            { icon: MapPin, label: "打卡展品", value: checkinList.length, color: "#6B9E8C" },
            { icon: Heart, label: "我的收藏", value: favoriteCount, color: "#E07B54" },
            { icon: Clock, label: "参观次数", value: 0, color: "#8B7BA8" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex flex-col items-center text-center">
              <div
                className="flex items-center justify-center rounded-full mb-1.5"
                style={{ width: 36, height: 36, backgroundColor: `${color}18` }}
              >
                <Icon size={16} style={{ color }} />
              </div>
              <p className="text-lg font-bold" style={{ color: "#2C2C2C", lineHeight: 1 }}>
                {value}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#999" }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 打卡记录 */}
      <div className="px-4 mt-4">
        <h3
          className="mb-2.5 text-sm font-semibold"
          style={{ color: "#2C2C2C" }}
        >
          打卡记录
        </h3>
        {checkinList.length === 0 ? (
          <Card
            className="p-5 text-center"
            style={{ borderRadius: 12, border: "1px solid #E8E4DC", backgroundColor: "#fff" }}
          >
            <p className="text-2xl mb-2">🏛️</p>
            <p className="text-sm" style={{ color: "#999" }}>
              还没有打卡记录
            </p>
            <p className="text-xs mt-1" style={{ color: "#BBB" }}>
              在地图页点击展品即可打卡
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {checkinList.map(([artifactId, timestamp]) => (
              <Card
                key={artifactId}
                className="flex items-center gap-3 p-3"
                style={{ borderRadius: 12, border: "1px solid #E8E4DC", backgroundColor: "#fff" }}
              >
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: "#E8F0ED",
                    color: "#6B9E8C",
                    flexShrink: 0,
                  }}
                >
                  <CheckSquare size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#2C2C2C" }}>
                    {artifactId}
                  </p>
                  <p className="text-xs" style={{ color: "#999" }}>
                    {new Date(timestamp).toLocaleDateString("zh-CN", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 收藏列表 */}
      <div className="px-4 mt-4">
        <h3
          className="mb-2.5 text-sm font-semibold"
          style={{ color: "#2C2C2C" }}
        >
          我的收藏
        </h3>
        {favorites.length === 0 ? (
          <Card
            className="p-5 text-center"
            style={{ borderRadius: 12, border: "1px solid #E8E4DC", backgroundColor: "#fff" }}
          >
            <p className="text-2xl mb-2">💜</p>
            <p className="text-sm" style={{ color: "#999" }}>
              还没有收藏
            </p>
            <p className="text-xs mt-1" style={{ color: "#BBB" }}>
              在地图页收藏感兴趣的展品
            </p>
          </Card>
        ) : (
          <Card
            className="p-3"
            style={{ borderRadius: 12, border: "1px solid #E8E4DC", backgroundColor: "#fff" }}
          >
            <p className="text-sm" style={{ color: "#2C2C2C" }}>
              已收藏 {favorites.length} 件展品
            </p>
          </Card>
        )}
      </div>

      {/* 功能菜单 */}
      <div className="px-4 mt-4 mb-4">
        <h3
          className="mb-2.5 text-sm font-semibold"
          style={{ color: "#2C2C2C" }}
        >
          更多服务
        </h3>
        <Card style={{ borderRadius: 12, border: "1px solid #E8E4DC", backgroundColor: "#fff", overflow: "hidden" }}>
          {[
            { icon: Bell, label: "参观通知", sub: "获取最新展览资讯", badge: null },
            { icon: Settings, label: "设置", sub: "TTS语音、通知推送", badge: null },
          ].map((item, i) => (
            <button
              key={item.label}
              className="w-full flex items-center gap-3 p-3.5 text-left transition-colors"
              style={{
                borderBottom: i === 0 ? "1px solid #F0EDE8" : "none",
                color: "#2C2C2C",
              }}
            >
              <div
                className="flex items-center justify-center rounded-full shrink-0"
                style={{ width: 32, height: 32, backgroundColor: "#F5F3EF" }}
              >
                <item.icon size={14} style={{ color: "#6B9E8C" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ lineHeight: 1.3 }}>{item.label}</p>
                <p className="text-xs" style={{ color: "#999", lineHeight: 1.3 }}>{item.sub}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 shrink-0" />
            </button>
          ))}
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
