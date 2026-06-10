import { AfterViewInit, Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { FormsModule } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import * as L from "leaflet";
import { ApiService } from "./services/api.service";
import { SessionService } from "./services/session.service";
import { CategoryItem, LocationItem, NearbyReportItem, ReportItem, RouteItem, Session, ZoneItem, ZonePoint } from "./models/models";

type AuthMode = "login" | "register";
type AppView = "principal" | "catalogos";
type DrawMode = "zone" | "route" | "";
type ReportTargetType = "location" | "zone" | "route";
type PopupWindow = Window & {
  createLocationFromPopup?: () => Promise<void>;
  updateLocationFromPopup?: (id: string) => Promise<void>;
  deleteLocationFromPopup?: (id: string) => Promise<void>;
  updateZoneFromPopup?: (id: string) => Promise<void>;
  editZoneShapeFromPopup?: (id: string) => void;
  deleteZoneFromPopup?: (id: string) => Promise<void>;
  updateRouteFromPopup?: (id: string) => Promise<void>;
  editRouteShapeFromPopup?: (id: string) => void;
  deleteRouteFromPopup?: (id: string) => Promise<void>;
};

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css"
})
export class AppComponent implements AfterViewInit {
  session: Session | null = null;
  authMode: AuthMode = "login";
  authForm = { name: "", email: "", password: "" };
  activeView: AppView = "principal";
  loading = false;
  error = "";

  locations: LocationItem[] = [];
  zones: ZoneItem[] = [];
  routes: RouteItem[] = [];
  reports: ReportItem[] = [];
  categories: CategoryItem[] = [];
  nearbyReports: NearbyReportItem[] = [];
  searchName = "";
  searchResults: LocationItem[] = [];

  drawingMode: DrawMode = "";
  draftPoints: ZonePoint[] = [];
  zoneForm = { name: "", description: "", category: "" };
  routeForm = { name: "", description: "", category: "" };
  editingZoneId = "";
  editingRouteId = "";

  reportForm = {
    title: "",
    description: "",
    priority: "media",
    status: "pendiente",
    targetType: "location" as ReportTargetType,
    category: "",
    targetId: ""
  };
  editingReportId = "";

  categoryForm = {
    name: "",
    description: "",
    color: "#60a5fa",
    active: true
  };
  editingCategoryId = "";

  private map?: L.Map;
  private markersLayer?: L.LayerGroup;
  private zonesLayer?: L.LayerGroup;
  private routesLayer?: L.LayerGroup;
  private draftLayer?: L.Polygon | L.Polyline;
  private tempMarker?: L.Marker;

