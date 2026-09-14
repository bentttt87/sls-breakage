// SLS Breakage Monitoring branding v92 — QUADRA and ROMAN shown as two distinct official logos.
(function(){
  'use strict';
  const SRC='https://raw.githubusercontent.com/bentttt87/sls-wms/main/quadra-roman-logo.svg?v=20260914-1705';
  const $=id=>document.getElementById(id);
  function q(w=86){return `<svg viewBox="0 0 600 160" width="${w}" role="img" aria-label="QUADRA" style="display:block;height:auto"><image href="${SRC}" x="0" y="0" width="600" height="344" preserveAspectRatio="xMidYMid meet"/></svg>`}
  function r(w=86){return `<svg viewBox="0 205 600 139" width="${w}" role="img" aria-label="ROMAN" style="display:block;height:auto"><image href="${SRC}" x="0" y="0" width="600" height="344" preserveAspectRatio="xMidYMid meet"/></svg>`}
  function pair(w=86,stack=false){return `<div class="brand-pair-v92" style="display:flex;${stack?'flex-direction:column;':''}align-items:center;justify-content:center;gap:${stack?'4px':'10px'}">${q(w)}${r(w)}</div>`}
  function apply(){
    const login=$('loginLogo'),side=$('sideLogo'),modal=$('modalLogo');
    if(login)login.innerHTML=pair(118,true);
    if(side)side.innerHTML=pair(72,true);
    if(modal)modal.innerHTML=pair(62,false);
    document.querySelectorAll('img[alt="QUADRA ROMAN"],img[alt="ROMAN"],svg.roman,svg[aria-label="ROMAN"]').forEach(el=>{if(el.closest('.brand-pair-v92')||el.closest('#loginLogo,#sideLogo,#modalLogo'))return;const w=document.createElement('div');w.innerHTML=pair(66,false);el.replaceWith(w.firstElementChild)});
  }
  [30,150,500,1200,2500].forEach(ms=>setTimeout(apply,ms));
})();
