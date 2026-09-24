export class ApiError extends Error {
  constructor(
    public status: number,
    public data: any,
  ) {
    super(data?.error?.message || 'Unable to connect. Please try again.');
  }
}
export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch {
    throw new Error('Cannot reach Nexus. Check that the local server is running.');
  }
  const data = await response.json();
  if (!response.ok) throw new ApiError(response.status, data);
  return data;
}
export const post = <T = any>(
  path: string,
  body: unknown = {},
  headers: Record<string, string> = {},
) => api<T>(path, { method: 'POST', body: JSON.stringify(body), headers });
