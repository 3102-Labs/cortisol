(function (root) {
  'use strict';
  const reference = Object.freeze({ w: 28, w2: 55, e: 6 });
  const clamp = value => Math.min(100, Math.max(0, value));
  const presets = Object.freeze({
    soft: { w: 18, w2: 35, e: 4 },
    day: { w: 35, w2: 65, e: 4 },
    after: { w: 20, w2: 40, e: 10 },
    high: { w: 40, w2: 65, e: 14 }
  });
  const remarks = Object.freeze({
    soft: { rhythm: 'Your emergency is not on my calendar.', stress: 'Your grindset is interrupting my nothing.' },
    day: { rhythm: 'I deliver and I disappear.', stress: 'Saved the day. Muted the group chat.' },
    after: { rhythm: 'You call it bedtime. I call it studio hours.', stress: 'Your bedtime. My prime time.' },
    high: { rhythm: 'All-day ambition.', stress: 'You have boundaries. I have a shareholder crisis.' }
  });
  function validate(input) {
    const data = { name: String(input.name || '').trim(), date: String(input.date || ''), eveningHours: Number(input.eveningHours) };
    if (!data.name || data.name.length > 80) throw new Error('Enter a name of up to 80 characters.');
    const date = new Date(data.date + 'T00:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== data.date)
      throw new Error('Enter a valid sample collection date.');
    for (const key of ['w', 'w2', 'e']) {
      data[key] = Number(input[key]);
      if (input[key] === '' || input[key] == null || typeof input[key] === 'boolean' || !Number.isFinite(data[key]) || data[key] <= 0 || data[key] > 1000000)
        throw new Error('For this prototype, enter a positive number up to 1,000,000 for each reading.');
    }
    if (!Number.isFinite(data.eveningHours) || data.eveningHours <= 2 || data.eveningHours > 36)
      throw new Error('Evening must be more than 2 and no more than 36 hours after waking.');
    return data;
  }
  function mean(w, m, e, hours) { return ((w + m) + (m + e) / 2 * (hours - 2)) / hours; }
  function calculate(input) {
    const data = validate(input);
    const rhythm = clamp(50 * Math.log2(data.w2 / data.e));
    const stress = clamp(100 * (data.e / data.w2) * Math.max(1, data.w / data.w2));
    const highDay = mean(data.w, data.w2, data.e, data.eveningHours) > mean(reference.w, reference.w2, reference.e, data.eveningHours);
    const highEvening = data.e > reference.e;
    const archetype = highDay ? (highEvening ? 'high' : 'day') : (highEvening ? 'after' : 'soft');
    return { ...data, rhythm, stress, rhythmDisplay: Math.round(rhythm), stressDisplay: Math.round(stress), archetype, remarks: remarks[archetype] };
  }
  // Cubic Hermite segments keep the three observed anchors and preserve shape.
  // The middle derivative is zero for a peak/dip; harmonic slopes cannot create a new extremum.
  function curvePath(values, times, x, y) {
    const h0 = times[1] - times[0], h1 = times[2] - times[1];
    const d0 = (values[1] - values[0]) / h0, d1 = (values[2] - values[1]) / h1;
    const w1 = 2 * h1 + h0, w2 = h1 + 2 * h0;
    const middle = d0 * d1 <= 0 ? 0 : (w1 + w2) / (w1 / d0 + w2 / d1);
    const slopes = [d0, middle, d1];
    const p = n => Number(n.toFixed(4));
    let path = `M ${p(x(times[0]))} ${p(y(values[0]))}`;
    for (let i = 0; i < 2; i++) {
      const h = times[i + 1] - times[i];
      path += ` C ${p(x(times[i] + h / 3))} ${p(y(values[i] + slopes[i] * h / 3))}`;
      path += ` ${p(x(times[i + 1] - h / 3))} ${p(y(values[i + 1] - slopes[i + 1] * h / 3))}`;
      path += ` ${p(x(times[i + 1]))} ${p(y(values[i + 1]))}`;
    }
    return path;
  }
  const api = Object.freeze({ calculate, validate, presets, remarks, reference, curvePath });
  root.TraceReportModel = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
