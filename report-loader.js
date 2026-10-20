/* No telemetry, remote resources, local storage or keys sent to the server. */
(async function () {
  'use strict';
  try {
    // Finish the wrapper's parser before replacing its document.
    if (document.readyState !== 'complete') await new Promise(resolve => window.addEventListener('load', resolve, {once:true}));
    if (!crypto.subtle) throw Error('Secure browser context required');
    const payload = JSON.parse(document.getElementById('report-payload').textContent);
    const secret = location.hash.slice(1);
    if (!/^[\w-]{43}$/.test(secret)) throw Error('Missing key');
    const bytes = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
    const keyBytes = bytes(secret.replace(/-/g,'+').replace(/_/g,'/')+'=');
    const key = await crypto.subtle.importKey('raw',keyBytes,'AES-GCM',false,['decrypt']);
    const html = await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(payload.iv),additionalData:new TextEncoder().encode('Trace report v1:'+payload.id),tagLength:128},key,bytes(payload.data));
    document.open();document.write(new TextDecoder().decode(html));document.close();
  } catch (_) {
    document.getElementById('message').textContent = 'This report needs the complete link shared with you. Please check the link and try again.';
  }
})();
