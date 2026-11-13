// Shared rendered contrast/overflow probe from SBS-0007, unchanged algorithm.
export function inspectRenderedPage() {
  const width = document.documentElement.clientWidth;
  const scrollWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const styles = new Map();
  const style = (el) => styles.get(el) ?? (styles.set(el, getComputedStyle(el)), styles.get(el));
  const colorCache = new Map();
  function color(css) {
    if (colorCache.has(css)) return colorCache.get(css);
    if (!ctx || !CSS.supports("color", css)) return null;
    // A rejected Canvas color leaves fillStyle unchanged: two sentinels detect that.
    ctx.fillStyle = "#010203"; ctx.fillStyle = css; const first = ctx.fillStyle;
    ctx.fillStyle = "#fdfcfb"; ctx.fillStyle = css; const second = ctx.fillStyle;
    if (first !== second) return null;
    ctx.clearRect(0, 0, 1, 1); ctx.fillRect(0, 0, 1, 1);
    const pixels = ctx.getImageData(0, 0, 1, 1).data;
    const result = [pixels[0] / 255, pixels[1] / 255, pixels[2] / 255, pixels[3] / 255];
    colorCache.set(css, result);
    return result;
  }
  function over(front, back) {
    const alpha = front[3] + back[3] * (1 - front[3]);
    if (alpha === 0) return [0, 0, 0, 0];
    return [0, 1, 2].map((i) => (front[i] * front[3] + back[i] * back[3] * (1 - front[3])) / alpha).concat(alpha);
  }
  const luminance = (c) => c.slice(0, 3).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  const rgb = (c) => c.slice(0, 3).map((v) => Math.round(v * 255));
  const selector = (el) => el.id ? `${el.tagName.toLowerCase()}#${el.id}` : `${el.tagName.toLowerCase()}${el.getAttribute("role") ? `[role=${el.getAttribute("role")}]` : ""}.${[...el.classList].slice(0, 4).join(".")}`;
  function visible(el) {
    if (!el.getClientRects().length) return false;
    for (let node = el; node; node = node.parentElement) {
      const s = style(node);
      if (s.display === "none" || s.visibility !== "visible" || Number(s.opacity) === 0 || node.hidden) return false;
      // Only visually clipped assistive text is excluded; aria-hidden hints may still be visible.
      if ((s.clip !== "auto" && s.clip !== "rect(auto, auto, auto, auto)") || s.clipPath === "inset(50%)") return false;
    }
    return true;
  }
  const pairs = [];
  const unsupported = [];
  const exclusions = { disabled: 0, hiddenOrClipped: 0, inactiveModalUnderlay: 0 };
  const modal = document.querySelector('[role="dialog"][data-state="open"],dialog[open],#overlay:not([hidden]) [role="dialog"]');
  function inspectText(el, text, pseudo) {
    if (!text.trim()) return;
    // Scrim paint is a sibling, not an ancestor. Do not claim an ancestor-only
    // contrast result for inactive content behind an open modal overlay.
    if (modal && !modal.contains(el)) { exclusions.inactiveModalUnderlay += 1; return; }
    if (!visible(el)) { exclusions.hiddenOrClipped += 1; return; }
    if (el.closest(":disabled, [aria-disabled=true]")) { exclusions.disabled += 1; return; }
    const ownStyle = pseudo ? getComputedStyle(el, pseudo) : style(el);
    const fill = ownStyle.webkitTextFillColor && ownStyle.webkitTextFillColor !== "currentcolor" ? ownStyle.webkitTextFillColor : ownStyle.color;
    let foreground = color(fill);
    let background = [0, 0, 0, 0];
    const problems = [];
    if (!foreground) problems.push(`unsupported text color: ${fill}`);
    let cursor = el;
    let opaqueBackgroundSeen = false;
    for (; cursor; cursor = cursor.parentElement) {
      const s = style(cursor);
      const paint = color(s.backgroundColor);
      if (!paint) problems.push(`unsupported background: ${s.backgroundColor}`);
      // An opaque descendant shields ancestor background images, but not ancestor filters.
      if (!opaqueBackgroundSeen && s.backgroundImage !== "none") problems.push(`background image at ${selector(cursor)}`);
      if (s.mixBlendMode !== "normal" || s.filter !== "none" || s.backdropFilter !== "none") problems.push(`filter or blend at ${selector(cursor)}`);
      if (s.textShadow !== "none" && cursor === el) problems.push("text shadow");
      if (paint) {
        foreground = foreground ? over(foreground, paint) : null;
        background = over(background, paint);
        const opacity = Number(s.opacity);
        if (foreground) foreground = [foreground[0], foreground[1], foreground[2], foreground[3] * opacity];
        background = [background[0], background[1], background[2], background[3] * opacity];
        if (background[3] === 1) opaqueBackgroundSeen = true;
      }
    }
    const info = { element: selector(el), text: text.trim().slice(0, 100), pseudo: pseudo ?? null, color: fill, fontSize: ownStyle.fontSize, fontWeight: ownStyle.fontWeight };
    if (problems.length || !foreground) { unsupported.push({ ...info, reasons: [...new Set(problems)] }); return; }
    foreground = over(foreground, [1, 1, 1, 1]);
    background = over(background, [1, 1, 1, 1]);
    const a = luminance(foreground); const b = luminance(background);
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const size = parseFloat(ownStyle.fontSize); const weight = parseFloat(ownStyle.fontWeight);
    const required = size >= 24 || (size >= 18.6666667 && weight >= 700) ? 3 : 4.5;
    pairs.push({ ...info, foreground: rgb(foreground), background: rgb(background), ratio, required, pass: ratio >= required });
  }
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const el = node.parentElement;
    if (!el || ["SCRIPT", "STYLE", "NOSCRIPT", "TITLE"].includes(el.tagName) || el.closest("svg")) continue;
    inspectText(el, node.textContent ?? "");
  }
  for (const el of document.querySelectorAll("input,textarea")) {
    if (el.value) inspectText(el, el.type === "password" ? "•••• (masked password)" : el.value);
    else if (el.placeholder) inspectText(el, el.placeholder, "::placeholder");
  }
  const failures = pairs.filter((pair) => !pair.pass);
  const overflowCandidates = [...document.querySelectorAll("body *")].filter((el) => visible(el)).map((el) => {
    const box = el.getBoundingClientRect();
    return { element: selector(el), text: (el.textContent ?? "").trim().slice(0, 60), left: box.left, right: box.right };
  }).filter((box) => box.right > width + 1 || box.left < -1).slice(0, 20);
  return {
    url: location.pathname,
    rootFontSize: getComputedStyle(document.documentElement).fontSize,
    theme: document.documentElement.dataset.theme ?? "system",
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    overflow: { width, scrollWidth, pass: scrollWidth <= width + 1, candidates: overflowCandidates },
    contrast: {
      status: failures.length ? "FAIL" : unsupported.length ? "NEEDS_MANUAL" : pairs.length ? "PASS" : "NOT_RUN",
      testedTextNodes: pairs.length, minRatio: pairs.length ? Math.min(...pairs.map((pair) => pair.ratio)) : null,
      exclusions, failures, unsupported, pairs,
    },
  };
}


