const BASE = import.meta.env.VITE_API_BASE;

export async function createShortUrl({ url, validity, shortcode }) {
  const res = await fetch(`${BASE}/shorturls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, validity, shortcode })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create short URL');
  return data; 
}
export async function getStats(code) {
  const res = await fetch(`${BASE}/shorturls/${encodeURIComponent(code)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch stats');
  return data;
}
