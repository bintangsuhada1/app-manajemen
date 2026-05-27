import { apiUrl } from '@/lib/api';

export async function downloadProtectedFile(
  path: string,
  filename: string,
  token: string | null,
  onUnauthorized: () => void,
  onForbidden?: () => void
) {
  const response = await fetch(`${apiUrl}/api${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });
  if (response.status === 401) {
    onUnauthorized();
    return;
  }
  if (response.status === 403) {
    onForbidden?.();
    return;
  }
  if (!response.ok) return;
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}
