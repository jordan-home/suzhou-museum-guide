/**
 * lib/types.ts
 * 项目共用类型定义
 */

export interface FloorPlan {
  floor: number;
  name: string;
  description: string;
  center: [number, number];
  zoom: number;
  bounds: {
    sw: [number, number];
    ne: [number, number];
  };
  halls: Hall[];
  paths: PathSegment[];
}

export interface Hall {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  center: [number, number];
  radius: number;
  color: string;
  icon: string;
  artifacts: string[];
}

export interface PathSegment {
  from: [number, number];
  to: [number, number];
  label: string;
}

export interface Facility {
  id: string;
  name: string;
  position: [number, number];
  icon: string;
  type: string;
}

export interface FloorPlans {
  floors: FloorPlan[];
  facilities: Facility[];
}

export interface Artifact {
  id: string;
  name: string;
  nameEn?: string;
  era: string;
  year?: string;
  size?: string;
  hall: string;
  category: string;
  image?: string | null;
  description: string;
  descriptionEn?: string;
  tags: string[];
  highlights: string[];
}

export interface MuseumInfo {
  name: string;
  nameEn: string;
  address: string;
  tel: string;
  openHours: string;
  ticket: string;
  architect: string;
  openYear: number;
  designConcept: string;
  history: string;
  position: { lat: number; lng: number };
}

export interface HallInfo {
  id: string;
  name: string;
  subtitle: string;
  floor: number;
}
