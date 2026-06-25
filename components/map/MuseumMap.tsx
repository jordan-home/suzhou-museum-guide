"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useGuideStore } from "@/stores/guide-store";
import { loadAmap, MUSEUM_CENTER, MUSEUM_ZOOM } from "@/lib/amap";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FloorPlans, Hall } from "@/lib/types";


// 高德地图室内地图楼层样式（模拟）
const FLOOR_COLORS: Record<number, string> = {
  1: "#6B9E8C",
  2: "#8B6914",
};

interface Props {
  onHallSelect?: (hall: Hall | null) => void;
}

export function MuseumMap({ onHallSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);

  const { currentFloor, setCurrentFloor, setCurrentHall } = useGuideStore();
  const [floorData, setFloorData] = useState<FloorPlans | null>(null);
  const [selectedHall, setSelectedHall] = useState<Hall | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 加载楼层配置
  useEffect(() => {
    fetch("/data/floor-plans.json")
      .then((r) => r.json())
      .then(setFloorData)
      .catch((e) => console.error("[map] floor plans load error:", e));
  }, []);

  // 初始化地图
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let mounted = true;

    loadAmap()
      .then(({ AMap }) => {
        if (!mounted || !containerRef.current) return;

        const map = new AMap.Map(containerRef.current, {
          zoom: MUSEUM_ZOOM,
          center: MUSEUM_CENTER,
          mapStyle: "amap://styles/whitesmoke",
          viewMode: "2D",
          zoomEnable: true,
          dragEnable: true,
        });

        mapRef.current = map;

        // 添加比例尺和工具条
        AMap.plugin(["AMap.Scale", "AMap.ToolBar"], () => {
          map.addControl(new AMap.Scale());
          map.addControl(
            new AMap.ToolBar({ position: "RB", hideLine: true, hideZoomBar: true })
          );
        });

        // 创建信息窗体
        infoWindowRef.current = new AMap.InfoWindow({
          offset: new AMap.Pixel(0, -30),
          closeWhenClickMap: true,
        });

        setMapLoaded(true);
      })
      .catch((err) => {
        console.error("[map] AMap load error:", err);
        setLoadError("地图加载失败，请检查高德 API Key");
      });

    return () => {
      mounted = false;
    };
  }, []);

  // 切换楼层时更新标注点
  useEffect(() => {
    if (!mapRef.current || !floorData || !mapLoaded) return;
    updateMarkers(currentFloor);
  }, [currentFloor, floorData, mapLoaded]);

  const updateMarkers = useCallback(
    (floor: number) => {
      const AMap = (window as any).AMap;
      const map = mapRef.current;
      if (!map || !AMap || !floorData) return;

      // 清除旧标注
      markersRef.current.forEach((m) => map.remove(m));
      markersRef.current = [];

      const floorPlan = floorData.floors.find((f) => f.floor === floor);
      if (!floorPlan) return;

      // 绘制展厅圆形区域 + 标注
      floorPlan.halls.forEach((hall) => {
        // 展厅圆形区域（用 CircleMarker 模拟）
        const circle = new AMap.CircleMarker({
          center: hall.center,
          radius: hall.radius * 0.3,
          strokeWeight: 2,
          strokeColor: hall.color,
          fillColor: hall.color,
          fillOpacity: 0.15,
          extData: hall,
        });

        circle.on("click", () => {
          setSelectedHall(hall);
          setCurrentHall(hall.name);
          onHallSelect?.(hall);

          if (infoWindowRef.current) {
            const artifactIds = hall.artifacts || [];
            const info = `
              <div style="font-family:'Noto Sans SC',sans-serif;padding:8px;min-width:200px">
                <div style="font-size:15px;font-weight:600;margin-bottom:4px">${hall.icon} ${hall.name}</div>
                <div style="font-size:12px;color:#888;margin-bottom:6px">${hall.subtitle}</div>
                ${artifactIds.length > 0 ? `<div style="font-size:11px;color:#6B9E8C">含 ${artifactIds.length} 件文物</div>` : ""}
              </div>
            `;
            infoWindowRef.current.setContent(info);
            infoWindowRef.current.open(map, hall.center);
          }
        });

        map.add(circle);
        markersRef.current.push(circle);

        // 展厅文字标签
        const text = new AMap.Text({
          text: hall.name,
          textAlign: "center",
          strokeColor: "#fff",
          strokeWidth: 2,
          fillColor: hall.color,
          fontSize: 12,
          fontFamily: "Noto Sans SC, sans-serif",
          position: hall.center,
          offset: new AMap.Pixel(0, -hall.radius * 0.3 - 8),
          extData: hall,
        });

        text.on("click", () => {
          setSelectedHall(hall);
          setCurrentHall(hall.name);
          onHallSelect?.(hall);
        });

        map.add(text);
        markersRef.current.push(text);
      });

      // 绘制设施点
      floorData.facilities.forEach((facility) => {
        const marker = new AMap.Marker({
          position: facility.position,
          icon:
            `<div style="font-size:20px;text-align:center;line-height:24px">${facility.icon}</div>` as any,
          extData: facility,
          title: facility.name,
        });

        marker.on("click", () => {
          if (infoWindowRef.current) {
            infoWindowRef.current.setContent(
              `<div style="font-family:'Noto Sans SC',sans-serif;padding:6px"><b>${facility.name}</b></div>`
            );
            infoWindowRef.current.open(map, facility.position);
          }
        });

        map.add(marker);
        markersRef.current.push(marker);
      });
    },
    [floorData, onHallSelect, setCurrentHall]
  );

  const handleFloorChange = (floor: number) => {
    setCurrentFloor(floor);
    setSelectedHall(null);
    setCurrentHall(null);
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }
  };

  const currentFloorData = floorData?.floors.find((f) => f.floor === currentFloor);

  return (
    <div className="flex flex-col h-full">
      {/* 楼层选择器 */}
      <div className="px-4 py-3 bg-white border-b" style={{ borderColor: "var(--szm-gray)" }}>
        <Tabs
          value={String(currentFloor)}
          onValueChange={(v) => handleFloorChange(Number(v))}
        >
          <TabsList className="grid w-full grid-cols-2">
            {floorData?.floors.map((f) => (
              <TabsTrigger key={f.floor} value={String(f.floor)}>
                {f.name}
              </TabsTrigger>
            )) || (
              <>
                <TabsTrigger value="1">一层</TabsTrigger>
                <TabsTrigger value="2">二层</TabsTrigger>
              </>
            )}
          </TabsList>
        </Tabs>
        {currentFloorData && (
          <p className="text-xs mt-2" style={{ color: "#888" }}>
            {currentFloorData.description}
          </p>
        )}
      </div>

      {/* 地图容器 */}
      <div
        ref={containerRef}
        className="relative flex-1"
        style={{ minHeight: 300 }}
      >
        {!mapLoaded && !loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="text-3xl mb-2">🗺️</div>
              <p className="text-sm" style={{ color: "#888" }}>
                地图加载中...
              </p>
            </div>
          </div>
        )}

        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center px-6">
              <div className="text-3xl mb-2">⚠️</div>
              <p className="text-sm text-red-500">{loadError}</p>
              <p className="text-xs mt-1" style={{ color: "#aaa" }}>
                请确认 NEXT_PUBLIC_AMAP_KEY 已正确配置
              </p>
            </div>
          </div>
        )}

        {/* 地图说明浮层 */}
        {mapLoaded && (
          <div
            className="absolute top-3 left-3 z-10"
            style={{ pointerEvents: "none" }}
          >
            <Badge
              variant="outline"
              className="text-xs bg-white shadow-sm"
              style={{ borderColor: "var(--szm-blue)", color: "var(--szm-blue)" }}
            >
              🗺️ 点击展厅查看详情
            </Badge>
          </div>
        )}
      </div>

      {/* 展厅列表面板 */}
      {currentFloorData && (
        <div
          className="bg-white border-t"
          style={{ borderColor: "var(--szm-gray)", maxHeight: 200 }}
        >
          <div className="px-4 py-2 border-b" style={{ borderColor: "var(--szm-gray)" }}>
            <span className="text-xs font-medium" style={{ color: "#666" }}>
              本层展厅
            </span>
          </div>
          <ScrollArea className="h-36">
            <div className="p-3 flex flex-col gap-2">
              {currentFloorData.halls.map((hall) => (
                <Card
                  key={hall.id}
                  className={`p-3 cursor-pointer transition-all ${
                    selectedHall?.id === hall.id ? "ring-2" : ""
                  }`}
                  style={{
                    borderRadius: "var(--szm-radius, 8px)",
                    border:
                      selectedHall?.id === hall.id
                        ? `2px solid ${hall.color}`
                        : "1px solid var(--szm-gray)",
                    ...(selectedHall?.id === hall.id ? { backgroundColor: `${hall.color}10` } : {}),
                  }}
                  onClick={() => {
                    setSelectedHall(hall);
                    setCurrentHall(hall.name);
                    onHallSelect?.(hall);
                    // 地图中心移到该展厅
                    if (mapRef.current) {
                      mapRef.current.setCenter(hall.center);
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{hall.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-sm font-semibold"
                        style={{ fontFamily: "var(--font-serif, serif)" }}
                      >
                        {hall.name}
                      </div>
                      <div className="text-xs" style={{ color: "#888" }}>
                        {hall.subtitle}
                      </div>
                    </div>
                    {hall.artifacts && (
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{ fontSize: 10 }}
                      >
                        {hall.artifacts.length}件
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
