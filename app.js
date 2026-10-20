(function () {
  'use strict';
  const model = window.TraceReportModel;
  const $ = id => document.getElementById(id);
  const data = model.calculate(window.TraceInitialSample || { name: 'Alex', date: '2026-10-13', w: 20, w2: 40, e: 10, eveningHours: 14 });
  let current = 0;
  const screenNames = ['welcome', 'curve', 'rhythm', 'stress', 'characteristics', 'share'];
  const reportStepTitles = ['Cortisol rhythm', 'Rhythm score', 'Stress score', 'Characteristics'];
  let characteristicsScroll = 0;
  function syncNavigationSpace() {
    const root = document.documentElement;
    root.style.setProperty('--report-top-height', `${$('report-top').getBoundingClientRect().height}px`);
    const action = $(screenNames[current] + '-screen').querySelector('.screen-action');
    root.style.setProperty('--report-action-height', `${action.getBoundingClientRect().height}px`);
  }
  const svgNS = 'http://www.w3.org/2000/svg';
  function svgNode(tag, attrs, text) {
    const node = document.createElementNS(svgNS, tag);
    Object.entries(attrs || {}).forEach(([key, value]) => node.setAttribute(key, value));
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function navigate(index, focus = true) {
    const previous = current;
    if (previous === 4 && index === 5) characteristicsScroll = window.scrollY;
    current = Math.max(0, Math.min(index, screenNames.length - 1));
    $('report').dataset.screen = screenNames[current];
    $('report-top').dataset.screen = screenNames[current];
    if (current === 0) document.querySelector('.welcome-copy').prepend($('report-date'));
    else document.querySelector('.report-header').append($('report-date'));
    screenNames.forEach((name, i) => { $(name + '-screen').hidden = i !== current; });
    $(screenNames[current] + '-screen').querySelector('.screen-action').prepend($('back'));
    $('back').hidden = current === 0;
    const progress = document.querySelector('.progress');
    progress.hidden = current < 1 || current > reportStepTitles.length;
    progress.querySelectorAll('span').forEach((node, i) => node.classList.toggle('done', i < current));
    progress.setAttribute('aria-valuenow', Math.min(current, reportStepTitles.length));
    progress.setAttribute('aria-valuetext', progress.hidden ? (current === 0 ? 'Report not started' : 'Report complete') : `Step ${current} of ${reportStepTitles.length}: ${reportStepTitles[current - 1]}`);
    if (current === 5) window.TraceReportShare.prepare(data);
    if (current === 1) drawCurve();
    syncNavigationSpace();
    if (focus) {
      const title = $(screenNames[current] + '-screen').querySelector('h1');
      title.setAttribute('tabindex', '-1');
      title.focus({ preventScroll: true });
      if (previous === 5 && current === 4) {
        $('open-share').focus({ preventScroll: true });
        window.scrollTo({ top: characteristicsScroll, behavior: 'instant' });
      } else window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }
  function renderData() {
    if (window.TraceCharacteristicsReport) window.TraceCharacteristicsReport.update(data);
    $('person-name').textContent = data.name;
    const reportDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(data.date + 'T00:00:00Z'));
    $('report-date').dateTime = data.date;
    $('report-date').textContent = reportDate;
    $('report-date').setAttribute('aria-label', `Report date: ${reportDate}`);
    for (const kind of ['rhythm', 'stress']) {
      $(kind + '-value').textContent = String(data[kind + 'Display']);
      $(kind + '-meter').setAttribute('aria-valuenow', String(data[kind + 'Display']));
      $(kind + '-meter').setAttribute('aria-valuetext', `${data[kind + 'Display']} out of 100`);
      drawScoreMeter(kind, data[kind]);
    }
    if (current === 1) drawCurve();
  }
  function drawScoreMeter(kind, value) {
    const fraction = Math.max(0, Math.min(1, value / 100));
    const fill = $(kind + '-meter-fill');
    const tones = kind === 'rhythm'
      ? ['#1f394a', '#2b4d60', '#408497', '#6ab2b7']
      : ['#3a2740', '#502f51', '#9a598e', '#d6799b'];
    const particles = [];
    const cloud = [];
    let seed = 7349;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    // A stable scattered cloud with mixed particle sizes and no visible rows.
    for (let attempt = 0; cloud.length < 440 && attempt < 20000; attempt++) {
      const position = .007 + random() * .986;
      const theta = Math.PI * (1 - position);
      const radius = 128 + (random() - .5) * 27.5;
      const cx = 180 + radius * Math.cos(theta);
      const cy = 180 - radius * Math.sin(theta);
      const size = 1.05 + Math.pow(random(), 1.5) * 1.55;
      if (cloud.some(p => (p.cx - cx) ** 2 + (p.cy - cy) ** 2 < (p.size + size + .45) ** 2)) continue;
      const tone = tones[Math.floor(random() * tones.length)];
      cloud.push({ cx, cy, size });
      if (position > fraction) continue;
      particles.push(`<circle cx="${cx.toFixed(3)}" cy="${cy.toFixed(3)}" r="${size.toFixed(2)}" fill="${tone}"/>`);
    }
    fill.innerHTML = particles.join('');
    const angle = Math.PI * (1 - fraction);
    const x = 180 + 128 * Math.cos(angle);
    const y = 180 - 128 * Math.sin(angle);
    $(kind + '-meter-marker').setAttribute('transform', `translate(${x} ${y}) rotate(${-angle * 180 / Math.PI})`);
  }
  function drawCurve() {
    const svg = $('curve-chart');
    const width = Math.round(svg.getBoundingClientRect().width);
    if (width < 100) return;
    const height = 222, left = 10, right = width - 10, top = 14, bottom = 174;
    const values = [data.w, data.w2, data.e], times = [0, 2, data.eveningHours];
    const formatReading = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });
    ['curve-waking-value', 'curve-morning-value', 'curve-evening-value'].forEach((id, i) => { $(id).textContent = formatReading.format(values[i]); });
    // Reuse the existing Evening level design example, not new clinical thresholds.
    const reference = { lower: [16, 30, 5], upper: [35, 65, 7] };
    const referenceStyle = window.TraceReferenceRanges.tokens;
    const ceiling = Math.max(...values, ...reference.upper) * 1.2;
    const x = t => left + (right - left) * t / data.eveningHours;
    const y = value => bottom - (bottom - top) * value / ceiling;
    const path = model.curvePath(values, times, x, y);
    const referenceUpper = model.curvePath(reference.upper, times, x, y);
    const referenceLower = model.curvePath([...reference.lower].reverse(), [...times].reverse().map(t => -t), t => x(-t), y);
    const referenceBand = referenceUpper + ' ' + referenceLower.replace(/^M/, 'L') + ' Z';
    svg.replaceChildren();
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('aria-label', `Cortisol rhythm: waking ${data.w}, waking plus 2 hours ${data.w2}, evening ${data.e}, all in ng per mg creatinine. Evening is ${data.eveningHours} hours after waking.`);
    svg.append(svgNode('title', {}, 'Your cortisol rhythm'), svgNode('desc', {}, 'Three measured values connected by a shape-preserving illustrative curve. The lightly shaded grid band is the existing illustrative reference range: waking 16 to 35, two hours after waking 30 to 65, evening 5 to 7 ng per mg creatinine. Horizontal spacing follows elapsed sample time.'));
    const defs = svgNode('defs');
    const gradient = svgNode('linearGradient', { id: 'curve-gradient', x1: '0%', x2: '100%', y1: '0%', y2: '0%' });
    gradient.append(svgNode('stop', { offset: '0%', 'stop-color': '#eab75b' }), svgNode('stop', { offset: '35%', 'stop-color': '#e29180' }), svgNode('stop', { offset: '65%', 'stop-color': '#bc7eaa' }), svgNode('stop', { offset: '100%', 'stop-color': '#9994c7' }));
    defs.append(gradient);
    const grid = referenceStyle.grid;
    const pattern = svgNode('pattern', { id: 'curve-reference-grid', width: grid.size, height: grid.size, patternUnits: 'userSpaceOnUse', patternTransform: `rotate(${grid.rotation})` });
    pattern.append(svgNode('rect', { width: grid.size, height: grid.size, fill: grid.fill, 'fill-opacity': grid.fill_opacity }), svgNode('path', { d: `M0 0 V${grid.size}`, fill: 'none', stroke: grid.line, 'stroke-opacity': grid.line_opacity, 'stroke-width': grid.line_width }));
    defs.append(pattern);
    const glow = svgNode('filter', { id: 'curve-glow', x: '-35%', y: '-35%', width: '170%', height: '170%' });
    glow.append(svgNode('feGaussianBlur', { stdDeviation: 7 })); defs.append(glow); svg.append(defs);
    const referenceGroup = svgNode('g', { class: 'curve-reference-band', 'aria-hidden': 'true' });
    referenceGroup.append(svgNode('path', { d: referenceBand, fill: 'url(#curve-reference-grid)' }), svgNode('path', { d: referenceBand, fill: 'none', stroke: referenceStyle.colour, 'stroke-opacity': referenceStyle.outline_opacity, 'stroke-width': referenceStyle.outline_width, 'stroke-dasharray': referenceStyle.dot_dash, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    svg.append(referenceGroup);
    const guides = svgNode('g', { class: 'curve-time-guides', fill: 'none', stroke: '#b0a4b6', 'stroke-opacity': .5, 'stroke-width': .8, 'stroke-dasharray': '2 5', 'stroke-linecap': 'round', 'aria-hidden': 'true' });
    values.forEach((value, i) => guides.append(svgNode('path', { d: `M${x(times[i])} ${y(value) + 10} V190` })));
    svg.append(guides);
    svg.append(svgNode('path', { d: path, class: 'curve-soft-glow', fill: 'none', stroke: 'url(#curve-gradient)', 'stroke-width': 18, opacity: .13, filter: 'url(#curve-glow)', 'stroke-linecap': 'round' }));
    svg.append(svgNode('path', { d: path, class: 'curve-reading-line', fill: 'none', stroke: 'url(#curve-gradient)', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    values.forEach((value, i) => {
      const px = x(times[i]), py = y(value);
      svg.append(svgNode('circle', { cx: px, cy: py, class: 'curve-sample', r: 4.5, fill: '#ffffff', stroke: '#625268', 'stroke-width': 1.4 }));
      svg.append(svgNode('text', { x: px, y: 210, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'time-icon', 'aria-label': ['Waking', 'Two hours after waking', 'Evening'][i] }, ['wb_twilight', 'light_mode', 'bedtime'][i]));

    });
  }
  $('open-report').addEventListener('click', () => navigate(1));
  $('show-scores').addEventListener('click', () => navigate(2));
  $('show-stress').addEventListener('click', () => navigate(3));
  $('show-characteristics').addEventListener('click', () => navigate(4));
  $('open-share').addEventListener('click', () => navigate(5));
  $('back').addEventListener('click', () => navigate(current - 1));
  new ResizeObserver(() => { if (current === 1) drawCurve(); }).observe($('report'));
  const navigationObserver = new ResizeObserver(syncNavigationSpace);
  navigationObserver.observe($('report-top'));
  document.querySelectorAll('.screen-action').forEach(node => navigationObserver.observe(node));
  document.fonts.ready.then(() => { if (current === 1) drawCurve(); });
  renderData(); navigate(0, false);
})();
