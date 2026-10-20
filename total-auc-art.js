(function (root) {
  'use strict';
  const ranges = root.TraceReferenceRanges || (typeof require === 'function' ? require('./reference-ranges.js') : null);
  const treatment = root.TraceIllustrationTreatment || (typeof require === 'function' ? require('./illustration-treatment.js') : null);
  const descriptions = {
    below: 'A smaller green-yellow aura grows from the torso and is clipped inside the seated figurine. The head, lower legs and shoes retain their neutral grey shading.',
    close: 'The entire seated figurine is coloured green with a lime-yellow burnt edge. Its original folds, lighting and 3D shading remain visible.',
    above: 'The entire seated figurine is coloured green. A larger lime-yellow glow follows scaled copies of its head, shoulders, arms, knees and shoes.'
  };
  function render(state, value) {
    const selected = Object.hasOwn(descriptions, state) ? state : 'close';
    const asset = filename => `assets/total-auc/${filename}?v=${treatment.version}`;
    const image = (filename, className, opacity) => `<image class="${className}" href="${asset(filename)}" width="360" height="420" opacity="${opacity}"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 330" class="auc-art" style="aspect-ratio:360/330" role="img" data-aura-state="${selected}" aria-labelledby="auc-comparison-title auc-comparison-desc">
      <title id="auc-comparison-title">Total cortisol exposure</title>
      <desc id="auc-comparison-desc">Your example reading is ${value} ng per mg creatinine hours, shown by the larger figurine on the left. ${descriptions[selected]} The smaller fully green figurine on the right shows the illustrative reference level of 410 to 500 in the same units. Both figures use the same material and colour treatment.</desc>
      <g class="auc-personal" transform="translate(-30 0) scale(.8)" aria-hidden="true">
        ${selected === 'above' ? image('halo-above.png', 'trace-glow', treatment.colourOpacity) : ''}
        ${image('figurine-base.png', 'trace-model', treatment.modelOpacity)}
        ${image(`colour-${selected}.png`, 'trace-colour', treatment.colourOpacity)}
      </g>
      <g class="auc-reference-miniature" transform="translate(246.54 150.99) scale(.38)" aria-hidden="true">
        ${image('figurine-base.png', 'trace-model', treatment.modelOpacity)}
        ${image('colour-close.png', 'trace-colour', treatment.colourOpacity)}
      </g>
      ${ranges.tag('auc-comparison', 326, 97, null, '410–500')}
    </svg>`;
  }
  root.TraceAucIllustration = render;
  if (typeof module !== 'undefined' && module.exports) module.exports = { render };
})(typeof globalThis !== 'undefined' ? globalThis : this);
