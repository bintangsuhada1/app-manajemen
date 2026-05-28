import { apiUrl } from '@/lib/api';

export type Company = {
  id: string;
  name: string;
  code?: string;
  type: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  notes?: string;
};

export const ACTIVE_COMPANY_KEY = 'activeCompany';
export const ACTIVE_COMPANY_CHANGED_EVENT = 'active-company-changed';
export const COMPANIES_CHANGED_EVENT = 'companies-changed';
export const DEFAULT_COMPANY_ID = 'jurti';

export const companies: Company[] = [
  { id: 'jurti', name: 'PT Jurti Agung Mulia', type: 'Kontraktor Kelistrikan' },
  { id: 'sip', name: 'PT SIP', type: 'SLO / NIDI' },
  { id: 'intek', name: 'PT Intek', type: 'SLO / NIDI' },
  { id: 'panglima-bulang', name: 'Mangrove Panglima Bulang', type: 'Restoran / Wisata Kuliner' }
];

let cachedCompanies: Company[] | null = null;

function normalizeCompany(company: Company): Company {
  return {
    ...company,
    id: company.id.trim(),
    name: company.name.trim(),
    code: company.code?.trim() || company.id.trim().toUpperCase(),
    type: company.type?.trim() || '',
    address: company.address?.trim() || undefined,
    phone: company.phone?.trim() || undefined,
    email: company.email?.trim() || undefined,
    website: company.website?.trim() || undefined,
    notes: company.notes?.trim() || undefined
  };
}

export function getCompanies() {
  return cachedCompanies || companies;
}

export function setCompanyCache(nextCompanies: Company[]) {
  const normalized = nextCompanies.map(normalizeCompany);
  cachedCompanies = normalized;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(COMPANIES_CHANGED_EVENT, { detail: normalized }));
  }
  return normalized;
}

export const saveCompanies = setCompanyCache;

export function getCompanyById(id: string | null | undefined) {
  const availableCompanies = getCompanies();
  return availableCompanies.find((company) => company.id === id) || availableCompanies.find((company) => company.id === DEFAULT_COMPANY_ID) || companies[0];
}

export function getActiveCompany() {
  if (typeof window === 'undefined') return getCompanyById(DEFAULT_COMPANY_ID);

  const storedId = window.localStorage.getItem(ACTIVE_COMPANY_KEY);
  const company = getCompanyById(storedId);
  if (!storedId || storedId !== company.id) {
    window.localStorage.setItem(ACTIVE_COMPANY_KEY, company.id);
  }
  return company;
}

export function setActiveCompany(companyId: string) {
  if (typeof window === 'undefined') return getCompanyById(companyId);

  const company = getCompanyById(companyId);
  window.localStorage.setItem(ACTIVE_COMPANY_KEY, company.id);
  window.dispatchEvent(new CustomEvent(ACTIVE_COMPANY_CHANGED_EVENT, { detail: company }));
  return company;
}

export function getActiveCompanyId() {
  if (typeof window === 'undefined') return null;

  return window.localStorage.getItem(ACTIVE_COMPANY_KEY);
}

export function withActiveCompanyId(path: string, activeCompanyId = getActiveCompanyId()) {
  const companyId = activeCompanyId;
  if (!companyId) return path;

  const [pathname, query = ''] = path.split('?');
  const params = new URLSearchParams(query);
  params.set('companyId', companyId);
  return `${pathname}?${params.toString()}`;
}

function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchCompanies(token: string | null) {
  const response = await fetch(`${apiUrl}/api/companies`, {
    headers: authHeaders(token)
  });
  if (!response.ok) throw response;
  const data = await response.json() as Company[];
  return setCompanyCache(data);
}

export async function createCompany(token: string | null, company: Company) {
  const response = await fetch(`${apiUrl}/api/companies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token)
    },
    body: JSON.stringify(normalizeCompany(company))
  });
  if (!response.ok) throw response;
  const created = normalizeCompany(await response.json());
  setCompanyCache([...getCompanies().filter((item) => item.id !== created.id), created]);
  return created;
}

export async function updateCompany(token: string | null, companyId: string, company: Company) {
  const response = await fetch(`${apiUrl}/api/companies/${companyId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token)
    },
    body: JSON.stringify(normalizeCompany(company))
  });
  if (!response.ok) throw response;
  const updated = normalizeCompany(await response.json());
  setCompanyCache(getCompanies().map((item) => item.id === companyId ? updated : item));
  return updated;
}

export async function deleteCompany(token: string | null, companyId: string) {
  const response = await fetch(`${apiUrl}/api/companies/${companyId}`, {
    method: 'DELETE',
    headers: authHeaders(token)
  });
  if (!response.ok) throw response;
  setCompanyCache(getCompanies().filter((company) => company.id !== companyId));
}
