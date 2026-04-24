import { config } from "./config.js";

export function pathUrl(slug: string): string {
  return `${config.publicBaseUrl}/paths/${encodeURIComponent(slug)}`;
}

export function handoffUrl(token: string, pathSlug: string): string {
  const next = `/gateway?path=${encodeURIComponent(pathSlug)}`;
  return (
    `${config.publicBaseUrl}/auth/exchange` +
    `?t=${token}&next=${encodeURIComponent(next)}`
  );
}

export function videoEmbedUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname === "/watch") {
        const id = u.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (u.pathname.startsWith("/embed/")) return raw;
    }
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id && /^\d+$/.test(id)
        ? `https://player.vimeo.com/video/${id}`
        : null;
    }
    if (host === "player.vimeo.com") return raw;

    return raw;
  } catch {
    return null;
  }
}
