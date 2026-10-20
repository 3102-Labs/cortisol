(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const image = $('share-image');
  let current = null;
  let revision = 0;
  let asset = null;
  let busy = false;
  const styles = [...document.querySelectorAll('input[name="share-treatment"]')];
  const scripts = new Map();

  function status(message, error = false) {
    $('share-status').textContent = message;
    $('share-status').dataset.tone = error ? 'error' : 'info';
  }
  function supportsSharing(file) {
    try {
      return window.isSecureContext && typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
    } catch (_) { return false; }
  }
  function controls() {
    $('share-native').disabled = busy || !asset;
    $('share-save').disabled = busy || !asset;
    $('share-native-label').textContent = busy === 'share' ? 'Opening share menu…' : 'Share image';
    $('share-save').setAttribute('aria-busy', String(busy === 'download'));
    styles.forEach(control => { control.disabled = busy === 'share' || busy === 'download'; });
  }

  function loadScript(file) {
    if (scripts.has(file)) return scripts.get(file);
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = file + '?v=sans-sentence-caption-20261020';
      script.onload = resolve;
      script.onerror = () => { script.remove(); scripts.delete(file); reject(new Error('Artwork unavailable')); };
      document.head.append(script);
    });
    scripts.set(file, promise);
    return promise;
  }

  // Self-contained SVG keeps the exact approved paper/font bytes and transparent edges.
  // No participant name, numerical reading labels or characteristic fixtures are exported.
  async function drawArtefact(snapshot, treatment) {
    const designs = window.TraceArtefactDesigns;
    if (!designs) throw new Error('Artwork renderer unavailable');
    const variant = designs.variants.find(item => item.key === snapshot.archetype) || designs.variants[0];
    await Promise.all([
      loadScript('artefacts/runtime/fonts.js'),
      loadScript('artefacts/runtime/' + variant.key + '.js')
    ]);
    const svg = designs.render(snapshot, {
      treatment,
      fontStyle: window.TraceArtefactFonts,
      backgroundData: window.TraceArtefactPapers[variant.key]
    });
    const canvas = document.createElement('canvas');
    canvas.width = 1086; canvas.height = 1448;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Image rendering unavailable');
    const svgURL = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    try {
      const artwork = new Image();
      await new Promise((resolve, reject) => {
        artwork.onload = resolve;
        artwork.onerror = () => reject(new Error('Could not render artwork'));
        artwork.src = svgURL;
      });
      ctx.drawImage(artwork, 0, 0);
      return await new Promise((resolve, reject) => canvas.toBlob(blob => {
        if (blob) resolve(blob); else reject(new Error('Could not prepare image'));
      }, 'image/png'));
    } finally { URL.revokeObjectURL(svgURL); }
  }

  async function prepare(data) {
    // Copy only fields permitted in the image, not the participant record.
    const snapshot = { date: data.date, rhythmDisplay: data.rhythmDisplay, archetype: data.archetype,
      w: data.w, w2: data.w2, e: data.e, eveningHours: data.eveningHours };
    const treatment = styles.find(control => control.checked).value;
    const key = JSON.stringify({ snapshot, treatment });
    if (current && current.key === key && asset) return;
    current = { key, snapshot };
    const version = ++revision;
    busy = 'render';
    if (asset) URL.revokeObjectURL(asset.url);
    asset = null;
    image.hidden = true; image.removeAttribute('src');
    $('share-loading').hidden = false;
    $('share-loading').textContent = 'Preparing your preview…';
    $('share-preview-stage').setAttribute('aria-busy', 'true');
    $('share-retry').hidden = true;
    status(''); controls();
    try {
      const sharedDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
        .format(new Date(snapshot.date + 'T00:00:00Z'));
      const blob = await drawArtefact(snapshot, treatment);
      if (version !== revision) return;
      const label = treatment === 'meter' ? 'score' : 'rhythm';
      const file = new File([blob], `trace-cortisol-${label}-${snapshot.date}.png`, { type: 'image/png' });
      asset = { file, url: URL.createObjectURL(blob) };
      image.src = asset.url;
      image.alt = `Trace ${label} story overlay. Rhythm score ${snapshot.rhythmDisplay} out of 100. Sample collected ${sharedDate}. Percentile is a fixed prototype example. No name or raw reading labels.`;
      image.hidden = false;
      $('share-loading').hidden = true;
    } catch (_) {
      if (version !== revision) return;
      $('share-loading').textContent = 'Your image couldn’t be prepared.';
      $('share-retry').hidden = false;
      status('Please try again. Your report is still here.', true);
    } finally {
      if (version === revision) {
        busy = false;
        $('share-preview-stage').setAttribute('aria-busy', 'false');
        controls();
      }
    }
  }

  styles.forEach(control => control.addEventListener('change', () => { if (current) prepare(current.snapshot); }));

  $('share-native').addEventListener('click', async () => {
    if (!asset || busy) return;
    if (!supportsSharing(asset.file)) { controls(); status('Save the image to share it from your gallery.'); return; }
    const version = revision;
    busy = 'share'; controls(); status('');
    try {
      // The file is ready before the click so navigator.share retains user activation.
      await navigator.share({ files: [asset.file] });
      if (version === revision) status('Your image was handed to the share menu. Finish posting in the app you chose.');
    } catch (error) {
      if (version !== revision) return;
      if (error.name === 'AbortError') status('Sharing cancelled. Your image is ready when you are.');
      else status('The share menu couldn’t open. Try again, or save the image and add it to your story.', true);
    } finally {
      if (version === revision) { busy = false; controls(); }
    }
  });
  $('share-save').addEventListener('click', async () => {
    if (!asset || busy) return;
    const version = revision;
    busy = 'download'; controls(); status('');
    try {
      // Paint the in-button progress state before handing the ready file to the browser.
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      if (version !== revision) return;
      const link = document.createElement('a');
      link.href = asset.url; link.download = asset.file.name;
      document.body.append(link); link.click(); link.remove();
    } catch (_) {
      if (version === revision) status('The image couldn’t be saved. Please try again.', true);
    } finally {
      if (version === revision) { busy = false; controls(); }
    }
  });
  $('share-retry').addEventListener('click', () => { if (current) prepare(current.snapshot); });
  window.TraceReportShare = Object.freeze({ prepare });
})();
