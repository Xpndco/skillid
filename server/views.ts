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

  .stage-path {
    margin: 0 0 1.75rem;
    padding: 1.125rem;
    border: 1px solid var(--border);
    border-radius: 18px;
    background: var(--surface);
  }
  .stage-1-complete {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(0,0,0,0.035);
    border: 1px solid var(--border);
    opacity: .9;
  }
  .stage-1-complete .stage-check {
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: var(--success);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 900;
    line-height: 1;
  }
  .stage-1-complete .stage-1-text {
    font-size: 12px;
    font-weight: 700;
    color: var(--muted);
    letter-spacing: 0.02em;
  }
  .stage-path-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: .875rem;
  }
  .stage-path-steps {
    display: flex;
    align-items: stretch;
    gap: 10px;
  }
  .stage-step {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    padding: .75rem .875rem;
    border-radius: 14px;
    flex: 1;
    border: 1px solid var(--border);
    background: #fafbfc;
  }
  .stage-step.stage-next,
  .stage-step.stage-active {
    background: #eef3ff;
    border-color: #c5d6fa;
  }
  .stage-step.stage-completed {
    background: var(--success-bg);
    border-color: #c3e4ce;
  }
  .stage-step.stage-locked {
    background: var(--locked-bg);
    opacity: .7;
  }
  .stage-step .stage-icon {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.05);
    font-size: 14px;
    flex-shrink: 0;
  }
  .stage-step.stage-active .stage-icon,
  .stage-step.stage-next .stage-icon { background: rgba(31,111,235,0.14); }
  .stage-step.stage-completed .stage-icon { background: rgba(26,140,74,0.18); }
  .stage-step .stage-number {
    font-size: 11px;
    font-weight: 700;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .stage-step .stage-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
    line-height: 1.15;
  }
  .stage-step.stage-active .stage-title { color: var(--accent); }
  .stage-step.stage-completed .stage-title { color: var(--success); }
  .stage-step.stage-locked .stage-number,
  .stage-step.stage-locked .stage-title { color: var(--muted); }
  .stage-connector {
    align-self: center;
    width: 18px;
    height: 1px;
    background: var(--border);
    flex-shrink: 0;
  }
  @media (max-width: 640px) {
    .stage-path { padding: 14px; }
    .stage-path-steps { flex-direction: column; align-items: stretch; }
    .stage-connector { width: 1px; height: 12px; margin-left: 27px; }
    .stage-step { width: 100%; }
  }

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

  /* Skill ID Method — Dashboard */
  .progress-band {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.125rem 1.25rem;
    margin-bottom: 1rem;
  }
  .progress-counts {
    color: var(--muted);
    font-size: .95rem;
    margin-bottom: .625rem;
  }
  .progress-counts strong { color: var(--text); font-weight: 700; }
  .progress-bar-tri {
    display: flex;
    gap: 3px;
    height: 8px;
    border-radius: 99px;
    overflow: hidden;
  }
  .progress-bar-tri .seg { flex: 1; height: 100%; }
  .progress-bar-tri .seg-got { background: var(--success); }
  .progress-bar-tri .seg-needs { background: #d99025; }
  .progress-bar-tri .seg-untouched { background: #e3e6ec; }

  .next-card {
    background: #eef3ff;
    border: 1px solid #c5d6fa;
    border-radius: 12px;
    padding: 1.25rem;
    margin-bottom: 1.25rem;
  }
  .next-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: .5rem;
  }
  .next-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text);
    margin-bottom: .5rem;
  }
  .next-summary {
    color: var(--muted);
    margin: 0 0 1rem;
    font-size: .95rem;
  }
  .next-card p:last-child { margin-bottom: 0; }

  .item-list { display: flex; flex-direction: column; gap: 1rem; }
  .item-group {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: .5rem;
  }
  .item-group-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    padding: .5rem .75rem .25rem;
  }
  .item-row {
    display: grid;
    grid-template-columns: 32px 1fr auto;
    align-items: center;
    gap: 12px;
    padding: .75rem;
    border-radius: 10px;
    text-decoration: none;
    color: inherit;
    transition: background .12s ease;
  }
  .item-row:hover { background: #f4f6fa; }
  .item-row .item-badge {
    width: 28px; height: 28px;
    border-radius: 999px;
    display: flex; align-items: center; justify-content: center;
    background: #eceef2;
    color: var(--muted);
    font-weight: 700; font-size: .85rem;
  }
  .item-row .item-body { display: flex; flex-direction: column; min-width: 0; }
  .item-row .item-num { font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
  .item-row .item-title { font-size: 15px; font-weight: 600; color: var(--text); line-height: 1.25; }
  .item-row .item-action { font-size: .85rem; font-weight: 600; color: var(--accent); }

  .item-row.item-got .item-badge { background: var(--success); color: #fff; }
  .item-row.item-got .item-action { color: var(--muted); }
  .item-row.item-needs .item-badge { background: #d99025; color: #fff; }
  .item-row.item-needs .item-action { color: #c47a16; }

  /* Inside-item view */
  .back-link { color: var(--muted); text-decoration: none; font-size: .9rem; }
  .back-link:hover { color: var(--text); }
  .item-num-label {
    font-size: 11px; font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: var(--muted);
    margin: 0 0 .5rem;
  }
  .video {
    margin: 1rem 0 1.25rem;
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: 12px;
    overflow: hidden;
    background: #000;
  }
  .video iframe { width: 100%; height: 100%; border: 0; display: block; }
  .item-actions {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.125rem 1.25rem;
    margin-bottom: 1.25rem;
  }
  .train-instruction { margin: 0 0 .875rem; color: var(--muted); }
  .item-actions p:last-child { margin-bottom: 0; }

  .mark-form {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.125rem 1.25rem;
  }
  .mark-prompt {
    margin: 0 0 .875rem;
    font-weight: 600;
    color: var(--text);
  }
  .mark-buttons {
    display: flex;
    gap: .625rem;
    flex-wrap: wrap;
  }
  .btn-mark {
    border: 1px solid var(--border);
    color: var(--text);
    background: #fff;
    flex: 1 1 0;
    min-width: 8rem;
    text-align: center;
  }
  .btn-mark.mark-got { background: var(--success); color: #fff; border-color: var(--success); }
  .btn-mark.mark-got:hover { background: #166e3a; }
  .btn-mark.mark-needs:hover { background: #fff7e6; border-color: #f5d48a; }
  .btn-mark.mark-not-yet:hover { background: #f0f2f5; }
  .current-mark {
    display: inline-block;
    margin-top: 1rem;
    font-size: .85rem;
    font-weight: 600;
    color: var(--muted);
  }
  .current-mark.mark-got { color: var(--success); }
  .current-mark.mark-needs { color: #c47a16; }

  @media (max-width: 480px) {
    body { padding: 1.25rem .875rem 3rem; }
    .day-card.current .actions .cta { width: 100%; text-align: center; }
    .mark-buttons .btn-mark { width: 100%; }
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
  const parts: string[] = [];
  view.visible.forEach((stage, i) => {
    const isCurrent = stage === view.current;
    const status: StageStatus = isCurrent ? view.status : "locked";
    const icon = STAGE_STATUS_ICON[status];
    const label = STAGE_LABELS[stage];
    parts.push(`<div class="stage-step stage-${status}">
      <div class="stage-icon" aria-hidden="true">${icon}</div>
      <div>
        <div class="stage-number">Stage ${stage}</div>
        <div class="stage-title">${escapeHtml(label)}</div>
      </div>
    </div>`);
    if (i < view.visible.length - 1) {
      parts.push(`<div class="stage-connector" aria-hidden="true"></div>`);
    }
  });
  const stage1Pill =
    view.current === 2
      ? `<div class="stage-1-complete">
        <span class="stage-check" aria-hidden="true">✓</span>
        <span class="stage-1-text">Starting point selected</span>
      </div>`
      : "";
  return `<div class="stage-path" aria-label="Your development path">
    ${stage1Pill}
    <div class="stage-path-label">Your Development Path</div>
    <div class="stage-path-steps">${parts.join("")}</div>
  </div>`;
}
