// SLS Breakage Monitoring v66 — hard UI gate for Monthly Archive.
// Required order: CLOSED -> Full MB51 -> Reconcile -> Publish FINAL -> ARCHIVE -> VERIFY -> DELETE.
(function(){
  const BUILD='BUILD v66';
  const closedPeriod=p=>/^\d{4}-\d{2}$/.test(String(p||''))&&String(p)<new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit'}).format(new Date());
  const setBuild=()=>{const el=document.getElementById('slsMonBuildBadge');if(el)el.textContent=BUILD};
  let gateSeq=0;

  async function finalReadiness(scope){
    return await rpc('breakage_archive_final_readiness_v66',{p_period:PERIOD,p_rdc:scope||'ALL'});
  }
  function scopeNow(){return document.getElementById('archiveScope')?.value||SCOPE||'ALL'}
  function missingLabel(r){const a=Array.isArray(r?.missing_rdcs)?r.missing_rdcs:[];return a.length?a.join(', '):'scope ini'}

  async function applyArchiveGate(){
    const seq=++gateSeq;
    const panel=document.getElementById('monthlyArchivePanel');
    if(!panel||!ACCESS?.is_master)return;
    const dl=document.getElementById('archiveDownloadBtn'),del=document.getElementById('archiveDeleteBtn'),prog=document.getElementById('archiveProgress'),pill=panel.querySelector('.section-title .status-pill');
    const scope=scopeNow();
    if(!closedPeriod(PERIOD)){
      if(dl)dl.disabled=true;if(del)del.disabled=true;
      if(pill){pill.className='status-pill s-watch';pill.textContent='MENUNGGU MONTH-END'}
      return;
    }
    try{
      const r=await finalReadiness(scope);if(seq!==gateSeq)return;
      panel.dataset.finalReady=r?.ready?'1':'0';
      if(!r?.ready){
        if(dl)dl.disabled=true;if(del)del.disabled=true;
        const box=document.getElementById('archiveDeleteBox');if(box)box.style.display='none';
        if(pill){pill.className='status-pill s-watch';pill.textContent='FINAL REQUIRED'}
        if(prog)prog.innerHTML=`<b style="color:#946200">Archive belum dibuka.</b> Periode sudah CLOSED, tetapi reconciliation belum <b>FINAL/PUBLISHED</b> untuk ${esc(missingLabel(r))}. Urutan wajib: Full MB51 → Reconcile → Review Exception → Publish FINAL → Archive.`;
        return;
      }
      if(pill){pill.className='status-pill s-good';pill.textContent='FINAL · ARCHIVE READY'}
      if(dl)dl.disabled=false;
      const s=await rpc('breakage_archive_status_v62',{p_period:PERIOD,p_rdc:scope});if(seq!==gateSeq)return;
      const box=document.getElementById('archiveDeleteBox'),ck=document.getElementById('archiveVerified');
      if(s.status==='NOT_GENERATED'){
        if(prog)prog.innerHTML='<b style="color:#067647">FINAL siap.</b> Klik Download Archive (Excel + Foto), simpan ZIP, lalu lakukan Verify.';
        if(box)box.style.display='none';
      }else if(s.status==='GENERATED'){
        if(prog)prog.innerHTML=`<b>ARCHIVE GENERATED</b> · ${esc(s.filename||'-')} · ${fmt(s.incident_count)} incident · ${fmt(s.evidence_count)} foto. Buka ZIP → cek Excel + minimal 1 foto → centang Verify → Delete Evidence Online.`;
        if(box)box.style.display='block';if(del)del.disabled=!ck?.checked;
      }else if(s.status==='CLEANED'){
        if(prog)prog.innerHTML=`<b style="color:#067647">ARCHIVED & ONLINE EVIDENCE CLEANED</b> · ${esc(s.filename||'-')}. Data incident/KPI/audit tetap online.`;
        if(box)box.style.display='none';
      }
    }catch(e){
      if(seq!==gateSeq)return;
      if(dl)dl.disabled=true;if(del)del.disabled=true;
      if(prog)prog.textContent='Final readiness gagal dicek: '+cleanErr(e?.message||String(e));
    }
    setBuild();
  }

  function wireGate(){
    const panel=document.getElementById('monthlyArchivePanel');if(!panel||panel.dataset.v66Wired==='1')return;
    panel.dataset.v66Wired='1';
    const dl=document.getElementById('archiveDownloadBtn'),del=document.getElementById('archiveDeleteBtn'),scope=document.getElementById('archiveScope'),rf=document.getElementById('archiveRefreshBtn'),ck=document.getElementById('archiveVerified');
    if(dl){
      const base=dl.onclick;dl.onclick=async e=>{
        const prog=document.getElementById('archiveProgress');
        try{const r=await finalReadiness(scopeNow());if(!r?.ready){if(prog)prog.innerHTML=`Archive ditahan: FINAL belum lengkap untuk <b>${esc(missingLabel(r))}</b>.`;await applyArchiveGate();return}await base?.call(dl,e)}finally{setTimeout(applyArchiveGate,100)}
      };
    }
    if(del){
      const base=del.onclick;del.onclick=async e=>{
        const prog=document.getElementById('archiveProgress');
        try{const r=await finalReadiness(scopeNow());if(!r?.ready){if(prog)prog.innerHTML=`Delete ditahan: periode belum FINAL untuk <b>${esc(missingLabel(r))}</b>.`;await applyArchiveGate();return}await base?.call(del,e)}finally{setTimeout(applyArchiveGate,100)}
      };
    }
    scope?.addEventListener('change',()=>setTimeout(applyArchiveGate,30));
    rf?.addEventListener('click',()=>setTimeout(applyArchiveGate,30));
    ck?.addEventListener('change',()=>setTimeout(applyArchiveGate,0));
    const hint=panel.querySelector('.hint');if(hint)hint.innerHTML='<b>Kebijakan wajib:</b> periode harus <b>CLOSED dan FINAL</b> sebelum Archive. Urutan: <b>Full MB51 → Reconcile → Review Exception → Publish FINAL → ARCHIVE → VERIFY → DELETE</b>. Tidak auto-delete; hanya evidence foto Storage yang dibersihkan.';
    setBuild();applyArchiveGate();
  }

  if(typeof renderReconPage==='function'){
    const baseRenderReconV66=renderReconPage;
    renderReconPage=function(){const out=baseRenderReconV66.apply(this,arguments);setTimeout(()=>{wireGate();applyArchiveGate()},0);return out};
    window.renderReconPage=renderReconPage;
  }
  setTimeout(()=>{wireGate();applyArchiveGate()},250);
  setBuild();
  window.__SLS_BREAKAGE_ARCHIVE_GATE='v66-final-required';
})();