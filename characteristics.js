(function () {
  'use strict';
  // Default pages retain independent examples; the personalized page opts into calculations.
  const examples = {
    'evening-level': { mixed: 'above', unit: 'ng/mg creatinine', range: '5–7', values: { close: 6, above: 12, below: 3 } },
    'total-auc': { mixed: 'below', unit: 'ng/mg creatinine · h', range: '410–500', values: { close: 455, above: 610, below: 320 } },
    'morning-activation': { mixed: 'close', unit: '%', range: '80–115%', values: { close: 100, above: 165, below: 30 } },
    'diurnal-decline': { mixed: 'below', unit: '%/h', range: '16–20', values: { close: 18, above: 28, below: 9 } },
    'evening-fraction': { mixed: 'above', unit: 'ratio', range: '0.17–0.24', values: { close: 0.20, above: 0.50, below: 0.10 } }
  };
  const labels = { close: 'Close to reference', above: 'Above reference', below: 'Below reference' };
  const requestedCharacteristic = document.body.dataset.characteristic;
  const copy = requestedCharacteristic ? window.TraceCharacteristicsCopy.filter(item => item.id === requestedCharacteristic) : window.TraceCharacteristicsCopy;
  const model = window.TraceReportModel;
  const root = document.getElementById('characteristic-cards');
  const participantModel = window.TraceCharacteristicModel;
  let participantSample = participantModel && window.TraceInitialSample ? model.validate(window.TraceInitialSample) : null;
  let participant = participantSample ? participantModel.calculate(participantSample) : null;
  function defs(id) {
    return `<defs>
      <linearGradient id="${id}-warm" x1="0" y1="0" x2="1" y2=".5" gradientUnits="objectBoundingBox"><stop stop-color="#f0d47c"/><stop offset=".4" stop-color="#e79c76"/><stop offset="1" stop-color="#ad87cd"/></linearGradient>
      <linearGradient id="${id}-night"><stop stop-color="#f0c77e"/><stop offset=".4" stop-color="#cc98a9"/><stop offset="1" stop-color="#9c8bc9"/></linearGradient>
      <radialGradient id="${id}-sun"><stop stop-color="#fff0a1"/><stop offset=".65" stop-color="#eec780"/><stop offset="1" stop-color="#da9a83"/></radialGradient>
      <radialGradient id="${id}-aura"><stop offset="0" stop-color="#a097ec"/><stop offset=".36" stop-color="#aaa3ed"/><stop offset=".58" stop-color="#d7e493"/><stop offset=".72" stop-color="#f1d778"/><stop offset=".86" stop-color="#ea9997" stop-opacity=".75"/><stop offset="1" stop-color="#ca97d9" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}-body" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#9c91dc"/><stop offset=".5" stop-color="#adace6"/><stop offset="1" stop-color="#8278bb"/></linearGradient>
      <linearGradient id="${id}-light" x1="0" y1="0" x2=".65" y2="1"><stop stop-color="#fbefad" stop-opacity=".9"/><stop offset=".7" stop-color="#ecd678" stop-opacity=".5"/><stop offset="1" stop-color="#ecd678" stop-opacity=".18"/></linearGradient>
      <filter id="${id}-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
      <filter id="${id}-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
    </defs>`;
  }
  function svg(id, title, description, contents) {
    return `<svg viewBox="0 0 360 260" role="img" aria-labelledby="${id}-art-title ${id}-art-desc"><title id="${id}-art-title">${title}</title><desc id="${id}-art-desc">${description}</desc>${defs(id)}${contents}</svg>`;
  }
  function star(x, y, size, color = '#b296c3') {
    return `<path d="M${x} ${y-size} Q${x+1} ${y-1} ${x+size} ${y} Q${x+1} ${y+1} ${x} ${y+size} Q${x-1} ${y+1} ${x-size} ${y} Q${x-1} ${y-1} ${x} ${y-size}" fill="${color}" opacity=".7"/>`;
  }
  function face(x, y, state, id) {
    const eyes = state === 'above'
      ? `<ellipse cx="-5" cy="-2" rx="2.8" ry="4" fill="#fff8e5"/><ellipse cx="5" cy="-2" rx="2.8" ry="4" fill="#fff8e5"/><circle cx="-5" cy="-1" r="1.25" fill="#625071"/><circle cx="5" cy="-1" r="1.25" fill="#625071"/>`
      : `<path class="sketch" d="M-8 -2 Q-5 ${state === 'close' ? '1' : '0'} -2 -2 M2 -2 Q5 ${state === 'close' ? '1' : '0'} 8 -2"/>`;
    return `<g transform="translate(${x} ${y})"><circle r="15" fill="url(#${id}-sun)" stroke="#8f759b" stroke-width="1.1"/>${eyes}<path class="sketch" d="M-3 5 Q0 8 3 5"/>${state === 'close' ? '<text x="10" y="-16" class="reading-label">zZ</text>' : ''}</g>`;
  }
  function evening(state, value) {
    const id = 'evening-level', times = [0, 2, 14];
    const x = t => 28 + 287 * t / 14;
    const y = v => 210 - 156 * v / 60;
    const reference = model.curvePath([28, 55, 6], times, x, y);
    const personal = model.curvePath([20, 40, value], times, x, y);
    const end = y(value);
    const eyes = state === 'above'
      ? '<ellipse cx="-6" cy="-3" rx="3.8" ry="5.2" fill="#fff8e8"/><ellipse cx="6" cy="-3" rx="3.8" ry="5.2" fill="#fff8e8"/><circle cx="-5.6" cy="-2" r="1.65" fill="#504056"/><circle cx="6.4" cy="-2" r="1.65" fill="#504056"/><path d="M-10 -12 Q-7 -14 -3 -12 M3 -12 Q7 -14 10 -12" fill="none" stroke="#64516e" stroke-width="1" stroke-linecap="round"/>'
      : `<path d="M-10 -3 Q-6 ${state === 'close' ? '1.5' : '0'} -2 -3 M2 -3 Q6 ${state === 'close' ? '1.5' : '0'} 10 -3" fill="none" stroke="#64516e" stroke-width="1.7" stroke-linecap="round"/>`;
    return svg(id, 'Your evening level', `${labels[state]}. A broad, softly shaded reference ribbon fades into evening. The personal curve passes through the readings and ends with ${state === 'above' ? 'an alert' : state === 'close' ? 'a sleepy' : 'a relaxed'} face.`, `
      <defs>
        <linearGradient id="${id}-silk" x1="28" y1="70" x2="315" y2="206" gradientUnits="userSpaceOnUse"><stop stop-color="#ffdb92"/><stop offset=".25" stop-color="#f4ba96"/><stop offset=".6" stop-color="#ceb5df"/><stop offset="1" stop-color="#9884cd"/></linearGradient>
        <linearGradient id="${id}-ink" x1="28" y1="140" x2="315" y2="190" gradientUnits="userSpaceOnUse"><stop stop-color="#df9267"/><stop offset=".38" stop-color="#d99791"/><stop offset="1" stop-color="#8773b9"/></linearGradient>
        <radialGradient id="${id}-face-fill" cx=".3" cy=".22" r=".95"><stop stop-color="#fff0c6"/><stop offset=".6" stop-color="#f6d3b6"/><stop offset="1" stop-color="#cba8d3"/></radialGradient>
        <radialGradient id="${id}-night-glow"><stop stop-color="#c8b4ed" stop-opacity=".5"/><stop offset="1" stop-color="#c8b4ed" stop-opacity="0"/></radialGradient>
        <filter id="${id}-silk-shadow" x="-35%" y="-50%" width="170%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
        <filter id="${id}-face-shadow" x="-100%" y="-100%" width="300%" height="300%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#84719e" flood-opacity=".2"/></filter>
      </defs>
      <ellipse cx="290" cy="158" rx="115" ry="103" fill="url(#${id}-night-glow)"/>
      <path d="M291 34 C278 36 274 52 283 61 C290 68 302 65 306 58 C290 63 282 49 291 34Z" fill="#9585bd" opacity=".35"/>
      <path d="M307 91 L307 100 M303 95.5 L311 95.5 M275 75 L275 82 M271.5 78.5 L278.5 78.5" fill="none" stroke="#a494c3" stroke-width="1.1" stroke-linecap="round" opacity=".6"/>
      <circle cx="326" cy="64" r="1.2" fill="#a594c0" opacity=".65"/>
      <path d="${reference}" fill="none" stroke="url(#${id}-silk)" stroke-width="33" stroke-linecap="round" opacity=".28" filter="url(#${id}-silk-shadow)"/>
      <path d="${reference}" fill="none" stroke="url(#${id}-silk)" stroke-width="24" stroke-linecap="round" opacity=".62"/>
      <path d="${reference}" fill="none" stroke="#fff9e9" stroke-width="13" stroke-linecap="round" opacity=".17" transform="translate(0 -3)"/>
      <path d="${reference}" fill="none" stroke="#aa95bd" stroke-width=".8" stroke-linecap="round" stroke-dasharray="2 5" opacity=".58"/>
      <path d="${personal}" fill="none" stroke="#fffbf5" stroke-width="6.8" stroke-linecap="round" opacity=".66"/>
      <path d="${personal}" fill="none" stroke="url(#${id}-ink)" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="${x(0)}" cy="${y(20)}" r="4" fill="#e2a076" stroke="#fff8e7" stroke-width="1.6"/>
      <circle cx="${x(2)}" cy="${y(40)}" r="4" fill="#dba091" stroke="#fff8e7" stroke-width="1.6"/>
      <text x="${x(0)}" y="${y(20)-14}" text-anchor="middle" class="reading-label" style="font-size:14px;fill:#866453">20</text>
      <text x="${x(2)+5}" y="${y(40)-14}" class="reading-label" style="font-size:14px;fill:#866453">40</text>
      <g transform="translate(315 ${end})" filter="url(#${id}-face-shadow)">
        <path d="M0 -20 C12 -20 21 -12 20 1 C21 13 11 21 -1 20 C-13 21 -21 11 -20 -1 C-21 -13 -11 -21 0 -20Z" fill="url(#${id}-face-fill)" stroke="#b092ba" stroke-width=".9"/>
        <path d="M-13 -11 Q-6 -18 4 -16" fill="none" stroke="#fff8e9" stroke-width="2" stroke-linecap="round" opacity=".65"/>
        ${eyes}
        ${state === 'above' ? '<ellipse cx="0" cy="7" rx="2.3" ry="2.8" fill="none" stroke="#64516e" stroke-width="1.25"/>' : '<path d="M-4 7 Q0 11 4 7" fill="none" stroke="#64516e" stroke-width="1.5" stroke-linecap="round"/>'}
        <ellipse cx="-11" cy="6" rx="3" ry="1.7" fill="#e8a5a9" opacity=".4"/><ellipse cx="11" cy="6" rx="3" ry="1.7" fill="#e8a5a9" opacity=".4"/>
      </g>
      ${state === 'close' ? `<text x="335" y="${end-23}" transform="rotate(9 335 ${end-23})" style="font-family:Plex Serif,serif;font-size:13px;fill:#9a83b3">zZ</text>` : ''}
      <g transform="translate(278 ${end-21})"><rect x="-12" y="-13" width="27" height="22" rx="11" fill="#fffaf1" opacity=".92"/><text x="1.5" y="2.5" text-anchor="middle" class="reading-label" style="font-size:14px;fill:#725a88">${value}</text></g>
      <text x="28" y="246" style="font-size:9px;fill:#8a788c">Waking</text>
      <text x="105" y="246" text-anchor="middle" style="font-size:9px;fill:#8a788c">Few hours later</text>
      <text x="334" y="246" text-anchor="end" style="font-size:9px;fill:#8a788c">Evening</text>
    `);
  }

  function aura(state) {
    const id = 'total-auc';
    const scale = { below: .79, close: 1, above: 1.22 }[state];
    const opacity = { below: .7, close: .88, above: 1 }[state];
    const figure = `
      <path d="M169 65 C165 47 171 35 184 35 C198 35 204 48 199 65 C197 74 193 79 186 80 C177 81 172 74 169 65Z"/>
      <path d="M176 74 L194 75 L197 93 L170 94Z"/>
      <path d="M156 86 C138 89 128 104 126 122 L133 154 C151 167 193 171 218 153 L225 120 C222 100 210 88 195 87Z"/>
      <path d="M150 95 C132 98 121 115 118 136 L115 153 C117 163 133 170 145 164 L156 147 L158 121Z"/>
      <path d="M205 93 C223 99 235 116 238 137 L243 153 C241 166 225 172 212 162 L204 145 L200 115Z"/>
      <path d="M132 148 C143 137 161 139 171 156 C175 169 168 184 159 193 L164 218 C160 226 146 229 138 220 L126 189 C118 173 118 157 132 148Z"/>
      <path d="M194 159 C203 141 223 138 235 149 C249 163 245 177 233 190 L222 220 C214 228 198 225 196 216 L199 189 C192 179 188 169 194 159Z"/>
      <path d="M139 215 C141 226 135 227 126 229 C115 237 125 243 139 242 L161 236 C167 231 164 223 160 218Z"/>
      <path d="M201 216 C194 227 199 236 218 241 L242 242 C250 237 241 231 226 227 L222 218Z"/>
      <path d="M137 146 C151 145 166 147 178 152 C184 156 181 164 173 165 L139 162Z"/>
      <path d="M227 145 C213 142 197 147 185 154 C179 159 183 166 193 164 L226 162Z"/>`;
    const contour = 'M185 14 C158 13 148 28 147 53 C121 61 104 78 94 108 C79 137 83 174 95 197 C104 222 110 239 139 250 C162 258 212 255 238 247 C264 235 267 214 279 188 C293 151 282 116 264 90 C248 68 225 55 219 44 C216 23 205 14 185 14Z';
    return svg(id, 'Your cortisol aura', `${labels[state]}. A softly sculpted seated figure remains unchanged. A luminous thermal aura ${state === 'above' ? 'extends beyond' : state === 'below' ? 'sits inside' : 'follows'} the faint reference contour.`, `
      <defs>
        <radialGradient id="${id}-paper-light" cx=".49" cy=".4" r=".7"><stop stop-color="#faf8ed"/><stop offset=".65" stop-color="#e7e3ec"/><stop offset="1" stop-color="#d7d2e5"/></radialGradient>
        <radialGradient id="${id}-thermal-field" cx=".51" cy=".47" r=".56"><stop offset="0" stop-color="#5bb9df"/><stop offset=".32" stop-color="#53c8b5"/><stop offset=".53" stop-color="#bddd66"/><stop offset=".65" stop-color="#f1f18a"/><stop offset=".76" stop-color="#f4c36b" stop-opacity=".86"/><stop offset=".87" stop-color="#f1a296" stop-opacity=".46"/><stop offset="1" stop-color="#bf9cf0" stop-opacity="0"/></radialGradient>
        <linearGradient id="${id}-thermal-surface" x1="140" y1="30" x2="220" y2="240" gradientUnits="userSpaceOnUse"><stop stop-color="#b6dd79"/><stop offset=".28" stop-color="#61c9b5"/><stop offset=".6" stop-color="#74a9c8"/><stop offset=".82" stop-color="#afa7d1"/><stop offset="1" stop-color="#d0de8a"/></linearGradient>
        <radialGradient id="${id}-lime" cx=".5" cy=".4" r=".55"><stop stop-color="#d6ef83"/><stop offset=".5" stop-color="#b5e47a" stop-opacity=".7"/><stop offset="1" stop-color="#b5e47a" stop-opacity="0"/></radialGradient>
        <radialGradient id="${id}-cool" cx=".5" cy=".5" r=".5"><stop stop-color="#4493c6" stop-opacity=".95"/><stop offset="1" stop-color="#4493c6" stop-opacity="0"/></radialGradient>
        <radialGradient id="${id}-rose" cx=".5" cy=".5" r=".5"><stop stop-color="#d5a7d9" stop-opacity=".88"/><stop offset="1" stop-color="#d5a7d9" stop-opacity="0"/></radialGradient>
        <filter id="${id}-thermal-soft" x="-35%" y="-35%" width="170%" height="170%"><feGaussianBlur stdDeviation="5"/></filter>
        <filter id="${id}-edge-bloom" x="-35%" y="-35%" width="170%" height="170%"><feGaussianBlur stdDeviation="4"/></filter>
        <clipPath id="${id}-portrait-clip">${figure}</clipPath>
      </defs>
      <rect width="360" height="260" fill="url(#${id}-paper-light)"/>
      <ellipse cx="185" cy="239" rx="87" ry="8" fill="#5e5277" opacity=".12" filter="url(#${id}-soft)"/>
      <path d="${contour}" transform="translate(185 133) scale(.88 .89) translate(-185 -133)" fill="#c7bfd8" opacity=".08"/>
      <g transform="translate(185 133) scale(${scale}) translate(-185 -133)" opacity="${opacity}">
        <path d="${contour}" fill="url(#${id}-thermal-field)" filter="url(#${id}-thermal-soft)"/>
        <ellipse cx="185" cy="142" rx="89" ry="104" fill="url(#${id}-thermal-field)" opacity=".78"/>
      </g>
      <path d="${contour}" transform="translate(185 133) scale(.9 .9) translate(-185 -133)" fill="none" stroke="#8f809f" stroke-width=".9" stroke-dasharray="2.5 5" opacity=".63"/>
      <g fill="#dded8f" opacity=".4" filter="url(#${id}-edge-bloom)">${figure}</g>
      <g fill="url(#${id}-thermal-surface)">${figure}</g>
      <g clip-path="url(#${id}-portrait-clip)">
        <ellipse cx="179" cy="70" rx="51" ry="60" fill="url(#${id}-lime)"/>
        <ellipse cx="180" cy="132" rx="44" ry="52" fill="url(#${id}-cool)"/>
        <ellipse cx="143" cy="168" rx="45" ry="45" fill="url(#${id}-lime)"/>
        <ellipse cx="216" cy="171" rx="40" ry="49" fill="url(#${id}-cool)"/>
        <ellipse cx="150" cy="213" rx="31" ry="52" fill="url(#${id}-rose)"/>
        <ellipse cx="228" cy="227" rx="52" ry="36" fill="url(#${id}-lime)"/>
        <path d="M170 48 Q178 38 190 41 M135 104 Q143 91 159 89 M207 96 Q220 106 225 119 M131 151 Q142 145 153 154 M216 151 Q227 147 232 159" fill="none" stroke="#eff6bf" stroke-width="3.5" stroke-linecap="round" opacity=".26" filter="url(#${id}-soft)"/>
      </g>
      <g fill="none" stroke="#547f9f" stroke-width="1.2" stroke-linecap="round" opacity=".36">
        <path d="M144 121 C154 133 163 139 177 142 M213 119 C205 132 196 141 184 146"/>
        <path d="M141 155 Q155 160 173 157 M192 158 Q207 153 220 152"/>
        <path d="M156 184 Q150 202 154 216 M210 185 Q207 201 209 216"/>
      </g>
      <path d="M130 235 Q144 235 157 230 M209 232 Q221 237 235 237" fill="none" stroke="#749999" stroke-width="1.1" stroke-linecap="round" opacity=".32"/>
      <path d="M284 63 l0 10 M279 68 l10 0" fill="none" stroke="#8b75a8" stroke-width="1" stroke-linecap="round" opacity=".38"/>
      <circle cx="78" cy="180" r="2" fill="#c09bbf" opacity=".5"/>
    `);
  }

  function morning(state) {
    const id = 'morning-activation';
    const width = { below: 9, close: 19, above: 31 }[state];
    const ribbon = (sx, sy, cx, cy, ex, ey, breadth) => {
      const left = [], right = [];
      for (let n = 0; n <= 24; n++) {
        const t = n / 24, u = 1-t;
        const px = u*u*sx + 2*u*t*cx + t*t*ex, py = u*u*sy + 2*u*t*cy + t*t*ey;
        const dx = 2*u*(cx-sx)+2*t*(ex-cx), dy = 2*u*(cy-sy)+2*t*(ey-cy);
        const length = Math.hypot(dx,dy), half = breadth * Math.pow(Math.sin(Math.PI*t), .22) / 2;
        left.push(`${(px-dy/length*half).toFixed(2)} ${(py+dx/length*half).toFixed(2)}`);
        right.push(`${(px+dy/length*half).toFixed(2)} ${(py-dx/length*half).toFixed(2)}`);
      }
      return `M${left.join(' L')} L${right.reverse().join(' L')}Z`;
    };
    const rays = Array.from({ length: 5 }, (_, i) => {
      const a = (i-2)*.27, sx = 71 + Math.cos(a)*36, sy = 130 + Math.sin(a)*36;
      const ex = 71 + Math.cos(a)*252, ey = 130 + Math.sin(a)*187;
      const cx = (sx+ex)/2 + 8, cy = (sy+ey)/2 + (i-2)*3;
      const reference = ribbon(sx,sy,cx,cy,ex,ey,23), personal = ribbon(sx,sy,cx,cy,ex,ey,width);
      return `<path d="${reference}" fill="#a995ce" fill-opacity=".11" stroke="#a891c1" stroke-width=".85" stroke-dasharray="2 4" stroke-opacity=".5"/><path d="${personal}" fill="url(#${id}-paint)" opacity=".87"/><path d="M${sx} ${sy} Q${cx} ${cy-2} ${ex} ${ey}" fill="none" stroke="#fff4cb" stroke-width="1.1" stroke-linecap="round" opacity=".45"/><path d="${reference}" fill="none" stroke="#a28aad" stroke-width=".8" stroke-dasharray="2 4" opacity=".58"/>`;
    }).join('');
    return svg(id, 'Your morning activation', `${labels[state]}. A hand-drawn sun sends out five softly shaded rays. Each personal ray overlays the same reference outline and is ${state === 'above' ? 'thicker' : state === 'below' ? 'thinner' : 'within the reference width'}.`, `
      <defs>
        <linearGradient id="${id}-paint" x1="100" y1="130" x2="326" y2="150" gradientUnits="userSpaceOnUse"><stop stop-color="#f4c76b"/><stop offset=".28" stop-color="#f2c181"/><stop offset=".64" stop-color="#e6adad"/><stop offset="1" stop-color="#b69ddd"/></linearGradient>
        <radialGradient id="${id}-sun-glow"><stop stop-color="#f8d789" stop-opacity=".55"/><stop offset="1" stop-color="#f8d789" stop-opacity="0"/></radialGradient>
        <radialGradient id="${id}-sun-paint" cx=".32" cy=".24" r=".92"><stop stop-color="#fff3b6"/><stop offset=".42" stop-color="#fbd586"/><stop offset=".77" stop-color="#efb57c"/><stop offset="1" stop-color="#d59486"/></radialGradient>
        <filter id="${id}-sun-shadow" x="-80%" y="-80%" width="260%" height="260%"><feDropShadow dx="1" dy="5" stdDeviation="5" flood-color="#c7a074" flood-opacity=".17"/></filter>
      </defs>
      <ellipse cx="78" cy="131" rx="83" ry="85" fill="url(#${id}-sun-glow)"/>
      <path d="M40 62 Q61 50 82 53 M48 206 Q66 215 84 211" fill="none" stroke="#e0bb8e" stroke-width=".8" stroke-linecap="round" opacity=".48"/>
      ${rays}
      <path d="M47 82 L42 72 M29 105 L17 100 M25 132 L11 133 M33 162 L21 170 M57 179 L54 191" fill="none" stroke="#e3b181" stroke-width="2" stroke-linecap="round" opacity=".7"/>
      <path d="M45 83 L44 78 M29 106 L23 104 M26 132 L19 133 M33 162 L28 166 M57 180 L56 185" fill="none" stroke="#fff1c6" stroke-width=".9" stroke-linecap="round" opacity=".6"/>
      <g filter="url(#${id}-sun-shadow)">
        <path d="M71 94 C91 92 108 109 108 130 C109 151 91 169 70 168 C49 170 32 150 34 130 C32 109 49 92 71 94Z" fill="url(#${id}-sun-paint)" stroke="#d8aa80" stroke-width=".8"/>
        <path d="M43 116 Q52 99 71 101" fill="none" stroke="#fff6cb" stroke-width="3" stroke-linecap="round" opacity=".7"/>
        <path d="M55 128 Q59 125 63 128 M79 127 Q83 124 87 127" fill="none" stroke="#8c694f" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M63 143 Q72 149 80 141" fill="none" stroke="#8c694f" stroke-width="1.7" stroke-linecap="round"/>
        <ellipse cx="50" cy="138" rx="4" ry="2.4" fill="#eaa28b" opacity=".42"/><ellipse cx="91" cy="136" rx="4" ry="2.4" fill="#eaa28b" opacity=".42"/>
      </g>
      <text x="34" y="246" style="font-size:9px;fill:#9b8272">Waking</text>
      <text x="325" y="246" text-anchor="end" style="font-size:9px;fill:#8d789c">Few hours later</text>
    `);
  }

  function decline(state) {
    const id = 'diurnal-decline';
    const shapes = {
      close: 'M103 68 C178 73 221 109 324 113 Q333 130 324 147 C221 151 178 187 103 192 Q96 130 103 68Z',
      above: 'M103 68 C152 95 168 122 324 125 Q330 130 324 135 C168 138 152 165 103 192 Q96 130 103 68Z',
      below: 'M103 68 C194 77 252 89 324 92 Q338 130 324 168 C252 171 194 184 103 192 Q96 130 103 68Z'
    };
    const outer='M103 58 C185 68 217 99 323 105 Q338 130 323 155 C217 161 185 194 103 202 Q91 130 103 58Z';
    const inner='M103 80 C184 87 223 117 323 122 Q328 130 323 138 C223 143 184 173 103 180 Q98 130 103 80Z';
    return svg(id, 'Your pace of winding down', `${labels[state]}. This provisional sound ribbon compares your rate of fading with a faint outlined reference envelope.`, `
      <defs>
        <linearGradient id="${id}-ribbon" x1="100" y1="86" x2="331" y2="162" gradientUnits="userSpaceOnUse"><stop stop-color="#f3cd79"/><stop offset=".33" stop-color="#e9b292"/><stop offset=".65" stop-color="#d89cbc"/><stop offset="1" stop-color="#a383c4"/></linearGradient>
        <linearGradient id="${id}-cabinet" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d2b9e2"/><stop offset=".45" stop-color="#b79acb"/><stop offset="1" stop-color="#9475ae"/></linearGradient>
        <radialGradient id="${id}-cone" cx=".35" cy=".25" r=".9"><stop stop-color="#fff0b2"/><stop offset=".5" stop-color="#dfb183"/><stop offset="1" stop-color="#ab859c"/></radialGradient>
      </defs>
      <ellipse cx="60" cy="190" rx="34" ry="9" fill="#a48caf" opacity=".13" filter="url(#${id}-soft)"/>
      <path d="${outer}" fill="#cab3da" opacity=".28"/>
      <path d="${inner}" fill="#f1e4ef" opacity=".8"/>
      <path d="${shapes[state]}" fill="url(#${id}-ribbon)" opacity=".9"/>
      <path d="${shapes[state]}" fill="none" stroke="#f8decb" stroke-width=".8" opacity=".65"/>
      <path d="${outer}" class="ref-line" opacity=".78"/><path d="${inner}" class="ref-line" opacity=".5"/>
      <g transform="translate(32 79)">
        <path d="M2 12 Q2 5 10 4 L39 0 Q43 0 47 4 L61 14 Q65 17 65 23 L65 93 Q65 99 59 101 L22 109 Q16 110 10 104 L2 96Z" fill="#9774ad"/>
        <path d="M2 12 Q2 5 10 4 L39 0 Q44 1 44 9 L44 89 Q44 98 37 99 L13 104 Q4 104 2 96Z" fill="url(#${id}-cabinet)"/>
        <path d="M9 16 Q9 11 14 10 L33 7 Q38 7 38 12 L38 83 Q38 90 33 91 L14 94 Q9 94 9 89Z" fill="#cfb5dc" stroke="#b799c4" stroke-width=".8"/>
        <ellipse cx="23" cy="62" rx="12" ry="17" fill="#8d6aa3"/>
        <ellipse cx="23" cy="61" rx="9.5" ry="14" fill="url(#${id}-cone)"/>
        <ellipse cx="23" cy="60" rx="3.8" ry="5.5" fill="#eccf9b"/>
        <ellipse cx="23" cy="27" rx="5" ry="7" fill="#90759f"/>
        <ellipse cx="23" cy="25" rx="2.4" ry="3.5" fill="#b996c7"/>
        <path d="M47 10 L58 18 M49 97 L60 94 M11 101 L36 96" fill="none" stroke="#edddf1" stroke-width=".9" opacity=".5"/>
      </g>
      <text x="99" y="244" style="font-size:9px">Few hours after waking</text><text x="330" y="244" text-anchor="end" style="font-size:9px">Evening</text>
    `);
  }

  function room(state) {
    const id = 'evening-fraction';
    const reference = 'M100 100 L143 91 L306 177 L230 224Z';
    const beam = {
      close: 'M100 100 L143 91 L296 183 L238 218Z',
      above: 'M100 100 L143 91 L330 163 L210 235Z',
      below: 'M100 100 L143 91 L278 193 L257 208Z'
    }[state];
    const pool = {
      close: 'M180 154 L296 183 L238 218 L148 189Z',
      above: 'M180 154 L330 163 L210 235 L110 208Z',
      below: 'M180 154 L278 193 L257 208 L169 179Z'
    }[state];
    return svg(id, 'The day lingering into evening', `${labels[state]}. A quiet monochromatic room receives a warm yellow shaft of daylight through its window. Your solid beam overlays a translucent reference beam and is ${state === 'above' ? 'wider' : state === 'below' ? 'narrower' : 'within the reference width'}.`, `
      <defs>
        <radialGradient id="${id}-room-background" cx=".44" cy=".3" r=".85"><stop stop-color="#4d465c"/><stop offset=".6" stop-color="#312d3e"/><stop offset="1" stop-color="#282533"/></radialGradient>
        <linearGradient id="${id}-wall-left" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#746c85"/><stop offset=".45" stop-color="#655d75"/><stop offset="1" stop-color="#4a445b"/></linearGradient>
        <linearGradient id="${id}-wall-right" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#50495f"/><stop offset=".68" stop-color="#3e394d"/><stop offset="1" stop-color="#312d41"/></linearGradient>
        <linearGradient id="${id}-floor" x1="0" y1="0" x2=".6" y2="1"><stop stop-color="#4e475f"/><stop offset=".48" stop-color="#746b80"/><stop offset="1" stop-color="#595064"/></linearGradient>
        <linearGradient id="${id}-beam-volume" x1=".15" y1=".15" x2=".8" y2="1"><stop stop-color="#fff3a4" stop-opacity=".92"/><stop offset=".45" stop-color="#f3da77" stop-opacity=".5"/><stop offset="1" stop-color="#eed476" stop-opacity=".16"/></linearGradient>
        <linearGradient id="${id}-pool" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f9e48f" stop-opacity=".65"/><stop offset="1" stop-color="#e9ca6b" stop-opacity=".28"/></linearGradient>
        <linearGradient id="${id}-cushion-top" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#a195b2"/><stop offset=".4" stop-color="#897d9b"/><stop offset="1" stop-color="#5f536e"/></linearGradient>
        <linearGradient id="${id}-cushion-side" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#786b8b"/><stop offset="1" stop-color="#473d58"/></linearGradient>
        <filter id="${id}-floor-blur" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="4.5"/></filter>
        <clipPath id="${id}-architecture"><path d="M39 48 L181 23 L325 61 L325 202 L184 246 L39 192Z"/></clipPath>
        <clipPath id="${id}-beam-mask"><path d="${beam}"/></clipPath>
      </defs>
      <rect width="360" height="260" fill="url(#${id}-room-background)"/>
      <ellipse cx="178" cy="228" rx="144" ry="23" fill="#151322" opacity=".35" filter="url(#${id}-blur)"/>
      <path d="M39 48 L181 23 L181 153 L39 192Z" fill="url(#${id}-wall-left)"/>
      <path d="M181 23 L325 61 L325 202 L181 153Z" fill="url(#${id}-wall-right)"/>
      <path d="M39 192 L181 153 L325 202 L184 246Z" fill="url(#${id}-floor)"/>
      <path d="M39 48 L181 23 L325 61 M181 23 L181 153 L39 192 M181 153 L325 202 L184 246 L39 192" fill="none" stroke="#c0b4cf" stroke-width=".75" opacity=".32"/>
      <path d="M41 185 L181 146 L323 195" fill="none" stroke="#242035" stroke-width="1.6" opacity=".65"/>
      <path d="M42 187 L181 148 L322 197" fill="none" stroke="#8d819e" stroke-width=".7" opacity=".4"/>
      <g clip-path="url(#${id}-architecture)">
        <path d="M85 207 L226 169 M134 227 L276 185 M48 177 L239 231 M102 162 L291 216" fill="none" stroke="#b7a9c2" stroke-width=".45" opacity=".12"/>
        <path d="M178 24 L181 153 L195 157 L193 26Z" fill="#211e2f" opacity=".18"/>
        <path d="${reference}" fill="#ffe7a0" opacity=".13"/>
        <path d="${pool}" fill="url(#${id}-pool)" filter="url(#${id}-floor-blur)"/>
        <path d="${pool}" fill="url(#${id}-pool)" opacity=".62"/>
      </g>
      <path d="M94 63 L150 53 L150 98 L94 109Z" fill="#353044"/>
      <path d="M99 67 L145 59 L145 94 L99 103Z" fill="#dbcc8c"/>
      <path d="M102 68 L142 61 L142 92 L102 100Z" fill="#fff3b2"/>
      <path d="M99 103 L145 94 L150 98 L94 109Z" fill="#aaa08e"/>
      <path d="M94 109 L150 98 L150 101 L94 112Z" fill="#49414f"/>
      <path d="M123 65 L123 97 M101 84 L143 76" fill="none" stroke="#777267" stroke-width="2.4"/>
      <path d="M102 68 L142 61" fill="none" stroke="#fffad5" stroke-width="1" opacity=".8"/>
      <ellipse cx="122" cy="84" rx="31" ry="28" fill="#ffe89a" opacity=".1" filter="url(#${id}-blur)"/>
      <ellipse cx="254" cy="199" rx="39" ry="11" fill="#292235" opacity=".65" filter="url(#${id}-soft)"/>
      <path d="M232 143 C246 138 264 141 275 151 L282 174 L272 195 C260 205 233 198 224 189 L218 166Z" fill="url(#${id}-cushion-side)"/>
      <path d="M232 143 C247 137 270 141 278 153 C281 162 267 175 254 181 C241 183 222 176 218 166 C218 157 222 148 232 143Z" fill="url(#${id}-cushion-top)"/>
      <path d="M232 147 C244 141 263 143 271 151 C274 157 263 168 251 173 C239 174 226 169 224 162" fill="none" stroke="#b8aac6" stroke-width=".8" opacity=".45"/>
      <path d="M248 181 C246 187 247 193 252 197" fill="none" stroke="#372d46" stroke-width=".85" opacity=".55"/>
      <g clip-path="url(#${id}-architecture)">
        <path d="${beam}" fill="url(#${id}-beam-volume)"/>
        <g clip-path="url(#${id}-beam-mask)" opacity=".12" fill="#f9efa9"><circle cx="186" cy="136" r=".75"/><circle cx="156" cy="114" r=".8"/><circle cx="207" cy="157" r=".7"/><circle cx="233" cy="177" r=".9"/><circle cx="185" cy="158" r=".7"/><circle cx="273" cy="189" r=".7"/></g>
        <path d="${reference}" fill="none" stroke="#fff0b9" stroke-width="1" stroke-dasharray="3 4" opacity=".67"/>
        <path d="M100 100 L${state === 'above' ? '210 235' : state === 'below' ? '257 208' : '238 218'} M143 91 L${state === 'above' ? '330 163' : state === 'below' ? '278 193' : '296 183'}" fill="none" stroke="#ffef9d" stroke-width=".75" opacity=".52"/>
      </g>
      <path d="M39 48 L181 23 L325 61" fill="none" stroke="#d0c1dd" stroke-width=".75" opacity=".3"/>
    `);
  }

  const art = { 'evening-level': window.TraceEveningIllustration || evening, 'total-auc': window.TraceAucIllustration || aura, 'morning-activation': window.TraceMorningIllustration || morning, 'diurnal-decline': window.TraceDeclineIllustration || decline, 'evening-fraction': window.TraceEveningFractionIllustration || room };
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function setDefinitionOpen(wrap, open) {
    wrap.classList.toggle('open', open);
    wrap.querySelector('.info-btn').setAttribute('aria-expanded', String(open));
    wrap.querySelector('.info-pop').hidden = !open;
    if (open) positionDefinition(wrap);
  }
  function positionDefinition(wrap) {
    wrap.dataset.infoSide = 'below';
    const panel = wrap.querySelector('.info-pop').getBoundingClientRect();
    const heading = wrap.getBoundingClientRect();
    const dock = document.querySelector('#characteristics-screen .screen-action');
    const bottom = Math.min(innerHeight, dock ? dock.getBoundingClientRect().top : innerHeight) - 12;
    if (panel.bottom > bottom && heading.top - panel.height - 10 >= 12) {
      wrap.dataset.infoSide = 'above';
    }
  }
  function closeDefinitions(except) {
    root.querySelectorAll('.info-title.open').forEach(wrap => {
      if (wrap !== except) setDefinitionOpen(wrap, false);
    });
  }
  function definitionTitle(item, title) {
    let openedOnHover = false;
    const wrap = element('div', 'info-title');
    const button = element('button', 'info-btn');
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.25"/><path d="M12 11v5"/><circle class="info-dot" cx="12" cy="7.75" r=".85"/></svg>';
    button.type = 'button';
    button.setAttribute('aria-label', 'What is ' + item.title.toLowerCase() + '?');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', item.id + '-info');
    const definition = element('div', 'info-pop', item.description);
    definition.id = item.id + '-info';
    definition.setAttribute('role', 'note');
    definition.hidden = true;
    wrap.append(title, button, definition);
    button.addEventListener('click', event => {
      event.stopPropagation();
      // A first click pins a hovered definition open; the next click closes it.
      const open = openedOnHover || !wrap.classList.contains('open');
      openedOnHover = false;
      closeDefinitions(wrap);
      setDefinitionOpen(wrap, open);
    });
    if (matchMedia('(hover:hover)').matches) {
      wrap.addEventListener('mouseenter', () => {
        if (!wrap.classList.contains('open')) {
          openedOnHover = true;
          closeDefinitions(wrap);
          setDefinitionOpen(wrap, true);
        }
      });
      wrap.addEventListener('mouseleave', () => {
        if (document.activeElement !== button) setDefinitionOpen(wrap, false);
      });
    }
    return wrap;
  }
  document.addEventListener('click', event => {
    if (!event.target.closest('.info-title')) closeDefinitions();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeDefinitions();
  });
  window.addEventListener('resize', () => {
    root.querySelectorAll('.info-title.open').forEach(positionDefinition);
  });
  function render(mode) {
    root.replaceChildren();
    copy.forEach((item, index) => {
      const example = examples[item.id], measured = mode === 'sample' && participant ? participant[item.id] : null;
      const state = measured ? measured.state : mode === 'mixed' ? example.mixed : mode;
      const value = measured ? measured.value : example.values[state], words = item.states[state];
      const article = element('section', 'characteristic'); article.id = item.id;
      article.dataset.state = state;
      article.dataset.readingSource = measured ? 'sample' : 'example';
      article.setAttribute('aria-labelledby', item.id+'-title');
      const title = element('h2', '', item.title); title.id = item.id+'-title';
      const stage = element('div', 'art-stage '+item.id); stage.innerHTML = art[item.id](state, value, measured ? participantSample : undefined);
      const row = element('div', 'reading-row');
      const display = item.id === 'evening-fraction' ? value.toFixed(2) : measured ? String(Number(value.toFixed(2))) : String(value);
      const reading = element('div', 'reading-value', display);
      reading.dataset.value = String(value);
      reading.append(element('span', 'reading-unit', example.unit));
      row.append(reading);
      const meaning = element('div', 'meaning');
      meaning.append(element('p', '', words.copy));
      if (root.closest('#characteristics-screen')) {
        article.append(definitionTitle(item, title));
        const card = element('div', 'characteristic-result-card');
        card.append(row, stage, meaning);
        article.append(card);
      } else {
        article.append(title, element('p', 'description', item.description), row, stage, meaning);
      }
      root.append(article);
    });
  }
  const control = document.getElementById('preview-state');
  if (control) control.addEventListener('change', () => render(control.value));
  if (participant) window.TraceCharacteristicsReport = Object.freeze({ update(input) {
    participantSample = model.validate(input);
    participant = participantModel.calculate(participantSample);
    if (control) control.value = 'sample';
    render('sample');
  } });
  document.querySelectorAll('.preview-panel nav a').forEach(link => link.addEventListener('click', () => { link.closest('details').open = false; }));
  render(control ? control.value : participant ? 'sample' : 'mixed');
})();
