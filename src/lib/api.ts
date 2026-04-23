export async function fetchApi(endpoint: string, options?: RequestInit) {
  const base = ((import.meta as any).env?.VITE_API_BASE as string) || '';
  const slash = base.endsWith('/') ? '' : '/';
  const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = base ? `${base}${slash}${path}` : endpoint;

  return fetch(url, options);
}

export default fetchApi;
