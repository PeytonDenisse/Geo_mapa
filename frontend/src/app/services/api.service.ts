import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";
import { CategoryItem, LocationItem, NearbyReportItem, ReportItem, RouteItem, Session, ZoneItem } from "../models/models";

@Injectable({
  providedIn: "root"
})
export class ApiService {
  private apiUrl = environment.apiUrl || this.resolveApiUrl();

  constructor(private http: HttpClient) {}

  private resolveApiUrl(): string {
    if (typeof window !== "undefined" && window.location.hostname === "localhost") {
      return "http://localhost:4000/api";
    }

    return "/api";
  }

  register(data: { name: string; email: string; password: string }): Observable<Session> {
    return this.http.post<Session>(`${this.apiUrl}/auth/register`, data);
  }

  login(data: { email: string; password: string }): Observable<Session> {
    return this.http.post<Session>(`${this.apiUrl}/auth/login`, data);
  }

  getLocations(): Observable<LocationItem[]> {
    return this.http.get<LocationItem[]>(`${this.apiUrl}/locations`);
  }

  searchLocations(name: string): Observable<LocationItem[]> {
    return this.http.get<LocationItem[]>(`${this.apiUrl}/locations/search?name=${encodeURIComponent(name)}`);
  }

  createLocation(data: Record<string, unknown>): Observable<LocationItem> {
    return this.http.post<LocationItem>(`${this.apiUrl}/locations`, data);
  }

  updateLocation(id: string, data: Record<string, unknown>): Observable<LocationItem> {
    return this.http.patch<LocationItem>(`${this.apiUrl}/locations/${id}`, data);
  }

  deleteLocation(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/locations/${id}`);
  }

  getZones(): Observable<ZoneItem[]> {
    return this.http.get<ZoneItem[]>(`${this.apiUrl}/zones`);
  }

  createZone(data: Record<string, unknown>): Observable<ZoneItem> {
    return this.http.post<ZoneItem>(`${this.apiUrl}/zones`, data);
  }

  updateZone(id: string, data: Record<string, unknown>): Observable<ZoneItem> {
    return this.http.patch<ZoneItem>(`${this.apiUrl}/zones/${id}`, data);
  }

  deleteZone(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/zones/${id}`);
  }

  getRoutes(): Observable<RouteItem[]> {
    return this.http.get<RouteItem[]>(`${this.apiUrl}/routes`);
  }

  createRoute(data: Record<string, unknown>): Observable<RouteItem> {
    return this.http.post<RouteItem>(`${this.apiUrl}/routes`, data);
  }

  updateRoute(id: string, data: Record<string, unknown>): Observable<RouteItem> {
    return this.http.patch<RouteItem>(`${this.apiUrl}/routes/${id}`, data);
  }

  deleteRoute(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/routes/${id}`);
  }

  getReports(): Observable<ReportItem[]> {
    return this.http.get<ReportItem[]>(`${this.apiUrl}/reports`);
  }

  getNearbyReports(lat: number, lng: number, radiusKm = 2): Observable<NearbyReportItem[]> {
    return this.http.get<NearbyReportItem[]>(
      `${this.apiUrl}/reports/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`
    );
  }

  createReport(data: Record<string, unknown>): Observable<ReportItem> {
    return this.http.post<ReportItem>(`${this.apiUrl}/reports`, data);
  }

  updateReport(id: string, data: Record<string, unknown>): Observable<ReportItem> {
    return this.http.patch<ReportItem>(`${this.apiUrl}/reports/${id}`, data);
  }

  deleteReport(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/reports/${id}`);
  }

  getCategories(): Observable<CategoryItem[]> {
    return this.http.get<CategoryItem[]>(`${this.apiUrl}/categories`);
  }

  createCategory(data: Record<string, unknown>): Observable<CategoryItem> {
    return this.http.post<CategoryItem>(`${this.apiUrl}/categories`, data);
  }

  updateCategory(id: string, data: Record<string, unknown>): Observable<CategoryItem> {
    return this.http.patch<CategoryItem>(`${this.apiUrl}/categories/${id}`, data);
  }

  deleteCategory(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/categories/${id}`);
  }
}
