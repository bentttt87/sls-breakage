// SLS Breakage Monitoring v81 — SAP upload/reconciliation Master only.
(function(){
  'use strict';
  function apply(){
    const isMaster=!!window.ACCESS?.is_master || String(window.ACCESS?.role||'').toLowerCase()==='master';
    const sapFile=document.getElementById('sapFile');
    const uploadBox=sapFile?.closest('.uploadbox');
    const monthEndBtn=document.getElementById('monthEndBtn');
    if(!isMaster){
      if(uploadBox){
        uploadBox.innerHTML='<b>Upload SAP MB51</b><div class="hint warning" style="margin-top:10px">Upload SAP dan Rekonsiliasi Final hanya dapat dilakukan oleh <b>Master Nasional</b>.</div>';
      }
      if(monthEndBtn) monthEndBtn.style.display='none';
    } else {
      if(monthEndBtn) monthEndBtn.style.display='';
    }
  }
  [0,200,700,1500,3000].forEach(ms=>setTimeout(apply,ms));
  document.addEventListener('click',e=>{
    if(e.target && (e.target.id==='refreshBtn' || e.target.dataset?.page==='sap')) setTimeout(apply,250);
  });
})();
