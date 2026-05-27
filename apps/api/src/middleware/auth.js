import jwt from 'jsonwebtoken';
import { apiError } from '../utils/http.js';
export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return apiError(res, 401, 'UNAUTHORIZED', 'Sesi login tidak valid');
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); return next(); }
  catch { return apiError(res, 401, 'UNAUTHORIZED', 'Sesi login tidak valid'); }
}
export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return apiError(res, 401, 'UNAUTHORIZED', 'Sesi login tidak valid');
    if (!roles.includes(req.user.role)) return apiError(res, 403, 'FORBIDDEN', 'Anda tidak memiliki akses ke modul ini');
    return next();
  };
}
