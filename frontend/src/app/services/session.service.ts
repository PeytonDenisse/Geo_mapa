import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Session } from "../models/models";

const SESSION_KEY = "geo_session";

@Injectable({
  providedIn: "root"
})
export class SessionService {
  private sessionSubject = new BehaviorSubject<Session | null>(this.loadSession());
  session$ = this.sessionSubject.asObservable();

  get currentSession(): Session | null {
    return this.sessionSubject.value;
  }

  save(session: Session): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this.sessionSubject.next(session);
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    this.sessionSubject.next(null);
  }

  private loadSession(): Session | null {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) as Session : null;
  }
}
