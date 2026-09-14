// SLS Breakage Monitoring branding v93 — use exact user-approved QUADRA + ROMAN artwork together, without cropping or overlap.
(function(){
  'use strict';
  const SRC='https://raw.githubusercontent.com/bentttt87/sls-breakage-input/main/brand_quadra_roman_v92.svg?v=20260914-2035';
  const $=id=>document.getElementById(id);
  function logo(width){return `<img src="${SRC}" alt="QUADRA + ROMAN" style="display:block;width:${width}px;max-width:100%;height:auto;object-fit:contain">`;}
  function apply(){
    const login=$('loginLogo'),side=$('sideLogo'),modal=$('modalLogo');
    if(login)login.innerHTML=logo(205);
    if(side)side.innerHTML=logo(116);
    if(modal)modal.innerHTML=logo(100);
    document.querySelectorAll('.brand-pair-v92').forEach(x=>{const w=document.createElement('div');w.style.cssText='display:flex;align-items:center;justify-content:center';w.innerHTML=logo(112);x.replaceWith(w);});
  }
  [20,120,350,900,1800].forEach(ms=>setTimeout(apply,ms));
})();