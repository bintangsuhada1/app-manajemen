export type Company = {
  id: string;
  name: string;
  type: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  notes?: string;
};

export const ACTIVE_COMPANY_KEY = 'activeCompany';
export const COMPANIES_KEY = 'companies';
export const ACTIVE_COMPANY_CHANGED_EVENT = 'active-company-changed';
export const COMPANIES_CHANGED_EVENT = 'companies-changed';
export const DEFAULT_COMPANY_ID = 'jurti';

export const companies: Company[] = [
  { id: 'jurti', name: 'PT Jurti Agung Mulia', type: 'Kontraktor Kelistrikan' },
  { id: 'sip', name: 'PT SIP', type: 'SLO / NIDI' },
  { id: 'intek', name: 'PT Intek', type: 'SLO / NIDI' },
  { id: 'panglima-bulang', name: 'Mangrove Panglima Bulang', type: 'Restoran / Wisata Kuliner' }
];

function normalizeCompany(company: Company): Company {
  return {
    ...company,
    id: company.id.trim(),
    name: company.name.trim(),
    type: company.type.trim(),
    address: company.address?.trim() || undefined,
    phone: company.phone?.trim() || undefined,
    email: company.email?.trim() || undefined,
    website: company.website?.trim() || undefined,
    notes: company.notes?.trim() || undefined
  };
}

function readStoredCompanies() {
  if (typeof window === 'undefined') return null;

  try {
    const stored = window.localStorage.getItem(COMPANIES_KEY);
    if (!stored) return null;
    const parsed = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((company): company is Company => Boolean(company?.id && company?.name && company?.type)).map(normalizeCompany);
  } catch {
    return null;
  }
}

export function getCompanies() {
  return readStoredCompanies() || companies;
}

export function saveCompanies(nextCompanies: Company[]) {
  if (typeof window === 'undefined') return getCompanies();

  const normalized = nextCompanies.map(normalizeCompany);
  window.localStorage.setItem(COMPANIES_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(COMPANIES_CHANGED_EVENT, { detail: normalized }));
  return normalized;
}

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
