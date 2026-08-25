// Routes find-mee.com/p/:type/:id to the share-post Supabase Edge Function,
// which server-renders the page (Open Graph tags + deep link + store
// fallback) since GitHub Pages can only serve static files. Deployed as a
// Cloudflare Worker with a route on find-mee.com/p/* — every other path on
// the domain is left alone and continues to be served by GitHub Pages.

const SHARE_FUNCTION_URL = 'https://mwvtciffmvxjvdphezka.supabase.co/functions/v1/share-post';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean); // ['p', ':type', ':id']

    if (parts.length < 3) {
      return Response.redirect('https://find-mee.com/', 302);
    }

    const [, type, id] = parts;
    const target = new URL(SHARE_FUNCTION_URL);
    target.searchParams.set('type', type);
    target.searchParams.set('id', id);

    const upstream = await fetch(target.toString());
    const html = await upstream.text();
    // Buffer to text and set Content-Type explicitly rather than passing
    // upstream.headers through — Cloudflare was silently downgrading the
    // response to text/plain (plus an injected restrictive CSP) when the
    // header set was reused as-is, which made browsers show raw HTML source
    // instead of rendering the page.
    return new Response(html, {
      status: upstream.status,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  },
};
