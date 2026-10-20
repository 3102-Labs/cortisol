(function (root) {
  'use strict';
  const reference = root.TraceReferenceRanges || (typeof require === 'function' ? require('./reference-ranges.js') : null);
  // Reverse the cubic segments without changing their geometry.
  function reversePath(path) {
    const tokens = path.match(/[MC]|-?\d+(?:\.\d+)?/g);
    let point = [Number(tokens[1]), Number(tokens[2])];
    const segments = [];
    for (let i = 3; i < tokens.length; i += 7) {
      const numbers = tokens.slice(i + 1, i + 7).map(Number);
      segments.push({ start: point, first: numbers.slice(0, 2), second: numbers.slice(2, 4), end: numbers.slice(4, 6) });
      point = numbers.slice(4, 6);
    }
    return `M ${point.join(' ')} ` + segments.reverse().map(segment => `C ${segment.second.join(' ')} ${segment.first.join(' ')} ${segment.start.join(' ')}`).join(' ');
  }
  function geometry(value, model, sample) {
    const hours = sample ? sample.eveningHours : 14;
    const times = [0, 2, hours], x = t => 286 * t / hours, y = v => 213 - 181 * v / 70;
    function levelEnd(path) {
      const tokens = path.match(/[MC]|-?\d+(?:\.\d+)?/g);
      // A horizontal final tangent gives a soft landing without moving the measured anchor.
      tokens[tokens.length - 3] = tokens[tokens.length - 1];
      return tokens.join(' ');
    }
    const upper = levelEnd(model.curvePath([35, 65, 7], times, x, y));
    const lower = levelEnd(model.curvePath([16, 30, 5], times, x, y));
    const lowerReversed = reversePath(lower);
    const band = upper + ' ' + lowerReversed.replace(/^M/, 'L') + ' Z';
    const referenceY = y(6), personalY = y(value);
    const points = (sample ? [sample.w, sample.w2, value] : [20, 40, value]).map((reading, i) => [x(times[i]), y(reading)]);
    let personal = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 0; i < points.length - 1; i++) {
      const [startX, startY] = points[i], [endX, endY] = points[i + 1];
      const handle = (endX - startX) * .42;
      // Horizontal handles create rounded transitions at every measured anchor.
      personal += ` C ${startX + handle} ${startY} ${endX - handle} ${endY} ${endX} ${endY}`;
    }
    // Follow the measured curve with a glow that narrows smoothly to a left-hand tip.
    function glowRibbon(width, startX = 149, startWidth = 0) {
      const a = points[1], d = points[2], handle = (d[0] - a[0]) * .42;
      const b = [a[0] + handle, a[1]], c = [d[0] - handle, d[1]];
      function sample(t) {
        const q = 1 - t;
        return {
          x: q*q*q*a[0] + 3*q*q*t*b[0] + 3*q*t*t*c[0] + t*t*t*d[0],
          y: q*q*q*a[1] + 3*q*q*t*b[1] + 3*q*t*t*c[1] + t*t*t*d[1],
          dx: 3*q*q*(b[0]-a[0]) + 6*q*t*(c[0]-b[0]) + 3*t*t*(d[0]-c[0]),
          dy: 3*q*q*(b[1]-a[1]) + 6*q*t*(c[1]-b[1]) + 3*t*t*(d[1]-c[1])
        };
      }
      let lo = 0, hi = 1;
      for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2;
        if (sample(mid).x < startX) lo = mid; else hi = mid;
      }
      const start = (lo + hi) / 2, first = [], second = [];
      for (let i = 0; i <= 64; i++) {
        const u = i / 64, p = sample(start + (1-start)*u);
        const radius = (startWidth + (width-startWidth)*u*u*(3-2*u)) / 2, length = Math.hypot(p.dx, p.dy);
        const nx = -p.dy / length, ny = p.dx / length;
        first.push([p.x + nx*radius, p.y + ny*radius]);
        second.push([p.x - nx*radius, p.y - ny*radius]);
      }
      const format = point => point.map(n => n.toFixed(2)).join(' ');
      const radius = width / 2, end = second[second.length - 1];
      return `M ${first.map(format).join(' L ')} A ${radius} ${radius} 0 0 0 ${format(end)} L ${second.reverse().map(format).join(' L ')} Z`;
    }
    const glowPaths = [76, 52, 28].map(width => glowRibbon(width));
    return { band, upper, lower, personal, referenceY, personalY, markerX: x(14), glowPaths, railStart: (y(7)-24)/(213-24), railEnd: (y(5)-24)/(213-24) };
  }
  function render(state, value, sample) {
    const g = geometry(value, root.TraceReportModel, sample), id = 'evening-clean';
    return `<svg viewBox="0 0 360 282" role="img" aria-labelledby="${id}-title ${id}-desc">
      <title id="${id}-title">Evening level</title>
      <desc id="${id}-desc">Illustrative reference range 5 to 7 ng per mg creatinine. Your evening reading is ${value}. The lightly shaded band with a subtle grey dashed outline is the reference range. One continuous warm-to-violet-and-blue gradient flows along the reading line. A small transparent black outlined circle marks the measured evening endpoint in every state, without a surrounding glow.</desc>
      <defs>
        ${reference.defs(id)}
        <linearGradient id="${id}-trace" x1="0" y1="0" x2="308" y2="0" gradientUnits="userSpaceOnUse">
          <stop stop-color="#efba50"/>
          <stop offset=".18" stop-color="#efa45b"/>
          <stop offset=".36" stop-color="#e98875"/>
          <stop offset=".52" stop-color="#d776a1"/>
          <stop offset=".68" stop-color="#a16bb5"/>
          <stop offset=".84" stop-color="#9278bc"/>
          <stop offset="1" stop-color="#7f8bc7"/>
        </linearGradient>
        <mask id="${id}-reading-mask" maskUnits="userSpaceOnUse" x="-10" y="0" width="370" height="282">
          <path d="${g.personal}" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
        </mask>
        <mask id="${id}-endpoint-cutout" maskUnits="userSpaceOnUse" x="-10" y="0" width="370" height="282">
          <rect x="-10" width="370" height="282" fill="#fff"/>
          <circle cx="286" cy="${g.personalY}" r="7" fill="#000"/>
        </mask>
        <linearGradient id="${id}-tail-fade" x1="0" y1="0" x2="286" y2="0" gradientUnits="userSpaceOnUse">
          <stop stop-color="#000"/>
          <stop offset=".5" stop-color="#000"/>
          <stop offset=".62" stop-color="#999"/>
          <stop offset=".78" stop-color="#fff"/>
          <stop offset="1" stop-color="#fff"/>
        </linearGradient>
        <mask id="${id}-tail-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="360" height="282"><rect width="360" height="282" fill="url(#${id}-tail-fade)"/></mask>
        <filter id="${id}-tail-blur" filterUnits="userSpaceOnUse" x="-40" y="-40" width="440" height="362" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="7"/></filter>
        <filter id="${id}-burn-ring-blur" filterUnits="userSpaceOnUse" x="-40" y="-40" width="440" height="362" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="4.2"/></filter>
        <filter id="${id}-violet-core-blur" filterUnits="userSpaceOnUse" x="-40" y="-40" width="440" height="362" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="3.2"/></filter>
        <radialGradient id="${id}-evening-orb">
          <stop stop-color="#aa8ed1" stop-opacity=".3"/>
          <stop offset=".42" stop-color="#b292d6" stop-opacity=".4"/>
          <stop offset=".55" stop-color="#ce68ac" stop-opacity=".55"/>
          <stop offset=".7" stop-color="#f08c7c" stop-opacity=".35"/>
          <stop offset=".84" stop-color="#f4bc75" stop-opacity=".22"/>
          <stop offset="1" stop-color="#f4bc75" stop-opacity="0"/>
        </radialGradient>
        <filter id="${id}-orb-blur" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB">
          <feGaussianBlur stdDeviation="3.5"/>
        </filter>
        <filter id="${id}-trace-grain" x="-15%" y="-35%" width="130%" height="170%" color-interpolation-filters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation=".35" result="softened"/>
          <feTurbulence type="fractalNoise" baseFrequency="1.25" numOctaves="3" seed="14" result="noise"/>
          <feColorMatrix in="noise" type="matrix" values=".08 .08 .08 0 .84 .08 .08 .08 0 .84 .08 .08 .08 0 .84 0 0 0 0 1" result="grain"/>
          <feBlend in="softened" in2="grain" mode="multiply" result="textured"/>
          <feComposite in="textured" in2="softened" operator="in"/>
        </filter>
      </defs>
      ${reference.shape(id, g.band)}
      ${reference.guide(id, 286, 24, 232)}
      <g class="merged-reading" filter="url(#${id}-trace-grain)" mask="url(#${id}-endpoint-cutout)">
        <g mask="url(#${id}-reading-mask)">
          <rect x="-10" y="0" width="370" height="282" fill="url(#${id}-trace)"/>
        </g>
      </g>
      <circle class="evening-endpoint" cx="286" cy="${g.personalY}" r="7" fill="none" stroke="#181818" stroke-width="2" aria-hidden="true"/>
      <text x="286" y="252" text-anchor="middle" aria-hidden="true" class="night-icon" style="font-family:'Trace Time Icons';font-size:16px;font-weight:300;font-feature-settings:'liga';fill:#888888">bedtime</text>
      ${reference.tag(id, 198, 214, 'M180 194 C179 188 179 181 180 175', '5–7')}
    </svg>`;
  }
  root.TraceEveningIllustration = render;
  if (typeof module !== 'undefined' && module.exports) module.exports = { geometry, reversePath };
})(typeof globalThis !== 'undefined' ? globalThis : this);