  constructor(
    private api: ApiService,
    private sessions: SessionService
  ) {
    this.session = this.sessions.currentSession;
    this.installPopupHandlers();

    if (this.session) {
      void this.loadAll();
    }
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  async submitAuth(): Promise<void> {
    this.error = "";
    this.loading = true;

    try {
      const session = this.authMode === "login"
        ? await firstValueFrom(this.api.login({ email: this.authForm.email, password: this.authForm.password }))
        : await firstValueFrom(this.api.register(this.authForm));

      this.sessions.save(session);
      this.session = session;
      await this.loadAll();
      setTimeout(() => this.initMap());
    } catch (error) {
      this.showError(error);
    } finally {
      this.loading = false;
    }
  }

  logout(): void {
    this.sessions.logout();
    this.session = null;
    this.map?.remove();
    this.map = undefined;
  }

  switchView(view: AppView): void {
    this.activeView = view;

    if (view === "principal") {
      setTimeout(() => {
        this.initMap();
        this.map?.invalidateSize();
        this.renderMapData();
      });
    }
  }

  async loadAll(): Promise<void> {
    if (!this.session) return;

    try {
      const [locations, zones, routes, reports, categories] = await Promise.all([
        firstValueFrom(this.api.getLocations()),
        firstValueFrom(this.api.getZones()),
        firstValueFrom(this.api.getRoutes()),
        firstValueFrom(this.api.getReports()),
        firstValueFrom(this.api.getCategories())
      ]);

      this.locations = locations;
      this.zones = zones;
      this.routes = routes;
      this.reports = reports;
      this.categories = categories;
      setTimeout(() => this.renderMapData());
    } catch (error) {
      this.showError(error);
    }
  }

  async searchLocations(): Promise<void> {
    try {
      this.searchResults = await firstValueFrom(this.api.searchLocations(this.searchName));
    } catch (error) {
      this.showError(error);
    }
  }

  focusLocation(location: LocationItem): void {
    this.switchView("principal");
    setTimeout(() => {
      this.map?.setView([location.latitude, location.longitude], 16);
      this.openLocationPopup(location);
    });
  }

  focusZone(zone: ZoneItem): void {
    this.switchView("principal");
    setTimeout(() => {
      const bounds = L.latLngBounds(zone.points.map((point) => [point.lat, point.lng]));
      this.map?.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      this.openZonePopup(zone);
    });
  }

  focusRoute(route: RouteItem): void {
    this.switchView("principal");
    setTimeout(() => {
      const bounds = L.latLngBounds(route.points.map((point) => [point.lat, point.lng]));
      this.map?.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      this.openRoutePopup(route);
    });
  }

  async loadNearbyReports(location: LocationItem): Promise<void> {
    try {
      this.nearbyReports = await firstValueFrom(
        this.api.getNearbyReports(location.latitude, location.longitude, 2)
      );
      this.focusLocation(location);
    } catch (error) {
      this.showError(error);
    }
  }

  startZoneDrawing(): void {
    this.drawingMode = "zone";
    this.draftPoints = [];
    this.zoneForm = { name: "", description: "", category: "" };
    this.editingZoneId = "";
    this.removeDraftLayer();
  }

  cancelZoneDrawing(): void {
    this.drawingMode = "";
    this.draftPoints = [];
    this.zoneForm = { name: "", description: "", category: "" };
    this.editingZoneId = "";
    this.removeDraftLayer();
  }

  async saveZone(): Promise<void> {
    if (!this.zoneForm.name.trim()) {
      alert("Escribe el nombre de la zona.");
      return;
    }

    if (this.draftPoints.length < 3) {
      alert("Marca minimo 3 puntos en el mapa.");
      return;
    }

    try {
      const payload = {
        name: this.zoneForm.name,
        description: this.zoneForm.description,
        category: this.zoneForm.category,
        points: this.draftPoints
      };

      if (this.editingZoneId) {
        await firstValueFrom(this.api.updateZone(this.editingZoneId, payload));
      } else {
        await firstValueFrom(this.api.createZone(payload));
      }
      this.cancelZoneDrawing();
      await this.loadAll();
    } catch (error) {
      this.showError(error);
    }
  }

  editZone(zone: ZoneItem): void {
    this.drawingMode = "zone";
    this.editingZoneId = zone._id;
    this.zoneForm = {
      name: zone.name,
      description: zone.description,
      category: zone.category?._id || ""
    };
    this.draftPoints = [...zone.points];
    this.renderDraftLayer();
    this.switchView("principal");
    this.scrollToMapToolbar();
  }

  async deleteZone(id: string): Promise<void> {
    if (!confirm("Eliminar colonia afectada?")) return;
    await firstValueFrom(this.api.deleteZone(id));
    await this.loadAll();
  }

  startRouteDrawing(): void {
    this.drawingMode = "route";
    this.draftPoints = [];
    this.routeForm = { name: "", description: "", category: "" };
    this.editingRouteId = "";
    this.removeDraftLayer();
  }

  cancelRouteDrawing(): void {
    this.drawingMode = "";
    this.draftPoints = [];
    this.routeForm = { name: "", description: "", category: "" };
    this.editingRouteId = "";
    this.removeDraftLayer();
  }

  async saveRoute(): Promise<void> {
    if (!this.routeForm.name.trim()) {
      alert("Escribe el nombre de la ruta.");
      return;
    }

    if (this.draftPoints.length < 2) {
      alert("Marca minimo 2 puntos en el mapa para la ruta.");
      return;
    }

    try {
      const payload = {
        name: this.routeForm.name,
        description: this.routeForm.description,
        category: this.routeForm.category,
        points: this.draftPoints
      };

      if (this.editingRouteId) {
        await firstValueFrom(this.api.updateRoute(this.editingRouteId, payload));
      } else {
        await firstValueFrom(this.api.createRoute(payload));
      }
      this.cancelRouteDrawing();
      await this.loadAll();
    } catch (error) {
      this.showError(error);
    }
  }

  editRoute(route: RouteItem): void {
    this.drawingMode = "route";
    this.editingRouteId = route._id;
    this.routeForm = {
      name: route.name,
      description: route.description,
      category: route.category?._id || ""
    };
    this.draftPoints = [...route.points];
    this.renderDraftLayer();
    this.switchView("principal");
    this.scrollToMapToolbar();
  }

  async deleteRoute(id: string): Promise<void> {
    if (!confirm("Eliminar ruta urbana?")) return;
    await firstValueFrom(this.api.deleteRoute(id));
    await this.loadAll();
  }

  async saveReport(): Promise<void> {
    try {
      const payload = {
        title: this.reportForm.title,
        description: this.reportForm.description,
        priority: this.reportForm.priority,
        status: this.reportForm.status,
        category: this.reportForm.category,
        targetType: this.reportForm.targetType,
        targetId: this.reportForm.targetId
      };

      if (this.editingReportId) {
        await firstValueFrom(this.api.updateReport(this.editingReportId, payload));
      } else {
        await firstValueFrom(this.api.createReport(payload));
      }
      this.resetReportForm();
      await this.loadAll();
    } catch (error) {
      this.showError(error);
    }
  }

  editReport(report: ReportItem): void {
    const targetType = report.targetType || (report.zone ? "zone" : report.route ? "route" : "location");
    this.editingReportId = report._id;
    this.reportForm = {
      title: report.title,
      description: report.description,
      priority: report.priority,
      status: report.status,
      targetType,
      category: report.category?._id || "",
      targetId: this.getReportTargetId(report)
    };
  }

  async deleteReport(id: string): Promise<void> {
    if (!confirm("Eliminar reporte?")) return;
    await firstValueFrom(this.api.deleteReport(id));
    await this.loadAll();
  }

  resetReportForm(): void {
    this.editingReportId = "";
    this.reportForm = {
      title: "",
      description: "",
      priority: "media",
      status: "pendiente",
      targetType: "location",
      category: "",
      targetId: ""
    };
  }

  onReportTargetTypeChange(): void {
    this.reportForm.targetId = "";
  }

  async saveCategory(): Promise<void> {
    try {
      if (this.editingCategoryId) {
        await firstValueFrom(this.api.updateCategory(this.editingCategoryId, this.categoryForm));
      } else {
        await firstValueFrom(this.api.createCategory(this.categoryForm));
      }
      this.resetCategoryForm();
      await this.loadAll();
    } catch (error) {
      this.showError(error);
    }
  }

  editCategory(category: CategoryItem): void {
    this.editingCategoryId = category._id;
    this.categoryForm = {
      name: category.name,
      description: category.description,
      color: category.color,
      active: category.active
    };
  }

  async deleteCategory(id: string): Promise<void> {
    if (!confirm("Eliminar categoria?")) return;
    await firstValueFrom(this.api.deleteCategory(id));
    await this.loadAll();
  }

  resetCategoryForm(): void {
    this.editingCategoryId = "";
    this.categoryForm = {
      name: "",
      description: "",
      color: "#60a5fa",
      active: true
    };
  }

  private initMap(): void {
    if (this.map || !this.session || this.activeView !== "principal") return;

    const node = document.getElementById("map");
    if (!node) return;

    this.map = L.map(node).setView([21.1219, -101.6826], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(this.map);

    this.markersLayer = L.layerGroup().addTo(this.map);
    this.zonesLayer = L.layerGroup().addTo(this.map);
    this.routesLayer = L.layerGroup().addTo(this.map);

    this.map.on("click", (event) => {
      if (this.drawingMode) {
        this.draftPoints = [...this.draftPoints, { lat: event.latlng.lat, lng: event.latlng.lng }];
        this.renderDraftLayer();
        return;
      }

      this.openNewLocationPopup(event.latlng.lat, event.latlng.lng);
    });

    this.renderMapData();
  }

  private renderMapData(): void {
    if (!this.map || !this.markersLayer || !this.zonesLayer || !this.routesLayer) return;

    this.markersLayer.clearLayers();
    this.zonesLayer.clearLayers();
    this.routesLayer.clearLayers();

    this.locations.forEach((location) => {
      L.marker([location.latitude, location.longitude], { icon: this.createMarkerIcon(this.getCategoryColor(location.category)) })
        .addTo(this.markersLayer as L.LayerGroup)
        .bindPopup(this.locationPopup(location));
    });

    this.zones.forEach((zone) => {
      const color = this.getCategoryColor(zone.category, "#2563eb");
      L.polygon(zone.points.map((point) => [point.lat, point.lng]), {
        color,
        fillColor: color,
        fillOpacity: 0.35,
        weight: 3
      })
        .addTo(this.zonesLayer as L.LayerGroup)
        .bindPopup(this.zonePopup(zone));
    });

    this.routes.forEach((route) => {
      const color = this.getCategoryColor(route.category, "#f97316");
      L.polyline(route.points.map((point) => [point.lat, point.lng]), {
        color,
        weight: 5
      })
        .addTo(this.routesLayer as L.LayerGroup)
        .bindPopup(this.routePopup(route));
    });
  }

  private openNewLocationPopup(lat: number, lng: number): void {
    if (!this.map) return;

    if (this.tempMarker) {
      this.map.removeLayer(this.tempMarker);
    }

    this.tempMarker = L.marker([lat, lng], { icon: this.createMarkerIcon() })
      .addTo(this.map)
      .bindPopup(`
        <div class="popup-form">
          <strong>Nuevo problema urbano</strong>
          <label>Nombre<input id="popup-new-name" placeholder="Ej. Bache en avenida"></label>
          <label>Descripcion<textarea id="popup-new-description" placeholder="Describe el problema visible"></textarea></label>
          <label>Categoria<select id="popup-new-category">${this.categoryOptions()}</select></label>
          <div class="popup-grid">
            <label>Latitud<input id="popup-new-lat" value="${lat.toFixed(6)}"></label>
            <label>Longitud<input id="popup-new-lng" value="${lng.toFixed(6)}"></label>
          </div>
          <button onclick="window.createLocationFromPopup()">Guardar problema</button>
        </div>
      `)
      .openPopup();
  }

  private locationPopup(location: LocationItem): string {
    const reports = this.reportSummary("location", location._id);
    return `
      <div class="popup-form">
        <strong>Editar problema urbano</strong>
        <label>Nombre<input id="popup-name-${location._id}" value="${this.escapeHtml(location.name)}"></label>
        <label>Descripcion<textarea id="popup-description-${location._id}">${this.escapeHtml(location.description)}</textarea></label>
        <label>Categoria<select id="popup-category-${location._id}">${this.categoryOptions(location.category?._id)}</select></label>
        <div class="popup-grid">
          <label>Latitud<input id="popup-lat-${location._id}" value="${Number(location.latitude).toFixed(6)}"></label>
          <label>Longitud<input id="popup-lng-${location._id}" value="${Number(location.longitude).toFixed(6)}"></label>
        </div>
        ${reports}
        <div class="popup-actions">
          <button onclick="window.updateLocationFromPopup('${location._id}')">Guardar</button>
          <button class="danger" onclick="window.deleteLocationFromPopup('${location._id}')">Eliminar</button>
        </div>
      </div>
    `;
  }

  private zonePopup(zone: ZoneItem): string {
    return `
      <div class="popup-form">
        <strong>Editar zona afectada</strong>
        <label>Nombre<input id="popup-zone-name-${zone._id}" value="${this.escapeHtml(zone.name)}"></label>
        <label>Descripcion<textarea id="popup-zone-description-${zone._id}">${this.escapeHtml(zone.description)}</textarea></label>
        <label>Categoria<select id="popup-zone-category-${zone._id}">${this.categoryOptions(zone.category?._id)}</select></label>
        <div class="popup-meta">
          <span>${zone.points.length} puntos delimitados</span>
        </div>
        ${this.reportSummary("zone", zone._id)}
        <div class="popup-actions">
          <button onclick="window.updateZoneFromPopup('${zone._id}')">Guardar</button>
          <button class="ghost" onclick="window.editZoneShapeFromPopup('${zone._id}')">Editar forma</button>
          <button class="danger" onclick="window.deleteZoneFromPopup('${zone._id}')">Eliminar</button>
        </div>
      </div>
    `;
  }

  private routePopup(route: RouteItem): string {
    return `
      <div class="popup-form">
        <strong>Editar ruta afectada</strong>
        <label>Nombre<input id="popup-route-name-${route._id}" value="${this.escapeHtml(route.name)}"></label>
        <label>Descripcion<textarea id="popup-route-description-${route._id}">${this.escapeHtml(route.description)}</textarea></label>
        <label>Categoria<select id="popup-route-category-${route._id}">${this.categoryOptions(route.category?._id)}</select></label>
        <div class="popup-meta">
          <span>${route.points.length} puntos trazados</span>
        </div>
        ${this.reportSummary("route", route._id)}
        <div class="popup-actions">
          <button onclick="window.updateRouteFromPopup('${route._id}')">Guardar</button>
          <button class="ghost" onclick="window.editRouteShapeFromPopup('${route._id}')">Editar trazo</button>
          <button class="danger" onclick="window.deleteRouteFromPopup('${route._id}')">Eliminar</button>
        </div>
      </div>
    `;
  }

  renderDraftLayer(): void {
    if (!this.map) return;

    this.removeDraftLayer();

    if (this.draftPoints.length > 0) {
      if (this.drawingMode === "route") {
        const color = this.getCategoryColor(this.findCategory(this.routeForm.category), "#f97316");
        this.draftLayer = L.polyline(this.draftPoints.map((point) => [point.lat, point.lng]), {
          color,
          weight: 5,
          dashArray: "8 6"
        }).addTo(this.map);
      } else {
        const color = this.getCategoryColor(this.findCategory(this.zoneForm.category), "#16a34a");
        this.draftLayer = L.polygon(this.draftPoints.map((point) => [point.lat, point.lng]), {
          color,
          fillColor: color,
          fillOpacity: 0.35,
          dashArray: "8 6"
        }).addTo(this.map);
      }
    }
  }

  private removeDraftLayer(): void {
    if (this.map && this.draftLayer) {
      this.map.removeLayer(this.draftLayer);
      this.draftLayer = undefined;
    }
  }

  private installPopupHandlers(): void {
    const popupWindow = window as PopupWindow;

    popupWindow.createLocationFromPopup = async () => {
      await this.createLocationFromPopup();
    };
    popupWindow.updateLocationFromPopup = async (id: string) => {
      await this.updateLocationFromPopup(id);
    };
    popupWindow.deleteLocationFromPopup = async (id: string) => {
      await this.deleteLocationFromPopup(id);
    };
    popupWindow.updateZoneFromPopup = async (id: string) => {
      await this.updateZoneFromPopup(id);
    };
    popupWindow.editZoneShapeFromPopup = (id: string) => {
      const zone = this.zones.find((item) => item._id === id);
      if (zone) this.editZone(zone);
    };
    popupWindow.deleteZoneFromPopup = async (id: string) => {
      await this.deleteZoneFromPopup(id);
    };
    popupWindow.updateRouteFromPopup = async (id: string) => {
      await this.updateRouteFromPopup(id);
    };
    popupWindow.editRouteShapeFromPopup = (id: string) => {
      const route = this.routes.find((item) => item._id === id);
      if (route) this.editRoute(route);
    };
    popupWindow.deleteRouteFromPopup = async (id: string) => {
      await this.deleteRouteFromPopup(id);
    };
  }

  private async createLocationFromPopup(): Promise<void> {
    const name = this.getInputValue("popup-new-name");
    const description = this.getInputValue("popup-new-description");
    const category = this.getInputValue("popup-new-category");
    const latitude = Number(this.getInputValue("popup-new-lat"));
    const longitude = Number(this.getInputValue("popup-new-lng"));

    await firstValueFrom(this.api.createLocation({ name, description, category, latitude, longitude }));
    if (this.map && this.tempMarker) {
      this.map.removeLayer(this.tempMarker);
      this.tempMarker = undefined;
    }
    await this.loadAll();
  }

  private async updateLocationFromPopup(id: string): Promise<void> {
    const name = this.getInputValue(`popup-name-${id}`);
    const description = this.getInputValue(`popup-description-${id}`);
    const category = this.getInputValue(`popup-category-${id}`);
    const latitude = Number(this.getInputValue(`popup-lat-${id}`));
    const longitude = Number(this.getInputValue(`popup-lng-${id}`));

    await firstValueFrom(this.api.updateLocation(id, { name, description, category, latitude, longitude }));
    await this.loadAll();
  }

  private async updateZoneFromPopup(id: string): Promise<void> {
    const zone = this.zones.find((item) => item._id === id);
    if (!zone) return;

    const name = this.getInputValue(`popup-zone-name-${id}`);
    const description = this.getInputValue(`popup-zone-description-${id}`);
    const category = this.getInputValue(`popup-zone-category-${id}`);

    await firstValueFrom(this.api.updateZone(id, { name, description, category }));
    await this.loadAll();
  }

  private async updateRouteFromPopup(id: string): Promise<void> {
    const route = this.routes.find((item) => item._id === id);
    if (!route) return;

    const name = this.getInputValue(`popup-route-name-${id}`);
    const description = this.getInputValue(`popup-route-description-${id}`);
    const category = this.getInputValue(`popup-route-category-${id}`);

    await firstValueFrom(this.api.updateRoute(id, { name, description, category }));
    await this.loadAll();
  }

  getReportTargetOptions(): Array<{ _id: string; name: string }> {
    if (this.reportForm.targetType === "zone") {
      return this.zones.map((zone) => ({ _id: zone._id, name: zone.name }));
    }

    if (this.reportForm.targetType === "route") {
      return this.routes.map((route) => ({ _id: route._id, name: route.name }));
    }

    return this.locations.map((location) => ({ _id: location._id, name: location.name }));
  }

  getReportTargetLabel(report: ReportItem): string {
    if (report.zone) return `Zona: ${report.zone.name}`;
    if (report.route) return `Ruta: ${report.route.name}`;
    if (report.location) return `Ubicacion: ${report.location.name}`;
    return "Sin destino";
  }

  getReportTargetTypeLabel(report: ReportItem): string {
    if (report.zone) return "Zona";
    if (report.route) return "Ruta";
    return "Punto";
  }

  getReportTargetPlaceholder(): string {
    if (this.reportForm.targetType === "zone") return "Selecciona zona";
    if (this.reportForm.targetType === "route") return "Selecciona ruta";
    return "Selecciona ubicacion exacta";
  }

  getCategoryName(category?: CategoryItem): string {
    return category?.name || "Sin categoria";
  }

  private getReportTargetId(report: ReportItem): string {
    if (report.zone) return report.zone._id;
    if (report.route) return report.route._id;
    return report.location?._id || "";
  }

  private scrollToMapToolbar(): void {
    setTimeout(() => {
      document.querySelector(".map-toolbar")?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  private openLocationPopup(location: LocationItem): void {
    if (!this.map) return;

    L.popup()
      .setLatLng([location.latitude, location.longitude])
      .setContent(this.locationPopup(location))
      .openOn(this.map);
  }

  private openZonePopup(zone: ZoneItem): void {
    if (!this.map) return;

    L.popup()
      .setLatLng(this.getShapeCenter(zone.points))
      .setContent(this.zonePopup(zone))
      .openOn(this.map);
  }

  private openRoutePopup(route: RouteItem): void {
    if (!this.map) return;

    L.popup()
      .setLatLng(this.getShapeCenter(route.points))
      .setContent(this.routePopup(route))
      .openOn(this.map);
  }

  private getShapeCenter(points: ZonePoint[]): L.LatLngExpression {
    const total = points.reduce((acc, point) => ({
      lat: acc.lat + point.lat,
      lng: acc.lng + point.lng
    }), { lat: 0, lng: 0 });

    return [total.lat / points.length, total.lng / points.length];
  }

  getReportsForTarget(type: ReportTargetType, id: string): ReportItem[] {
    return this.reports.filter((report) => {
      if (type === "location") return report.location?._id === id;
      if (type === "zone") return report.zone?._id === id;
      return report.route?._id === id;
    });
  }

  private reportSummary(type: ReportTargetType, id: string): string {
    const reports = this.getReportsForTarget(type, id);
    const title = reports.length === 1 ? "1 reporte asociado" : `${reports.length} reportes asociados`;
    const items = reports.length
      ? reports.map((report) => `<li>${this.escapeHtml(report.title)} <span>${this.escapeHtml(report.status)}</span></li>`).join("")
      : "<li>Sin reportes registrados para este elemento.</li>";

    return `
      <div class="popup-reports">
        <strong>${title}</strong>
        <ul>${items}</ul>
      </div>
    `;
  }

  private getCategoryColor(category?: CategoryItem, fallback = "#60a5fa"): string {
    return category?.color || fallback;
  }

  private findCategory(id: string): CategoryItem | undefined {
    return this.categories.find((category) => category._id === id);
  }

  private createMarkerIcon(color = "#60a5fa"): L.DivIcon {
    return L.divIcon({
      className: "geo-marker",
      html: `<span style="background:${this.escapeHtml(color)}"></span>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  }

  private categoryOptions(selected = ""): string {
    const empty = `<option value="">Sin categoria</option>`;
    const options = this.categories.map((category) => {
      const isSelected = category._id === selected ? " selected" : "";
      return `<option value="${this.escapeHtml(category._id)}"${isSelected}>${this.escapeHtml(category.name)}</option>`;
    });

    return [empty, ...options].join("");
  }

  private async deleteLocationFromPopup(id: string): Promise<void> {
    if (!confirm("Eliminar ubicacion?")) return;
    await firstValueFrom(this.api.deleteLocation(id));
    await this.loadAll();
  }

  private async deleteZoneFromPopup(id: string): Promise<void> {
    if (!confirm("Eliminar zona?")) return;
    await firstValueFrom(this.api.deleteZone(id));
    await this.loadAll();
  }

  private async deleteRouteFromPopup(id: string): Promise<void> {
    if (!confirm("Eliminar ruta?")) return;
    await firstValueFrom(this.api.deleteRoute(id));
    await this.loadAll();
  }

  private getInputValue(id: string): string {
    return (document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null)?.value || "";
  }

  private escapeHtml(value = ""): string {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  private showError(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      this.error = error.error?.message || error.message || "Ocurrio un error inesperado.";
      return;
    }

    this.error = error instanceof Error ? error.message : "Ocurrio un error inesperado.";
  }
}
