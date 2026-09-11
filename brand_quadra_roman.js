// Official QUADRA + ROMAN branding for SLS Breakage Monitoring.
(function(){
  'use strict';
  const BRAND_SRC='https://raw.githubusercontent.com/bentttt87/sls-wms/main/quadra-roman-logo.svg?v=20260911';
  function brandImg(width){return `<img src="${BRAND_SRC}" alt="QUADRA ROMAN" style="width:${width}px;height:auto;max-height:86px;object-fit:contain;display:block">`;}
  function apply(){
    const login=document.getElementById('loginLogo');
    const side=document.getElementById('sideLogo');
    const modal=document.getElementById('modalLogo');
    if(login) login.innerHTML=brandImg(158);
    if(side) side.innerHTML=brandImg(104);
    if(modal) modal.innerHTML=brandImg(76);
    document.querySelectorAll('svg.roman,img[alt="ROMAN"],img[alt="Roman"]').forEach(el=>{
      if(el.closest('#loginLogo,#sideLogo,#modalLogo')) return;
      const img=document.createElement('img');
      img.src=BRAND_SRC;img.alt='QUADRA ROMAN';img.style.width='104px';img.style.height='auto';img.style.objectFit='contain';
      el.replaceWith(img);
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply,{once:true}); else apply();
  setTimeout(apply,500);
})();
