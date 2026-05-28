export function getCompanyId(req) {
  const raw = req.body?.companyId ?? req.query?.companyId;
  if (Array.isArray(raw)) return raw[0]?.toString().trim() || undefined;
  return raw?.toString().trim() || undefined;
}

export function getCompanyWhere(req) {
  const companyId = getCompanyId(req);
  return companyId ? { companyId } : {};
}

export function withCompanyId(req, data) {
  const companyId = getCompanyId(req);
  return companyId ? { ...data, companyId } : data;
}
