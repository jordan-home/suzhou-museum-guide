/**
 * lib/amap.ts
 * 高德地图 JS API v2 初始化封装
 */

declare global {
  interface Window {
    AMap: typeof AMap;
    AMapUI: typeof AMapUI;
  }
}

// 高德地图 JS API 地址（带 UI 组件库）
export const AMAP_JS_API_URL =
  "https://webapi.amap.com/maps?v=2.0&key=" +
  (process.env.NEXT_PUBLIC_AMAP_KEY || "") +
  "&plugin=AMap.Scale,AMap.ToolBar";

export const AMAP_UI_URL = "https://webapi.amap.com/ui/1.1/main.js";

// 加载脚本到 document
function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

// 确保 AMap 和 AMapUI 已加载
let loadPromise: Promise<void> | null = null;

export async function loadAmap(): Promise<{ AMap: typeof AMap; AMapUI: typeof AMapUI }> {
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    await loadScript(AMAP_JS_API_URL, "amap-jsapi");
    // 等待 AMap 全局对象就绪
    await new Promise<void>((resolve) => {
      const check = () => {
        if (typeof window.AMap !== "undefined") resolve();
        else setTimeout(check, 50);
      };
      check();
    });

    // 加载 AMapUI（可选，用于简化标注点等）
    try {
      await loadScript(AMAP_UI_URL, "amap-ui");
    } catch {
      console.warn("[amap] AMapUI load failed, continuing without it");
    }
  })();

  return loadPromise;
}

// 苏州博物馆中心坐标（高德坐标系）
export const MUSEUM_CENTER: [number, number] = [120.6501, 31.3235];
export const MUSEUM_ZOOM = 17;

// 楼层 → 显示名称映射
export const FLOOR_NAMES: Record<number, string> = {
  1: "一层",
  2: "二层",
  3: "三层",
};
