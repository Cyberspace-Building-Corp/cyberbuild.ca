// ============================================
// CYBERBUILD.CA — Type Definitions
// ============================================

export interface Service {
  label: string;
  icon: string;
  iconColor: string;
  description: string;
  detail: string;
  tech: string[];
}

export type ServiceKey = 'database' | 'appdev' | 'cloud' | 'data' | 'architecture';
export type ServiceMap = Record<ServiceKey, Service>;

export interface GraphNode {
  key: ServiceKey;
  position: [number, number, number];
  radius: number;
}

export type GraphEdge = [number, number];

export interface CameraConfig {
  defaultPosition: [number, number, number];
  defaultTarget: [number, number, number];
  fov: number;
  overviewDistance: number;
  autoRotateSpeed: number;
  minDistance: number;
  maxDistance: number;
}

export interface GraphColors {
  meshBase: string;
  meshBright: string;
  meshDim: string;
  edge: string;
}

export interface GraphLayout {
  nodes: GraphNode[];
  edges: GraphEdge[];
  camera: CameraConfig;
  colors: GraphColors;
  particles: {
    sparkleCount: number;
    dustCount: number;
  };
}

export interface ContactInfo {
  company: string;
  email: string;
  website: string;
  portfolio: string;
  regions: string[];
  timezone: string;
}

export interface SearchResult {
  key: ServiceKey;
  type: 'tech' | 'desc' | 'detail';
  text: string;
  category: string;
  color: string;
}
