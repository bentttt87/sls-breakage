// Breakage Incident workflow v46: Admin -> SPV -> Master Review -> Final
(function(){
  function stClass(st){st=String(st||'').toUpperCase();if(st==='FINAL')return 's-good';if(st==='APPROVED_SPV')return 's-blue';if(st==='RETURNED_ADMIN')return 's-bad';if(st==='MASTER_REVIEW')return 's-blue';return 's-watch'}
  function stLabel(st){return String(st||'—').replaceAll('_',' ')}
  function incidentById(id){return (INCIDENTS||[]).find(x=>Number(x.incident_id)===Number(id))}

  renderIncidentPage=function(){
    let rows=INCIDENTS||[];
    $('incidentBody').innerHTML=`<div class="section-title">Incident — ${monthName(PERIOD)} <span style="margin-left:auto"><button class="primary" onclick="openBreakageInput()">↗ Buka Breakage Input</button></span></div>
    <div class="hint" style="margin-bottom:10px"><b>Workflow wajib:</b> Admin RDC Input → SPV Approve / Return → Master Review → Adjustment bila perlu → Final. Incident tidak dapat langsung FINAL sebelum masuk Master Review. Adjustment Master selalu tercatat di audit trail.</div>
    <div class="tablewrap"><table class="tbl"><thead><tr><th>Incident</th><th>Tanggal</th><th>RDC</th><th>Jenis</th><th>Item</th><th>Qty</th><th>No BA</th><th>Reported By</th><th>Status</th><th>Workflow</th></tr></thead><tbody>${rows.length?rows.map(r=>{
      let st=String(r.status||'').toUpperCase(), act=[];
      if(ACCESS?.is_master&&st==='APPROVED_SPV'){
        act.push(`<button class="primary" style="padding:6px 8px;font-size:10px" onclick="masterIncidentAction(${r.incident_id},'START_REVIEW')">Mulai Review</button>`);
      }
      if(ACCESS?.is_master&&st==='MASTER_REVIEW'){
        act.push(`<button class="secondary" style="padding:6px 8px;font-size:10px" onclick="adjustIncident(${r.incident_id})">Adjustment</button>`);
        act.push(`<button class="primary" style="padding:6px 8px;font-size:10px" onclick="masterIncidentAction(${r.incident_id},'FINALIZE')">Final</button>`);
      }
      if(['master','rdc_manager'].includes(ACCESS?.role)) act.push(`<button class="secondary" style="padding:6px 8px;font-size:10px" onclick="showIncidentAudit(${r.incident_id})">Audit</button>`);
      let note=r.spv_note?`<div class="smallnote">SPV: ${esc(r.spv_note)}</div>`:'';
      return `<tr><td>${esc(r.incident_no)}</td><td>${esc(r.occurrence_date)}</td><td>${esc(r.rdc)}</td><td>${esc(r.incident_type)}</td><td>${esc(r.item_code)}</td><td>${fmt(r.qty_box)} ${esc(r.uom||'BOX')}</td><td>${esc(r.no_ba)}</td><td>${esc(r.reported_by)}</td><td><span class="status-pill ${stClass(st)}">${esc(stLabel(st))}</span>${note}</td><td>${act.length?act.join(' '):'<span class="smallnote">Read only</span>'}</td></tr>`
    }).join(''):`<tr><td colspan="10"><div class="empty">Belum ada incident pada periode ini.</div></td></tr>`}</tbody></table></div>`
  };

  async function masterIncidentAction(id,action){
    if(!ACCESS?.is_master)return alert('Hanya Master yang dapat melakukan action ini.');
    const r=incidentById(id);if(!r)return alert('Incident tidak ditemukan. Refresh data lalu coba kembali.');
    const st=String(r.status||'').toUpperCase();
    if(action==='START_REVIEW'&&st!=='APPROVED_SPV')return alert('Review Master hanya dapat dimulai dari status APPROVED SPV.');
    if(action==='FINALIZE'&&st!=='MASTER_REVIEW')return alert('Final hanya dapat dilakukan setelah status MASTER REVIEW.');
    let reason='';
    if(action==='START_REVIEW') reason=prompt('Catatan review Master (opsional):','')||'';
    if(action==='FINALIZE'){
      if(!confirm('Finalisasi incident ini? Setelah FINAL, incident tidak dapat diubah melalui workflow normal.'))return;
      reason=prompt('Catatan final Master (opsional):','')||'';
    }
    try{await rpc('breakage_incident_master_action_v45',{p_incident_id:id,p_action:action,p_reason:reason,p_changes:{}});await loadAll();showPage('incident')}catch(e){alert('Gagal: '+cleanErr(e.message))}
  }
  window.masterIncidentAction=masterIncidentAction;

  async function adjustIncident(id){
    if(!ACCESS?.is_master)return alert('Hanya Master yang dapat melakukan adjustment.');
    let r=incidentById(id);if(!r)return;
    if(String(r.status||'').toUpperCase()!=='MASTER_REVIEW')return alert('Adjustment hanya dapat dilakukan saat status MASTER REVIEW.');
    let reason=prompt('Alasan adjustment (WAJIB):','');if(reason===null||!reason.trim())return;
    let qty=prompt('Qty BOX (ubah jika perlu):',String(r.qty_box??''));if(qty===null)return;
    if(!(Number(qty)>0))return alert('Qty harus lebih dari 0.');
    let item=prompt('Kode Item:',String(r.item_code??''));if(item===null||!item.trim())return;
    let ba=prompt('No BA:',String(r.no_ba??''));if(ba===null||!ba.trim())return;
    let cause=prompt('Cause/Penyebab:',String(r.cause??''));if(cause===null||!cause.trim())return;
    let responsibility=prompt('Responsibility:',String(r.responsibility??''));if(responsibility===null)return;
    let pic=prompt('PIC:',String(r.pic??''));if(pic===null)return;
    let changes={qty_box:Number(qty),item_code:item.trim(),no_ba:ba.trim().toUpperCase(),cause:cause.trim(),responsibility:responsibility.trim(),pic:pic.trim()};
    try{await rpc('breakage_incident_master_action_v45',{p_incident_id:id,p_action:'ADJUST',p_reason:reason.trim(),p_changes:changes});await loadAll();showPage('incident')}catch(e){alert('Gagal adjustment: '+cleanErr(e.message))}
  }
  window.adjustIncident=adjustIncident;

  async function showIncidentAudit(id){
    try{let rows=await rpc('breakage_incident_audit_list_v45',{p_incident_id:id});let text=(rows||[]).map(x=>`${new Date(x.created_at).toLocaleString('id-ID')} | ${x.actor_username||'—'} | ${stLabel(x.action)} | ${stLabel(x.from_status)} → ${stLabel(x.to_status)}${x.reason?' | '+x.reason:''}`).join('\n');alert(text||'Belum ada audit trail.')}catch(e){alert('Gagal memuat audit: '+cleanErr(e.message))}
  }
  window.showIncidentAudit=showIncidentAudit;
})();
