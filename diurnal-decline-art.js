(function (root) {
  'use strict';
  const ranges = root.TraceReferenceRanges || (typeof require === 'function' ? require('./reference-ranges.js') : null);
  const treatment = root.TraceIllustrationTreatment || (typeof require === 'function' ? require('./illustration-treatment.js') : null);
  function render(state, value) {
    const selected = ['below', 'close', 'above'].includes(state) ? state : 'close';
    const id = 'diurnal-slope', asset = name => `assets/diurnal-decline/${name}?v=${treatment.version}-native-curve-4`;
    const pace = { below: 'slower than', close: 'within', above: 'faster than' }[selected];
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 320" class="object-art" style="aspect-ratio:360/320;overflow:visible" role="img" aria-labelledby="${id}-title ${id}-desc" data-slope-state="${selected}">
      <title id="${id}-title">Diurnal decline</title>
      <desc id="${id}-desc">A softly padded exponential curve from a few hours after waking towards evening. The personal decline is ${pace} the fixed lightly shaded reference band with a subtle grey dashed outline. The curve follows a constant logarithmic decline rate over an illustrative twelve-hour interval, falling more quickly at first and levelling towards evening. Example log decline rate ${value} percent per hour. Warm gold moves through coral into violet, with a soft glow towards evening. The reference range and normalized curve scale are illustrative.</desc>
      ${ranges.guide(id, 14, 46, 279)}
      ${ranges.guide(id, 346, 46, 279)}
      <g class="decline-wide-composition">
      <image href="assets/diurnal-decline/reference.svg?v=reference-grey-hatch-6" width="360" height="320"/>
      <image class="trace-glow" href="${asset(`halo-${selected}.png`)}" width="360" height="320" opacity="${treatment.colourOpacity}"/>
      <image class="trace-model" href="${asset(`base-${selected}.png`)}" width="360" height="320" opacity="${treatment.modelOpacity}"/>
      <image class="trace-colour" href="${asset(`colour-${selected}.png`)}" width="360" height="320" opacity="${treatment.colourOpacity}"/>
      </g>
      <g class="decline-time-icons" text-anchor="middle" aria-hidden="true">
        <text x="14" y="305" style="font-family:'Trace Time Icons';font-size:16px;font-weight:300;font-feature-settings:'liga';fill:#888888">light_mode</text>
        <text x="346" y="305" style="font-family:'Trace Time Icons';font-size:16px;font-weight:300;font-feature-settings:'liga';fill:#888888">bedtime</text>
      </g>
      ${ranges.tag(id, 198, 260, 'M180 240 C179 234 179 227 180 221', '16–20')}
    </svg>`;
  }
  root.TraceDeclineIllustration = render;
  if (typeof module !== 'undefined' && module.exports) module.exports = { render };
})(typeof globalThis !== 'undefined' ? globalThis : this);
