// SLS Breakage Monitoring v58 — production workflow/evidence guard.
// Evidence rule: minimum 1 and maximum 5 photos per incident, locks auto-generated BA,
// and standardizes Master free-text adjustments.
(function(){
  const BUILD_LABEL='BUILD v58';
  let EVIDENCE_URLS=[];

  function setBuild(){const el=document.getElementById('slsMonBuildBadge');if(el)el.textContent=BUILD_LABEL}
  function incidentById(id){return (INCIDENTS||[]).find(x=>Number(x.incident_id)===Number(id))}
  function req(_r){return 1}
  function got(r){return Array.isArray(r?.photo_paths)?r.photo_paths.filter(Boolean).length:0}
  function complete(r){const n=got(r);return n>=1&&n<=5}
  function stClass(st){st=String(st||'').toUpperCase();if(st==='FINAL')return 's-good';if(['APPROVED_SPV','MASTER_REVIEW'].includes(st))return 's-blue';if(st==='RETURNED_ADMIN')return 's-bad';return 's-watch'}
  function stLabel(st){return String(st||'—').replaceAll('_',' ')}
  function upperText(v){return String(v??'').trim().toUpperCase()}
  function canonicalCause(v,oldValue){
    const raw=upperText(v);
    const map={'PERJALANAN':'Perjalanan','SUSUNAN':'Susunan','PACKAGING / PALLET':'Packaging / Pallet','LAINNYA':'Lainnya'};
    return map[raw]||oldValue||v;
  }

  function ensureEvidenceModal(){
    if(document.getElementById('masterEvidenceModal'))return;
    const root=document.createElement('div');root.id='masterEvidenceModal';root.className='overlay';
    root.innerHTML=`<div class="modal" style="max-width:1000px"><div class="modal-head"><div><h2 id="masterEvidenceTitle">Evidence Incident</h2><div id="masterEvidenceMeta" style="font-size:11px;opacity:.82"></div></div><button class="close" id="closeMasterEvidence">✕</button></div><div class="modal-body"><div id="masterEvidenceStatus" class="hint" style="margin-bottom:12px"></div><div id="masterEvidencePhotos" class="review-photos"></div><div id="masterEvidenceMsg" class="errorbox hidden"></div></div><div class="modal-foot"><button class="secondary" id="closeMasterEvidence2">Tutup</button></div></div>`;
    document.body.appendChild(root);
    const css=document.createElement('style');css.textContent='#masterEvidenceModal .review-photos{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}#masterEvidenceModal .review-photos img{width:100%;max-height:420px;object-fit:contain;border:1px solid #dfe5ee;border-radius:8px;background:#f7f9fc}';document.head.appendChild(css);
    const close=()=>{root.classList.remove('show');EVIDENCE_URLS.forEach(URL.revokeObjectURL);EVIDENCE_URLS=[]};
    document.getElementById('closeMasterEvidence').onclick=close;document.getElementById('closeMasterEvidence2').onclick=close;
  }

  async function evidenceBlob(path){
    if(typeof path!=='string'||!path||path.startsWith('/')||path.split('/').includes('..'))throw new Error('Path evidence tidak valid');
    if(window.slsRefreshBreakageMonitoringSession)await window.slsRefreshBreakageMonitoringSession(false).catch(()=>false);
    const encoded=path.split('/').map(encodeURIComponent).join('/');
    const r=await fetch(`${SUPABASE_URL}/storage/v1/object/authenticated/breakage-evidence/${encoded}`,{headers:{apikey:PUBLIC_ANON,Authorization:`Bearer ${auth()}`},signal:AbortSignal.timeout(25000)});
    if(!r.ok)throw new Error('Foto tidak dapat dibuka: '+cleanErr(await r.text()));
    const blob=await r.blob();if(!['image/jpeg','image/png'].includes(blob.type))throw new Error('Format evidence bukan JPEG/PNG');return blob;
  }

  async function showMasterEvidence(id){
    const r=incidentById(id);if(!r)return alert('Incident tidak ditemukan. Refresh data lalu coba kembali.');
    ensureEvidenceModal();const root=document.getElementById('masterEvidenceModal'),paths=Array.isArray(r.photo_paths)?r.photo_paths.filter(Boolean):[];
    document.getElementById('masterEvidenceTitle').textContent='Evidence '+(r.incident_no||'Incident');
    document.getElementById('masterEvidenceMeta').textContent=`${r.rdc||r.rdc_name||'—'} · ${Number(r.qty_box||0)} BOX · ${got(r)} foto · ${r.no_ba||'—'}`;
    const status=document.getElementById('masterEvidenceStatus');status.style.borderColor=complete(r)?'#b7e2ca':'#ffc9c6';status.style.background=complete(r)?'#e8f7ef':'#fff0ef';status.style.color=complete(r)?'#067647':'#c42d26';status.innerHTML=complete(r)?`✓ Evidence lengkap: <b>${got(r)} foto</b>. Rule 1–5 foto per incident. No BA <b>${r.no_ba||'—'}</b> dikunci sistem.`:`⚠ Evidence belum lengkap. Minimal <b>1 foto</b> dan maksimal <b>5 foto</b> per incident. Master Review/Final ditahan.`;
    const photos=document.getElementById('masterEvidencePhotos'),msg=document.getElementById('masterEvidenceMsg');photos.textContent=paths.length?'Memuat evidence…':'Belum ada foto evidence.';msg.classList.add('hidden');root.classList.add('show');
    if(!paths.length)return;
    try{photos.textContent='';for(let i=0;i<paths.length;i++){const blob=await evidenceBlob(paths[i]),url=URL.createObjectURL(blob);EVIDENCE_URLS.push(url);const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';const img=document.createElement('img');img.src=url;img.alt=`Evidence ${i+1} — ${r.incident_no}`;a.appendChild(img);photos.appendChild(a)}}catch(e){msg.classList.remove('hidden');msg.textContent=cleanErr(e.message)+' — review/final ditahan sampai foto dapat dibuka.'}
  }
  window.showMasterEvidence=showMasterEvidence;

  renderIncidentPage=function(){
    const rows=INCIDENTS||[];
    $('incidentBody').innerHTML=`<div class="section-title">Incident — ${monthName(PERIOD)} <span style="margin-left:auto"><button class="primary" onclick="openBreakageInput()">↗ Buka Breakage Input</button></span></div>
    <div class="hint" style="margin-bottom:10px"><b>Workflow produksi:</b> Admin RDC Input → SPV Approve / Return → Master Review → Adjustment bila perlu → Final. <b>No BA digenerate dan dikunci sistem.</b> Evidence wajib 1–5 foto per incident; backend juga menahan approval/final bila evidence kosong.</div>
    <div class="tablewrap"><table class="tbl"><thead><tr><th>Incident</th><th>Tanggal</th><th>RDC</th><th>Jenis</th><th>Item</th><th>Qty</th><th>Evidence</th><th>No BA</th><th>Reported By</th><th>Status</th><th>Workflow</th></tr></thead><tbody>${rows.length?rows.map(r=>{
      const st=String(r.status||'').toUpperCase(),ok=complete(r),act=[];
      act.push(`<button class="secondary" style="padding:6px 8px;font-size:10px" onclick="showMasterEvidence(${r.incident_id})">Foto (${got(r)})</button>`);
      if(ACCESS?.is_master&&st==='APPROVED_SPV'&&ok)act.push(`<button class="primary" style="padding:6px 8px;font-size:10px" onclick="masterIncidentActionV56(${r.incident_id},'START_REVIEW')">Mulai Review</button>`);
      if(ACCESS?.is_master&&st==='APPROVED_SPV'&&!ok)act.push(`<span class="smallnote" style="color:#c42d26">Evidence kurang</span>`);
      if(ACCESS?.is_master&&st==='MASTER_REVIEW'){
        act.push(`<button class="secondary" style="padding:6px 8px;font-size:10px" onclick="adjustIncidentV56(${r.incident_id})">Adjustment</button>`);
        if(ok)act.push(`<button class="primary" style="padding:6px 8px;font-size:10px" onclick="masterIncidentActionV56(${r.incident_id},'FINALIZE')">Final</button>`);else act.push(`<span class="smallnote" style="color:#c42d26">Final ditahan</span>`);
      }
      if(['master','rdc_manager'].includes(ACCESS?.role))act.push(`<button class="secondary" style="padding:6px 8px;font-size:10px" onclick="showIncidentAudit(${r.incident_id})">Audit</button>`);
      const ev=`<span class="status-pill ${ok?'s-good':'s-bad'}">${got(r)} foto ${ok?'✓':'⚠'}</span>`;
      const note=r.spv_note?`<div class="smallnote">SPV: ${esc(r.spv_note)}</div>`:'';
      return `<tr><td>${esc(r.incident_no)}</td><td>${esc(r.occurrence_date)}</td><td>${esc(r.rdc||r.rdc_name)}</td><td>${esc(r.incident_type)}</td><td>${esc(r.item_code)}</td><td>${fmt(r.qty_box)} ${esc(r.uom||'BOX')}</td><td>${ev}</td><td>${esc(r.no_ba)}</td><td>${esc(r.reported_by)}</td><td><span class="status-pill ${stClass(st)}">${esc(stLabel(st))}</span>${note}</td><td>${act.join(' ')}</td></tr>`
    }).join(''):`<tr><td colspan="11"><div class="empty">Belum ada incident pada periode ini.</div></td></tr>`}</tbody></table></div>`;
  };

  async function masterIncidentActionV56(id,action){
    if(!ACCESS?.is_master)return alert('Hanya Master yang dapat melakukan action ini.');const r=incidentById(id);if(!r)return;
    const st=String(r.status||'').toUpperCase();
    if(!complete(r))return alert(`Evidence belum lengkap (${got(r)} foto). Rule wajib 1–5 foto per incident. Master Review/Final ditahan.`);
    if(action==='START_REVIEW'&&st!=='APPROVED_SPV')return alert('Review Master hanya dapat dimulai dari status APPROVED SPV.');
    if(action==='FINALIZE'&&st!=='MASTER_REVIEW')return alert('Final hanya dapat dilakukan setelah status MASTER REVIEW.');
    let reason='';if(action==='START_REVIEW')reason=upperText(prompt('Catatan review Master (opsional):','')||'');
    if(action==='FINALIZE'){if(!confirm(`Finalisasi ${r.incident_no}? Evidence ${got(r)} foto lengkap.`))return;reason=upperText(prompt('Catatan final Master (opsional):','')||'')}
    try{await rpc('breakage_incident_master_action_v45',{p_incident_id:id,p_action:action,p_reason:reason,p_changes:{}});await loadAll();showPage('incident')}catch(e){alert('Gagal: '+cleanErr(e.message))}
  }
  window.masterIncidentActionV56=masterIncidentActionV56;

  async function adjustIncidentV56(id){
    if(!ACCESS?.is_master)return alert('Hanya Master yang dapat melakukan adjustment.');const r=incidentById(id);if(!r)return;if(String(r.status||'').toUpperCase()!=='MASTER_REVIEW')return alert('Adjustment hanya dapat dilakukan saat status MASTER REVIEW.');
    let reason=prompt('Alasan adjustment (WAJIB):','');if(reason===null||!reason.trim())return;reason=upperText(reason);
    let qty=prompt('Qty BOX (ubah jika perlu):',String(r.qty_box??''));if(qty===null)return;if(!(Number(qty)>0))return alert('Qty harus lebih dari 0.');
    if(!complete(r))return alert(`Adjustment ditahan: evidence harus 1–5 foto per incident, saat ini ${got(r)} foto.`);
    let item=prompt('Kode Item:',String(r.item_code??''));if(item===null||!item.trim())return;item=upperText(item);
    let causeInput=prompt('Penyebab (kategori: PERJALANAN / SUSUNAN / PACKAGING / PALLET / LAINNYA):',String(r.cause??''));if(causeInput===null)return;
    const cause=canonicalCause(causeInput,r.cause);
    let responsibility=prompt('Responsibility:',String(r.responsibility??''));if(responsibility===null)return;responsibility=upperText(responsibility);
    let pic=prompt('PIC:',String(r.pic??''));if(pic===null)return;pic=upperText(pic);
    const changes={qty_box:Number(qty),item_code:item,cause,responsibility,pic};
    try{await rpc('breakage_incident_master_action_v45',{p_incident_id:id,p_action:'ADJUST',p_reason:reason,p_changes:changes});await loadAll();showPage('incident')}catch(e){alert('Gagal adjustment: '+cleanErr(e.message))}
  }
  window.adjustIncidentV56=adjustIncidentV56;

  setBuild();setTimeout(setBuild,400);window.__SLS_BREAKAGE_MONITORING_EVIDENCE_GUARD='v58';
})();