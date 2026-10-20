(function (root) {
  'use strict';
  const ranges = root.TraceReferenceRanges || (typeof require === 'function' ? require('./reference-ranges.js') : null);
  const treatment = root.TraceIllustrationTreatment || (typeof require === 'function' ? require('./illustration-treatment.js') : null);
  const reference = [80, 115], maximum = 100, top = 102, bottom = 328;
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  function levelGeometry(value) {
    const numeric = Number(value);
    const amount = Number.isFinite(numeric) ? clamp(numeric / maximum, 0, 1) : 0;
    const y = n => bottom - (bottom - top) * n / maximum;
    return { y: y(amount * maximum), fraction: amount,
      referenceTop: y(reference[1]), referenceBottom: y(reference[0]) };
  }
  function render(state, value) {
    const id = 'morning-coffee', g = levelGeometry(value), referenceLevel = levelGeometry(97.5);
    const asset = name => `assets/morning-activation/${name}?v=${treatment.version}-dreamy-1`;
    function layerDefs(key, level) {
      const halfWidth = 89.5 - (level.y - top) * .159;
      // A shallow elliptical meniscus follows the tapered cup walls.
      const horizon = `M0 ${level.y} H${160 - halfWidth} A${halfWidth} 5 0 0 0 ${160 + halfWidth} ${level.y} H360 V420 H0Z`;
      return `<filter id="${key}-level-feather" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.6"/></filter>
        <mask id="${key}-level-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="360" height="420"><path d="${horizon}" fill="#fff" filter="url(#${key}-level-feather)"/></mask>
        ${treatment.glow.tiers.map(tier => `<filter id="${key}-${tier.name}" x="-70%" y="-80%" width="240%" height="260%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${tier.blur}"/></filter>
        <g id="${key}-emission-${tier.name}"><image href="${asset(`coffee-glow-${tier.name}.png`)}" width="360" height="420" mask="url(#${key}-level-mask)"/></g>`).join('')}`;
    }
    function cup(key, level) {
      return `<g opacity="${level.fraction > 0 ? 1 : 0}">${treatment.glow.tiers.map(tier => `<use href="#${key}-emission-${tier.name}" opacity="${tier.opacity}" filter="url(#${key}-${tier.name})"/>`).join('')}</g>
        <image class="trace-model" href="${asset('base.png')}" width="360" height="420" opacity="${treatment.modelOpacity}"/>
        <g opacity="${level.fraction > 0 ? 1 : 0}"><image class="trace-colour" href="${asset('coffee-colour.png')}" width="360" height="420" opacity="${treatment.colourOpacity}" mask="url(#${key}-level-mask)"/></g>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 315" class="object-art" style="aspect-ratio:360/315" role="img" aria-labelledby="${id}-title ${id}-desc" data-coffee-level="${g.fraction}">
      <title id="${id}-title">Morning activation</title>
      <desc id="${id}-desc">The larger soft neutral 3D coffee cup on the left shows your example morning activation of ${value} percent. Its coffee level rises with activation, with a grainy espresso centre, copper burnt gradients and warm diffused glow. Fill saturates at 100 percent while the number retains higher readings. The smaller matching cup on the right shows a fixed 97.5 percent reference example, the midpoint of the illustrative 80 to 115 percent range shown at the top right of the card. This is a visual metaphor, not coffee consumption.</desc>
      <defs>${layerDefs(id, g)}${layerDefs(id + '-reference', referenceLevel)}</defs>
      <g class="coffee-personal" transform="translate(-14 0) scale(.8)" aria-hidden="true">${cup(id, g)}</g>
      <g class="coffee-reference-miniature" transform="translate(249.77 141.75) scale(.38)" aria-hidden="true">${cup(id + '-reference', referenceLevel)}</g>
      ${ranges.tag(id, 326, 90, null, '80–115')}
    </svg>`;
  }
  root.TraceMorningIllustration = render;
  if (typeof module !== 'undefined' && module.exports) module.exports = { render, levelGeometry };
})(typeof globalThis !== 'undefined' ? globalThis : this);
