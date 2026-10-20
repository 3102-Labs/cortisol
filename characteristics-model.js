/* Participant calculations use the existing local day-profile definitions.
   Formula/range provenance: docs/provenance/anshika-characteristics.json.
   Reference bands are the prototype's existing illustrative bands. */
(function (root) {
  'use strict';
  const model = root.TraceReportModel || require('./model.js');
  const ranges = Object.freeze({
    'evening-level': Object.freeze([5, 7]),
    'total-auc': Object.freeze([410, 500]),
    'morning-activation': Object.freeze([80, 115]),
    'diurnal-decline': Object.freeze([16, 20]),
    'evening-fraction': Object.freeze([.17, .24])
  });
  function stateFor(value, range) {
    return value < range[0] ? 'below' : value > range[1] ? 'above' : 'close';
  }
  function calculate(input) {
    const { w, w2, e, eveningHours } = model.validate(input);
    const values = {
      'evening-level': e,
      'total-auc': (w + w2) + (w2 + e) / 2 * (eveningHours - 2),
      'morning-activation': 100 * (w2 - w) / w,
      'diurnal-decline': 100 * Math.log(w2 / e) / (eveningHours - 2),
      'evening-fraction': e / ((w + w2 + e) / 3)
    };
    return Object.fromEntries(Object.entries(values).map(([id, value]) =>
      [id, { value, state: stateFor(value, ranges[id]) }]));
  }
  const api = Object.freeze({ calculate, ranges, stateFor });
  root.TraceCharacteristicModel = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
