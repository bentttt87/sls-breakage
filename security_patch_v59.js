// SLS Breakage Monitoring v59 — minimum production role hardening.
(function(){
  const BUILD_LABEL='BUILD v59';
  function setBuild(){const el=document.getElementById('slsMonBuildBadge');if(el)el.textContent=BUILD_LABEL}
  setBuild();

  const baseOpenRecon=window.openRecon;
  if(typeof baseOpenRecon==='function'){
    window.openRecon=function(){
      if(!ACCESS?.is_master&&ACCESS?.role!=='rdc_manager'){
        alert('Monthly Reconciliation hanya dapat dibuka oleh RDC Manager atau Master.');
        return;
      }
      return baseOpenRecon.apply(this,arguments);
    };
  }

  const baseRecon4=window.recon4;
  if(typeof baseRecon4==='function'){
    window.recon4=function(decisions){
      if(!ACCESS?.is_master){
        $('reconWizard').innerHTML=steps(4)+`<div class="hint"><b>Review RDC selesai.</b> Publish final reconciliation hanya dapat dilakukan oleh Master Nasional.</div>`;
        return;
      }
      return baseRecon4(decisions);
    };
  }

  const baseRenderRecon=window.renderReconPage;
  if(typeof baseRenderRecon==='function'){
    window.renderReconPage=renderReconPage=function(){
      const out=baseRenderRecon.apply(this,arguments);
      if(!ACCESS?.is_master&&ACCESS?.role!=='rdc_manager'){
        document.querySelectorAll('#reconBody button').forEach(b=>{
          if((b.textContent||'').toLowerCase().includes('start final reconciliation'))b.classList.add('hidden');
        });
      }
      setBuild();
      return out;
    };
  }

  setTimeout(setBuild,500);
  window.__SLS_BREAKAGE_SECURITY_PATCH='v59';
})();