// stores/guide-store.ts
// Zustand 状态管理

import { create } from "zustand";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  artifactId?: string;
  timestamp: number;
}

export interface GuideState {
  // 导航状态
  activeTab: "home" | "guide" | "map" | "me";
  setActiveTab: (tab: GuideState["activeTab"]) => void;

  // AI 对话
  messages: ChatMessage[];
  addMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  clearMessages: () => void;
  isStreaming: boolean;
  setIsStreaming: (v: boolean) => void;

  // 地图状态
  currentFloor: number;
  setCurrentFloor: (floor: number) => void;
  currentHall: string | null;
  setCurrentHall: (hall: string | null) => void;

  // 语音状态
  ttsEnabled: boolean;
  setTtsEnabled: (v: boolean) => void;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;

  // 打卡状态
  checkins: Record<string, number>; // artifactId -> timestamp
  addCheckin: (artifactId: string) => void;

  // 收藏状态
  favorites: string[];
  toggleFavorite: (artifactId: string) => void;
}

export const useGuideStore = create<GuideState>((set) => ({
  activeTab: "home",
  setActiveTab: (tab) => set({ activeTab: tab }),

  messages: [],
  addMessage: (msg) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...msg,
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          timestamp: Date.now(),
        },
      ],
    })),
  clearMessages: () => set({ messages: [] }),
  isStreaming: false,
  setIsStreaming: (v) => set({ isStreaming: v }),

  currentFloor: 1,
  setCurrentFloor: (floor) => set({ currentFloor: floor }),
  currentHall: null,
  setCurrentHall: (hall) => set({ currentHall: hall }),

  ttsEnabled: true,
  setTtsEnabled: (v) => set({ ttsEnabled: v }),
  isPlaying: false,
  setIsPlaying: (v) => set({ isPlaying: v }),

  checkins: {},
  addCheckin: (artifactId) =>
    set((state) => ({
      checkins: { ...state.checkins, [artifactId]: Date.now() },
    })),

  favorites: [],
  toggleFavorite: (artifactId) =>
    set((state) => ({
      favorites: state.favorites.includes(artifactId)
        ? state.favorites.filter((id) => id !== artifactId)
        : [...state.favorites, artifactId],
    })),
}));