// SLS Breakage Monitoring v103 — SAP upload allowed for Master + SPV RDC; finalization remains Master only.
(function(){
  'use strict';
  function ready(){return typeof ACCESS!=='undefined' && ACCESS && (ACCESS.role||ACCESS.breakage_role);}
  function role(){return String(ACCESS?.breakage_role||ACCESS?.role||'').toLowerCase();}
  function isMaster(){return !!ACCESS?.is_master || role()==='master';}
  function isSpv(){return role()==='supervisor';}
  function canUpload(){return isMaster()||isSpv();}
  function ensureWarning(uploadBox){
    let w=document.getElementById('sapUploadNote');
    if(!w){w=document.createElement('div');w.id='sapUploadNote';w.className='hint warning';w.style.marginTop='10px';uploadBox.appendChild(w);}
    w.innerHTML='Upload SAP hanya dapat dilakukan oleh <b>Master Nasional</b> atau <b>SPV RDC</b>.';
  }
  function ensureRoleNote(uploadBox){
    let n=document.getElementById('sapDailyMtdNote');
    if(!n){n=document.createElement('div');n.id='sapDailyMtdNote';n.className='small muted';n.style.marginTop='9px';uploadBox.appendChild(n);}
    if(isSpv()) n.innerHTML='SPV dapat upload SAP untuk <b>RDC sendiri</b>. File RDC lain akan ditolak. Finalisasi akhir bulan tetap oleh Master Nasional.';
    else n.textContent='Master Nasional dapat upload seluruh RDC, review hasil, dan melakukan finalisasi akhir bulan.';
  }
  function decorateHistory(){
    if(!isMaster() || typeof MOVEH==='undefined') return;
    const host=document.getElementById('sapHistory');
    const table=host?.querySelector('table');
    if(!table || table.dataset.v103==='1') return;
    table.dataset.v103='1';
    const hr=table.tHead?.rows?.[0]; if(hr){const th=document.createElement('th');th.textContent='Aksi';hr.appendChild(th);}
    const rows=Array.from(table.tBodies?.[0]?.rows||[]);
    const data=(MOVEH||[]).slice(0,30);
    rows.forEach((tr,i)=>{
      const td=document.createElement('td'); const r=data[i];
      if(r && !['FINAL','PUBLISHED'].includes(String(r.status||'').toUpperCase())){
        const b=document.createElement('button'); b.className='mini'; b.textContent='Hapus';
        b.onclick=async()=>{
          if(!confirm(`Hapus riwayat upload SAP ${r.filename}?\nData final/published tidak akan dihapus.`)) return;
          b.disabled=true;
          try{await rpc('breakage_movement_delete_v82',{p_upload_id:r.upload_id}); await loadAll(); setTimeout(apply,100);}
          catch(e){alert('Gagal hapus: '+cleanErr(e.message)); b.disabled=false;}
        };
        td.appendChild(b);
      } else td.textContent='—';
      tr.appendChild(td);
    });
  }
  function apply(){
    if(!ready()) return;
    const allowed=canUpload();
    const sapFile=document.getElementById('sapFile');
    const uploadBox=sapFile?.closest('.uploadbox');
    const monthEndBtn=document.getElementById('monthEndBtn');
    if(uploadBox){
      const label=uploadBox.querySelector('label[for="sapFile"]');
      const mode=document.getElementById('sapMode');
      const title=uploadBox.querySelector('b');
      const sub=uploadBox.querySelector('.sub');
      if(title) title.textContent='Upload SAP Stock & Movement';
      if(sub) sub.textContent=isSpv()?'Upload file SAP untuk RDC Anda sendiri.':'Upload file SAP per RDC untuk pembaruan denominator Breakage.';
      if(allowed){
        if(label){label.style.display='inline-block';label.textContent='Pilih File SAP';}
        if(sapFile) sapFile.disabled=false;
        if(mode){mode.style.display='inline-block'; if(isSpv()&&mode.value==='MONTH_END')mode.value='MTD';}
        document.getElementById('sapUploadNote')?.remove();
        ensureRoleNote(uploadBox);
      }else{
        if(label) label.style.display='none';
        if(sapFile) sapFile.disabled=true;
        if(mode) mode.style.display='none';
        document.getElementById('sapDailyMtdNote')?.remove();
        ensureWarning(uploadBox);
      }
    }
    if(monthEndBtn) monthEndBtn.style.display=isMaster()?'':'none';
    decorateHistory();
  }
  [100,300,700,1400,2500].forEach(ms=>setTimeout(apply,ms));
  document.addEventListener('click',e=>{if(e.target && (e.target.id==='refreshBtn' || e.target.dataset?.page==='sap')) setTimeout(apply,150);});
  window.addEventListener('focus',()=>setTimeout(apply,100));
  window.__SLS_SAP_UPLOAD_ACCESS='v103_master_spv';
})();
