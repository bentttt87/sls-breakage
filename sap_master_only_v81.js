// SLS Breakage Monitoring v82 — SAP upload/reconciliation Master only, safe UI.
(function(){
  'use strict';
  function ready(){return typeof ACCESS!=='undefined' && ACCESS && ACCESS.role;}
  function isMaster(){return !!ACCESS?.is_master || String(ACCESS?.role||'').toLowerCase()==='master';}
  function ensureWarning(uploadBox){
    let w=document.getElementById('sapMasterOnlyNote');
    if(!w){w=document.createElement('div');w.id='sapMasterOnlyNote';w.className='hint warning';w.style.marginTop='10px';uploadBox.appendChild(w);}
    w.innerHTML='Upload SAP dan Rekonsiliasi Final hanya dapat dilakukan oleh <b>Master Nasional</b>.';
  }
  function ensureDailyNote(uploadBox){
    let n=document.getElementById('sapDailyMtdNote');
    if(!n){n=document.createElement('div');n.id='sapDailyMtdNote';n.className='small muted';n.style.marginTop='9px';uploadBox.appendChild(n);}
    n.textContent='Upload MTD dilakukan setiap hari menggunakan data tanggal 1 bulan berjalan s.d. kemarin. Upload berikutnya tetap dapat dilakukan dan akan memperbarui exposure sementara.';
  }
  function decorateHistory(){
    if(!isMaster() || typeof MOVEH==='undefined') return;
    const host=document.getElementById('sapHistory');
    const table=host?.querySelector('table');
    if(!table || table.dataset.v82==='1') return;
    table.dataset.v82='1';
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
    const master=isMaster();
    const sapFile=document.getElementById('sapFile');
    const uploadBox=sapFile?.closest('.uploadbox');
    const monthEndBtn=document.getElementById('monthEndBtn');
    if(uploadBox){
      const label=uploadBox.querySelector('label[for="sapFile"]');
      const mode=document.getElementById('sapMode');
      if(master){
        if(label) label.style.display='inline-block';
        if(sapFile) sapFile.disabled=false;
        if(mode) mode.style.display='inline-block';
        document.getElementById('sapMasterOnlyNote')?.remove();
        ensureDailyNote(uploadBox);
      }else{
        if(label) label.style.display='none';
        if(sapFile) sapFile.disabled=true;
        if(mode) mode.style.display='none';
        document.getElementById('sapDailyMtdNote')?.remove();
        ensureWarning(uploadBox);
      }
    }
    if(monthEndBtn) monthEndBtn.style.display=master?'':'none';
    decorateHistory();
  }
  [250,700,1400,2500].forEach(ms=>setTimeout(apply,ms));
  document.addEventListener('click',e=>{if(e.target && (e.target.id==='refreshBtn' || e.target.dataset?.page==='sap')) setTimeout(apply,250);});
  window.addEventListener('focus',()=>setTimeout(apply,100));
})();
