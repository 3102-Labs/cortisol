(function (root) {
  'use strict';
  const ranges = root.TraceReferenceRanges || (typeof require === 'function' ? require('./reference-ranges.js') : null);
  const treatment = root.TraceIllustrationTreatment || (typeof require === 'function' ? require('./illustration-treatment.js') : null);
  function render(state, value) {
    const selected = ['below', 'close', 'above'].includes(state) ? state : 'close';
    const id = 'evening-lamp';
    const asset = name => `assets/evening-fraction/${name}?v=${treatment.version}-ethereal-diffused-4`;
    const lamp = mode => `<image class="trace-model" href="${asset('base.png')}" width="360" height="420" opacity="${treatment.modelOpacity}"/>
      <image class="trace-glow" href="${asset(`halo-${mode}.png`)}" width="360" height="420" opacity="${treatment.colourOpacity}"/>
      <image class="trace-colour" href="${asset(`colour-${mode}.png`)}" width="360" height="420" opacity="${treatment.colourOpacity}"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 285" class="object-art" style="aspect-ratio:360/285" role="img" aria-labelledby="${id}-title ${id}-desc" data-light-state="${selected}">
      <title id="${id}-title">Evening fraction</title>
      <desc id="${id}-desc">The larger neutral ribbed lantern on the left shows your example evening fraction of ${value}. An oval light field rises from the bottom bulb. A larger fraction gives the lamp a broader light, with a grainy coral centre, orange and amber burnt gradients, golden edges and warm diffused glow. The smaller matching lamp on the right shows the fixed reference glow. The illustrative reference range of 0.17 to 0.24 is shown at the top right of the card. Both lamps use the same material and colour treatment.</desc>
      <g class="lamp-personal" transform="translate(-30 0) scale(.8)" aria-hidden="true">${lamp(selected)}</g>
      <g class="lamp-reference-miniature" transform="translate(244.45 129.36) scale(.38)" aria-hidden="true">${lamp('close')}</g>
      ${ranges.tag(id, 326, 73, null, '0.17–0.24')}
    </svg>`;
  }
  root.TraceEveningFractionIllustration = render;
  if (typeof module !== 'undefined' && module.exports) module.exports = { render };
})(typeof globalThis !== 'undefined' ? globalThis : this);
