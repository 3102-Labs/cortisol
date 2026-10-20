/* Cinema-review overlays. Original supplied paper PNG + editable SVG type and sketched rhythm. */
(function (root) {
  'use strict';
  const model = root.TraceReportModel || (typeof require === 'function' ? require('./model.js') : null);
  const variants = Object.freeze([
    { key: 'soft', director: 'THE DUDE', title: 'Low Cortisol Day', heading: ['Low', 'Cortisol Day'], colour: 'Pink', badgePaper: '#F8CAD8', rhythmInks: ['#284F5B', '#F4DDA8'], scoreInk: '#70293E', lastPunchHole: { x: 225, y: 1231 }, caption: 'A quieter daytime curve with a low evening ending.' },
    { key: 'day', director: 'TED LASSO', title: 'Good Cortisol Day', heading: ['Good', 'Cortisol Day'], colour: 'Lilac', badgePaper: '#E1D6F2', rhythmInks: ['#AF4932', '#F6E1B5'], scoreInk: '#4B315D', lastPunchHole: { x: 218.5, y: 1254 }, caption: 'A higher daytime curve that settles by evening.' },
    { key: 'after', director: 'PABLO PICASSO', title: 'Low Cortisol Day', heading: ['Low', 'Cortisol Day'], colour: 'Lime', badgePaper: '#E4EDBF', rhythmInks: ['#2C5360', '#B95536'], scoreInk: '#365237', lastPunchHole: { x: 242.5, y: 1233 }, caption: 'A moderate daytime curve with more evening carry-over.' },
    { key: 'high', director: 'KENDALL ROY', title: 'High Cortisol Day', heading: ['High', 'Cortisol Day'], colour: 'Orange', badgePaper: '#F7D0AC', rhythmInks: ['#78333D', '#F6DDA6'], scoreInk: '#713923', lastPunchHole: { x: 215, y: 1239.5 }, caption: 'A higher daytime curve with an elevated evening ending.' }
  ]);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);
  const n = value => Number(value.toFixed(2));
  const noise = (x, y, seed) => {
    const value = Math.sin(x * 127.1 + y * 311.7 + seed * 91.3) * 43758.5453;
    return value - Math.floor(value);
  };
  function curveSamples(data) {
    const values = [data.w, data.w2, data.e], times = [0, 2, data.eveningHours];
    const ceiling = Math.max(80, ...values.map(v => v * 1.15));
    const x = t => 309 + 560 * t / data.eveningHours;
    const y = v => 824 - v / ceiling * 236;
    const points = model.curvePath(values, times, x, y).match(/-?\d+(?:\.\d+)?/g).map(Number);
    const segments = [points.slice(0, 8), [points[6], points[7], ...points.slice(8)]];
    return px => {
      const s = px <= x(2) ? segments[0] : segments[1];
      const t = Math.max(0, Math.min(1, (px - s[0]) / (s[6] - s[0]))), q = 1 - t;
      return q*q*q*s[1] + 3*q*q*t*s[3] + 3*q*t*t*s[5] + t*t*t*s[7];
    };
  }
  function sketchedRhythm(data, seed, ink) {
    const curve = curveSamples(data);
    const anchors = [309, 309 + 560 * 2 / data.eveningHours, 869];
    const xs = [...new Set([...Array.from({ length: 55 }, (_, i) => 309 + 560 * i / 54), ...anchors])].sort((a, b) => a - b);
    // Small deterministic bends give the pen line character. All three reading anchors stay exact.
    const points = xs.map((x, i) => {
      const taper = Math.min(1, Math.min(...anchors.map(a => Math.abs(a - x))) / 18);
      const wobble = ((noise(i, seed, 7) - .5) * 9 + Math.sin(i * 1.1 + seed) * 2) * taper;
      return `${n(x)} ${n(curve(x) + wobble)}`;
    });
    const d = 'M' + points.join('L');
    return `<g data-rhythm-line="true" data-treatment="sketched-route" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path data-line-shadow="true" d="${d}" transform="translate(4 6)" stroke="#292329" stroke-width="26"/>
      <path data-line-outline="true" d="${d}" stroke="#292329" stroke-width="25"/>
      <path data-line-ink="true" d="${d}" stroke="${ink}" stroke-width="14"/>
    </g>`;
  }
  function rhythmAxisIcons(ink) {
    const rays = Array.from({ length: 8 }, (_, i) => {
      const angle = (i * 45 - 2) * Math.PI / 180;
      return `<path d="M${n(Math.cos(angle) * 16)} ${n(Math.sin(angle) * 16)}L${n(Math.cos(angle + .035) * 22)} ${n(Math.sin(angle + .035) * 22)}"/>`;
    }).join('');
    return `<g data-rhythm-axis="icons-only" stroke="#292329" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
      <g data-axis-icon="sun" role="img" aria-label="Morning" transform="translate(309 862)" fill="${ink}"><circle cx="0" cy="0" r="10.5"/>${rays}</g>
      <g data-axis-icon="moon" role="img" aria-label="Night" transform="translate(869 862)" fill="${ink}"><path d="M12 -17C-3 -20 -21 -6 -16 9C-11 23 8 24 18 9C5 10 -3 -3 12 -17Z"/></g>
    </g>`;
  }
  function scoreMeter(data, variant, comparison) {
    const score = Math.max(0, Math.min(100, Number(data.rhythmDisplay)));
    const count = 28, filled = Math.round(score / 100 * count);
    const bars = Array.from({ length: count }, (_, i) => {
      const angle = 135 + i * 270 / (count - 1), radians = angle * Math.PI / 180;
      const x = 580 + Math.cos(radians) * 160, y = 746 + Math.sin(radians) * 160;
      return `<g data-meter-segment="${i < filled ? 'filled' : 'empty'}" transform="translate(${n(x)} ${n(y)}) rotate(${n(angle + 90)})">
        <rect data-meter-underprint="true" x="-5.5" y="-19.5" width="16" height="44" rx="2" fill="${variant.badgePaper}"/>
        <rect data-meter-ink="true" x="-8" y="-22" width="16" height="44" rx="2" fill="${i < filled ? variant.scoreInk : variant.badgePaper}" stroke="${variant.scoreInk}" stroke-width="1.2" opacity="${i < filled ? 1 : .35}"/>
      </g>`;
    }).join('');
    const ticks = Array.from({ length: 10 }, (_, i) => {
      const angle = (135 + i * 30) * Math.PI / 180;
      return `<path d="M${n(580 + Math.cos(angle) * 190)} ${n(746 + Math.sin(angle) * 190)}L${n(580 + Math.cos(angle) * 198)} ${n(746 + Math.sin(angle) * 198)}"/>`;
    }).join('');
    return `<g data-score-meter="true" data-meter-style="retro-dial" transform="translate(-37 72)" role="img" aria-label="Rhythm score ${escape(data.rhythmDisplay)}">
      <g data-meter-calibration="true" fill="none" stroke="${variant.scoreInk}" stroke-width="1.5" opacity=".6">
        <path d="M445.65 880.35A190 190 0 1 1 714.35 880.35"/>
        ${ticks}
      </g>
      ${bars}
      <text class="meter-score" x="580" y="784.08" text-anchor="middle" letter-spacing="-4" fill="${variant.scoreInk}"><tspan class="meter-value" font-size="112">${escape(data.rhythmDisplay)}</tspan></text>
      <text class="percentile-caption meter-percentile" data-percentile="mock" x="580" y="961" text-anchor="middle" font-size="32.256">${comparison.label ? `<tspan x="580">${escape(comparison.label)}</tspan><tspan x="580" dy="42">${escape(comparison.value)}</tspan>` : `<tspan x="580">${escape(comparison.value)}</tspan>`}</text>
    </g>`;
  }
  function approvalPapers(variant) {
    const paper = variant.badgePaper, ink = '#000000';
    const start = { soft: 109, day: 107, after: 130, high: 111 }[variant.key];
    const rows = ['The Cortisol', 'Gods approve'].map((line, i) => {
      const x = start + i * 26.4, baseline = 1011 + i * 74.4;
      const left = x - 16.8, top = baseline - 57.6, width = 373.55 + 33.6;
      const right = left + width, bottom = top + 76.8 + (i ? 0 : 8), angle = i ? 1.3 : -1.2;
      const outline = `M${n(left)} ${n(top + 2.4)}L${n(right - 3.6)} ${n(top)}L${n(right)} ${n(bottom - 2.4)}L${n(left + 2.4)} ${n(bottom)}Z`;
      return { line, x: n(x), baseline: n(baseline), transform: `rotate(${angle} ${n(x)} ${n(baseline - 24)})`, outline };
    });
    return `<g data-approval-papers="true" aria-label="The Cortisol Gods approve">${rows.map(row => `<path data-approval-paper="true" d="${row.outline}" fill="${paper}" transform="${row.transform}"/>`).join('')}
      ${rows.map(row => `<text class="review-approval" x="${row.x}" y="${row.baseline}" font-size="55.2" letter-spacing="-1.44" fill="${ink}" transform="${row.transform}">${escape(row.line)}</text>`).join('')}
    </g>`;
  }
  function render(data, options = {}) {
    const variant = variants.find(v => v.key === (options.variant || data.archetype)) || variants[0];
    const meter = options.treatment === 'meter';
    const hasFigure = Number.isFinite(options.figurePercent) && options.figurePercent >= 0 && options.figurePercent <= 100;
    const comparison = hasFigure ? {label:'Better rhythm than',value:n(options.figurePercent)+'% of people'} : {label:'Better rhythm than',value:'99.2% of people'};
    const id = 'trace-' + variant.key + (meter ? '-meter' : '');
    const background = options.backgroundData || `assets/artefacts/cinema/${variant.key}-paper.png`;
    const date = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'UTC' }).format(new Date(data.date + 'T00:00:00Z'));
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1086" height="1448" viewBox="0 0 1086 1448" role="img" aria-labelledby="${id}-title ${id}-desc" data-archetype="${variant.key}" data-treatment="${meter ? 'meter' : 'rhythm'}" data-report-date="${escape(data.date)}" data-detail-scale="1.2">
  <title id="${id}-title">${escape(variant.title)} — Trace</title>
  <desc id="${id}-desc">${escape(variant.caption)} ${escape(date)}. Rhythm score ${escape(data.rhythmDisplay)} out of 100 from the illustrative report model. ${hasFigure ? 'Population comparison copy supplied by the report publisher, independently of the calculated rhythm score.' : 'Percentile copy is a fixed design placeholder, not a calculated population comparison.'} The Cortisol Gods approve. Playful editorial approval and playful director credit, not a medical classification. Transparent story overlay.</desc>
  <defs><style>${options.fontStyle || ''}
    text{font-synthesis:none}
    .type{font-family:'GT Alpina Typewriter',monospace;font-weight:400}
    .mono-credit{font-family:'JetBrains Mono',monospace;font-weight:400;letter-spacing:-.04em}
    .percentile-caption{font-family:'IBM Plex Sans',sans-serif;font-weight:400;letter-spacing:0}
    .heading{font-family:'GT Alpina',serif;font-weight:400}
    .review-approval{font-family:'GT Alpina Typewriter',monospace;font-weight:500}
    .hand{font-family:'Cedarville Cursive',cursive;font-weight:400}
    .score-value{font-family:'GT Alpina',serif;font-weight:500;font-style:italic}
    .rhythm-score-total{font-family:'JetBrains Mono',monospace;font-weight:400;font-style:normal}
    .meter-score{font-family:'GT Alpina',serif;font-weight:500;font-style:italic}
    .artefact-wordmark{font-family:'IBM Plex Sans',sans-serif;font-weight:500;letter-spacing:-.075em}
  </style>
  </defs>
  <image data-paper="${variant.key}" href="${escape(background)}" x="0" y="0" width="1086" height="1448"/>
  <g fill="#292329">
    <text class="hand report-date" x="878" y="217" text-anchor="end" font-size="40" transform="rotate(-3 878 202)">${escape(date)}</text>
    <path d="M720 232Q798 235 876 227" fill="none" stroke="#292329" stroke-width="1.4" opacity=".65"/>
    <g data-day-title="true" aria-label="${escape(variant.title)}">${variant.heading.map((line, i) => `
      <text class="heading" x="182" y="${320 + i * 105}" font-size="112" letter-spacing="-3">${escape(line)}</text>`).join('')}
    </g>
    <text class="mono-credit director" x="188" y="522" font-size="36">DIR. BY ${escape(variant.director)}</text>
    ${meter ? scoreMeter(data, variant, comparison) : `<g data-rhythm-composition="true" transform="translate(-46 96)">
      <g data-rhythm-plot="true" transform="translate(0 140)">
        ${sketchedRhythm(data, variants.indexOf(variant) + 1, variant.badgePaper)}
        ${rhythmAxisIcons(variant.badgePaper)}
      </g>
      <g data-rhythm-score-block="true" aria-label="Rhythm score ${escape(data.rhythmDisplay)} out of 100">
        <text class="score-value" data-score="rhythm" x="929" y="610" text-anchor="end" font-size="112" letter-spacing="-4" fill="${variant.scoreInk}" stroke="#FFF7EA" stroke-width="5.6" stroke-linejoin="round" paint-order="stroke fill"><tspan class="rhythm-score-value">${escape(data.rhythmDisplay)}</tspan><tspan class="rhythm-score-total" font-size="42" dx="8" letter-spacing="-2" stroke="none">/100</tspan></text>
        <text class="percentile-caption rhythm-percentile" data-percentile="mock" x="929" y="678" text-anchor="end" font-size="32.256">${comparison.label ? `<tspan x="929">${escape(comparison.label)}</tspan><tspan x="929" dy="42">${escape(comparison.value)}</tspan>` : `<tspan x="929">${escape(comparison.value)}</tspan>`}</text>
      </g>
    </g>`}
    <g data-approval-block="true" data-anchor="footer-baseline" transform="translate(0 204.6)">
      ${approvalPapers(variant)}
    </g>
    <text class="artefact-wordmark" data-trace-logo="true" x="890" y="1290" text-anchor="end" font-size="64">trace</text>
  </g>
</svg>`;
  }
  const api = Object.freeze({ variants, render });
  root.TraceArtefactDesigns = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
