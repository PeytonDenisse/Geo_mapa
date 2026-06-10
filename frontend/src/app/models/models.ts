export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Session {
  user: SessionUser;
  token: string;
}

export interface LocationItem {
  _id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category?: CategoryItem;
}

export interface ZonePoint {
  lat: number;
  lng: number;
}

export interface ZoneItem {
  _id: string;
  name: string;
  description: string;
  points: ZonePoint[];
  category?: CategoryItem;
}

export interface RouteItem {
  _id: string;
  name: string;
  description: string;
  points: ZonePoint[];
  category?: CategoryItem;
}

export interface ReportItem {
  _id: string;
  title: string;
  description: string;
  priority: "baja" | "media" | "alta";
  status: "pendiente" | "en_proceso" | "resuelto";
  targetType: "location" | "zone" | "route";
  category: CategoryItem;
  location?: LocationItem;
  zone?: ZoneItem;
  route?: RouteItem;
}

export interface CategoryItem {
  _id: string;
  name: string;
  description: string;
  color: string;
  active: boolean;
}

export interface NearbyReportItem {
  report: ReportItem;
  distanceKm: number;
}
