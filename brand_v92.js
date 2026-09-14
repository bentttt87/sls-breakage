// SLS Breakage Monitoring branding v92 — exact QUADRA + ROMAN logos from uploaded artwork.
(function(){
'use strict';
const SRC='https://raw.githubusercontent.com/bentttt87/sls-wms/main/quadra-roman-logo.svg?v=20260914-1715';
const $=id=>document.getElementById(id);
function img(width){return `<img src="${SRC}" alt="QUADRA ROMAN" style="display:block;width:${width}px;max-width:100%;height:auto;object-fit:contain">`}
function apply(){
  const login=$('loginLogo'),side=$('sideLogo'),modal=$('modalLogo');
  if(login)login.innerHTML=img(190);
  if(side)side.innerHTML=img(94);
  if(modal)modal.innerHTML=img(96);
  document.querySelectorAll('svg.roman,svg[aria-label="ROMAN"],img[alt="ROMAN"],img[alt="Roman"]').forEach(el=>{if(el.closest('#loginLogo,#sideLogo,#modalLogo'))return;const w=document.createElement('div');w.style.cssText='display:flex;align-items:center;justify-content:center;width:120px';w.innerHTML=img(112);el.replaceWith(w)});
}
[30,150,500,1200,2500].forEach(ms=>setTimeout(apply,ms));
})();
