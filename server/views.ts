import type { StageStatus, StageView } from "./entitlements.js";

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function layout(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  :root {
    --bg: #f6f7f9;
    --surface: #ffffff;
    --border: #e4e6eb;
    --text: #111418;
    --muted: #5c6470;
    --accent: #1f6feb;
    --accent-hover: #1a5fcc;
    --success: #1a8c4a;
    --success-bg: #eaf6ef;
    --locked-bg: #f1f2f4;
  }
  * { box-sizing: border-box; }
  body {
    font: 16px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    max-width: 760px;
    margin: 0 auto;
    padding: 2rem 1.25rem 4rem;
    color: var(--text);
    background: var(--bg);
  }
  h1 { font-size: 1.75rem; margin: 0 0 .25rem; letter-spacing: -0.01em; }
  .tagline { color: var(--muted); margin: 0 0 1.5rem; }

  .cta {
    display: inline-block;
    background: var(--text);
    color: #fff;
    padding: .75rem 1.25rem;
    border-radius: 8px;
    text-decoration: none;
    border: 0;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  .cta:hover { background: #000; }
  .cta:disabled { background: #999; cursor: not-allowed; }

  .btn-primary {
    background: var(--accent);
  }
  .btn-primary:hover { background: var(--accent-hover); }
  .btn-secondary {
    background: #fff;
    color: var(--text);
    border: 1px solid var(--border);
  }
  .btn-secondary:hover { background: #f0f2f5; }

  /* Challenge header */
  .challenge-header {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.25rem;
  }
  .progress-meta {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: .75rem;
  }
  .progress-meta .label {
    font-size: .85rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .08em;
    font-weight: 600;
  }
  .progress-meta .pct {
    font-size: .9rem;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
  .day-counter {
    font-size: 1.15rem;
    font-weight: 600;
    margin: 0 0 .75rem;
  }
  .progress-bar {
    height: 8px;
    background: #eceef2;
    border-radius: 99px;
    overflow: hidden;
  }
  .progress-bar .fill {
    height: 100%;
    background: var(--accent);
    border-radius: 99px;
    transition: width .2s ease;
  }
  .progress-bar.complete .fill { background: var(--success); }

  /* Day cards */
  .days { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: .625rem; }
  .day-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 1rem 1.125rem;
    display: flex;
    gap: 1rem;
    align-items: flex-start;
  }
  .day-card .badge {
    flex: 0 0 auto;
    width: 32px;
    height: 32px;
    border-radius: 999px;
    background: #eceef2;
    color: var(--muted);
    display: grid;
    place-items: center;
    font-weight: 700;
    font-size: .85rem;
    font-variant-numeric: tabular-nums;
  }
  .day-card .body { flex: 1 1 auto; min-width: 0; }
  .day-card .title { font-weight: 600; margin: 0 0 .15rem; }
  .day-card .summary { color: var(--muted); margin: 0; font-size: .95rem; }
  .day-card .status { flex: 0 0 auto; color: var(--muted); font-size: .85rem; font-weight: 600; align-self: center; }

  .day-card.done {
    background: var(--success-bg);
    border-color: #c3e4ce;
  }
  .day-card.done .badge { background: var(--success); color: #fff; }
  .day-card.done .status { color: var(--success); }

  .day-card.locked {
    background: var(--locked-bg);
    opacity: .7;
  }
  .day-card.locked .title { color: var(--muted); }

  .day-card.current {
    background: var(--surface);
    border: 2px solid var(--accent);
    padding: 1.25rem;
    flex-direction: column;
    box-shadow: 0 1px 2px rgba(31,111,235,.08), 0 4px 16px rgba(31,111,235,.08);
  }
  .day-card.current .top {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    width: 100%;
  }
  .day-card.current .badge { background: var(--accent); color: #fff; }
  .day-card.current .title { font-size: 1.1rem; }
  .day-card.current .actions {
    display: flex;
    gap: .625rem;
    margin-top: 1rem;
    flex-wrap: wrap;
  }
  .day-card.current .actions form { margin: 0; }
  .day-card.current .video {
    margin-top: 1rem;
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: 8px;
    overflow: hidden;
    background: #000;
  }
  .day-card.current .video iframe {
    width: 100%;
    height: 100%;
    border: 0;
    display: block;
  }

  .guide-copy {
    background: #f2f6ff;
    border: 1px solid #cfdcff;
    border-radius: 10px;
    padding: .875rem 1rem;
    color: #1a3b80;
    margin: 0 0 1rem;
  }

  .access-msg {
    background: #fff7e6;
    border: 1px solid #f5d48a;
    border-radius: 10px;
    padding: 1rem 1.125rem;
    color: #7a4f00;
  }
  .access-msg p { margin: 0 0 .75rem; }
  .access-msg p:last-child { margin-bottom: 0; }

  .completed-banner {
    background: var(--success-bg);
    border: 1px solid #c3e4ce;
    border-radius: 10px;
    padding: 1rem 1.125rem;
    margin-bottom: 1.25rem;
    color: var(--success);
    font-weight: 600;
  }

  .stage-bar {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: .75rem 1rem;
    margin-bottom: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: .125rem;
  }
  .stage-bar .stage {
    display: grid;
    grid-template-columns: 1.5rem 5rem 1fr;
    align-items: center;
    padding: .375rem 0;
    font-size: .92rem;
  }
  .stage-bar .stage-icon { text-align: center; }
  .stage-bar .stage-num { font-weight: 600; color: var(--muted); }
  .stage-bar .stage-label { color: var(--muted); }
  .stage-bar .stage-current .stage-num,
  .stage-bar .stage-current .stage-label { color: var(--text); }
  .stage-bar .stage-current.stage-active .stage-label { color: var(--accent); font-weight: 600; }
  .stage-bar .stage-current.stage-completed .stage-label { color: var(--success); font-weight: 600; }
  .stage-bar .stage-current.stage-next .stage-label { font-weight: 600; }

  .completion-block {
    background: var(--success-bg);
    border: 1px solid #c3e4ce;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.25rem;
  }
  .completion-block h2 {
    color: var(--success);
    margin: 0 0 1rem;
    font-size: 1.35rem;
    letter-spacing: -0.01em;
  }
  .completion-block p { margin: 0; }

  @media (max-width: 480px) {
    body { padding: 1.25rem .875rem 3rem; }
    .day-card.current .actions .cta { width: 100%; text-align: center; }
  }
</style>
</head>
<body>
${body}
</body>
</html>`;
}

const STAGE_LABELS: Record<2 | 3 | 4, string> = {
  2: "Guided Challenge",
  3: "Structured Training",
  4: "Skill Plus",
};

const STAGE_STATUS_ICON: Record<StageStatus, string> = {
  next: "⏭",
  active: "🔄",
  completed: "✅",
  locked: "🔒",
};

export function renderStageBar(view: StageView): string {
  const items = view.visible
    .map((stage) => {
      const isCurrent = stage === view.current;
      const status: StageStatus = isCurrent ? view.status : "locked";
      const icon = STAGE_STATUS_ICON[status];
      const label = STAGE_LABELS[stage];
      const cls = `stage stage-${status}${isCurrent ? " stage-current" : ""}`;
      return `<div class="${cls}">
        <span class="stage-icon" aria-hidden="true">${icon}</span>
        <span class="stage-num">Stage ${stage}</span>
        <span class="stage-label">${escapeHtml(label)}</span>
      </div>`;
    })
    .join("");
  return `<div class="stage-bar" aria-label="Your development path">${items}</div>`;
}
