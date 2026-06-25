/**
 * types/amap.d.ts
 * 高德地图全局类型声明
 */

declare var AMap: any;
declare var AMapUI: any;

declare global {
  interface Window {
    AMap: typeof AMap;
    AMapUI: typeof AMapUI;
  }
}

export {};
