import { HttpInterceptorFn } from "@angular/common/http";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const raw = localStorage.getItem("geo_session");
  const session = raw ? JSON.parse(raw) : null;

  if (!session?.token) {
    return next(req);
  }

  return next(req.clone({
    setHeaders: {
      Authorization: `Bearer ${session.token}`
    }
  }));
};
