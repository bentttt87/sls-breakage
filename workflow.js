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
      let st=String(r.status||'').toUpperCase(), act=[`<button class="secondary" onclick="viewMasterIncident(${Number(r.incident_id)})">Detail &amp; Foto</button>`];
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

  let dialog=null, busy=false, photoUrls=[], requestId=0;
  function dismiss(){if(busy)return;requestId++;photoUrls.forEach(URL.revokeObjectURL);photoUrls=[];if(dialog)dialog.remove();dialog=null;}
  function panel(title){dismiss();dialog=document.createElement('div');dialog.style.cssText='position:fixed;inset:0;z-index:200;background:#00162ba8;display:flex;align-items:center;justify-content:center;padding:12px';dialog.innerHTML=`<section role="dialog" aria-modal="true" aria-labelledby="mwTitle" style="background:white;color:#142b4c;width:min(900px,100%);max-height:94vh;overflow:auto;border-radius:12px;padding:20px"><header style="display:flex;justify-content:space-between;gap:12px"><h2 id="mwTitle" style="font-size:22px;margin:0">${esc(title)}</h2><button id="mwClose" class="secondary" aria-label="Tutup review">Tutup</button></header><div id="mwBody" style="margin-top:16px"></div><p id="mwMsg" role="status" style="color:#b42318;overflow-wrap:anywhere"></p><div id="mwActions" style="display:flex;gap:12px;margin-top:16px"></div></section>`;document.body.appendChild(dialog);$('mwClose').onclick=dismiss;$('mwClose').focus();}
  function details(r){return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">${[['Incident',r.incident_no],['RDC',r.rdc],['Status',stLabel(r.status)],['Tanggal',r.occurrence_date],['Item',r.item_code],['Qty',fmt(r.qty_box)+' BOX'],['No BA',r.no_ba],['Jenis',r.incident_type],['Penyebab',r.cause],['Keterangan',r.cause_detail],['Reported By',r.reported_by],['Input By',r.created_by],['Catatan SPV',r.spv_note]].map(([k,v])=>`<div style="border:1px solid #dce3ed;border-radius:8px;padding:12px;overflow-wrap:anywhere"><b>${esc(k)}</b><div>${esc(v||'—')}</div></div>`).join('')}</div><h3>Evidence Foto</h3><div id="mwPhotos" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px">Memuat foto…</div>`;}
  async function photos(r){const seq=++requestId;const paths=Array.isArray(r.photo_paths)?r.photo_paths:[];if(!paths.length){$('mwPhotos').textContent='Evidence tidak tersedia.';return false;}$('mwPhotos').textContent='';try{for(let i=0;i<paths.length;i++){const p=paths[i];if(typeof p!=='string'||p.startsWith('/')||p.split('/').includes('..'))throw Error('Path foto tidak valid');const res=await fetch(`${SUPABASE_URL}/storage/v1/object/authenticated/breakage-evidence/${p.split('/').map(encodeURIComponent).join('/')}`,{headers:{apikey:PUBLIC_ANON,Authorization:`Bearer ${SESSION.access_token}`},signal:AbortSignal.timeout(20000)});if(!res.ok)throw Error('Foto tidak dapat dibuka.');const blob=await res.blob();if(seq!==requestId)return false;if(!['image/jpeg','image/png'].includes(blob.type))throw Error('Format evidence tidak valid');const url=URL.createObjectURL(blob);photoUrls.push(url);const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener';const img=document.createElement('img');img.src=url;img.alt='Evidence '+(i+1);img.style.cssText='width:100%;max-height:320px;object-fit:contain';link.append(img);$('mwPhotos').append(link);}return true;}catch(e){if(seq===requestId)$('mwPhotos').textContent=e.message;return false;}}
  async function viewMasterIncident(id){if(busy)return;const r=incidentById(id);if(!r)return;panel('Detail '+r.incident_no);$('mwBody').innerHTML=details(r);await photos(r);}
  window.viewMasterIncident=viewMasterIncident;
  async function actionForm(id,action){
    if(busy||!ACCESS?.is_master)return;const r=incidentById(id);if(!r)return;
    const expected=action==='START_REVIEW'?'APPROVED_SPV':'MASTER_REVIEW';if(String(r.status).toUpperCase()!==expected)return;
    const labels={START_REVIEW:'Mulai Review',ADJUST:'Adjustment',FINALIZE:'Finalisasi'};panel(labels[action]+' — '+r.incident_no);
    const fields=[['qty_box','Qty BOX'],['item_code','Kode Item'],['no_ba','No BA'],['cause','Penyebab'],['responsibility','Responsibility'],['pic','PIC']];
    $('mwBody').innerHTML=details(r)+(action==='ADJUST'?`<h3>Nilai sesudah adjustment</h3><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">${fields.map(([k,label])=>`<label>${label}<input id="mw_${k}" ${k==='qty_box'?'type="number" min="0.01" step="0.01"':'type="text"'} value="${esc(r[k]??'')}" style="display:block;width:100%;padding:10px;border:1px solid #c9d4e3;border-radius:6px"></label>`).join('')}</div>`:'')+`<label for="mwReason" style="display:block;margin-top:16px">${action==='ADJUST'?'Alasan adjustment (wajib)':'Catatan Master'}</label><textarea id="mwReason" rows="3" maxlength="1000" style="width:100%;padding:10px;border:1px solid #c9d4e3;border-radius:6px"></textarea><label style="display:flex;gap:8px;margin-top:12px"><input type="checkbox" id="mwChecked">${action==='FINALIZE'?'Saya sudah memeriksa detail dan foto, dan menyetujui finalisasi. Data FINAL tidak dapat diedit.':'Saya sudah memeriksa detail dan foto incident.'}</label>`;
    $('mwActions').innerHTML=`<button id="mwSave" class="primary" disabled>${labels[action]}</button>`;let ready=false;const currentDialog=dialog;
    $('mwChecked').onchange=()=>{$('mwSave').disabled=busy||!ready||!$('mwChecked').checked;};
    $('mwSave').onclick=async()=>{if(busy||!ready||!$('mwChecked').checked)return;const reason=$('mwReason').value.trim();let changes={};
      if(action==='ADJUST'){if(!reason){$('mwMsg').textContent='Alasan adjustment wajib diisi.';return;}fields.forEach(([k])=>changes[k]=$('mw_'+k).value.trim());if(!(Number(changes.qty_box)>0)||!changes.item_code||!changes.no_ba||!changes.cause){$('mwMsg').textContent='Qty harus lebih dari 0; Item, No BA dan Penyebab wajib diisi.';return;}changes.qty_box=Number(changes.qty_box);changes.no_ba=changes.no_ba.toUpperCase();}
      busy=true;$('mwSave').disabled=true;$('mwClose').disabled=true;$('mwMsg').textContent='Menyimpan…';
      try{await rpc('breakage_incident_master_action_v45',{p_incident_id:Number(id),p_action:action,p_reason:reason,p_changes:changes});busy=false;dismiss();await loadAll();showPage('incident');}
      catch(e){if(dialog===currentDialog)$('mwMsg').textContent='Hasil belum terkonfirmasi: '+cleanErr(e.message)+'. Tutup dan refresh data sebelum mencoba lagi.';}
      finally{busy=false;if(dialog===currentDialog){$('mwClose').disabled=false;$('mwSave').disabled=false;}}
    };
    ready=await photos(r);if(dialog===currentDialog)$('mwSave').disabled=!ready||!$('mwChecked').checked;
  }
  window.masterIncidentAction=(id,action)=>actionForm(id,action);
  window.adjustIncident=id=>actionForm(id,'ADJUST');
  async function showIncidentAudit(id){if(busy)return;const r=incidentById(id);if(!r)return;panel('Audit — '+r.incident_no);const currentDialog=dialog;$('mwBody').textContent='Memuat audit…';try{const rows=await rpc('breakage_incident_audit_list_v45',{p_incident_id:Number(id)});if(dialog!==currentDialog)return;$('mwBody').innerHTML=(rows||[]).map(x=>`<article style="border:1px solid #dce3ed;padding:14px;margin:10px 0;border-radius:8px;overflow-wrap:anywhere"><b>${esc(stLabel(x.action))}</b><p>${esc(new Date(x.created_at).toLocaleString('id-ID'))} · ${esc(x.actor_username)} · ${esc(stLabel(x.from_status))} → ${esc(stLabel(x.to_status))}</p><p>${esc(x.reason||'')}</p>${x.changed_fields?`<pre style="white-space:pre-wrap;font-size:13px">${esc(JSON.stringify(x.changed_fields,null,2))}</pre>`:''}</article>`).join('')||'Belum ada audit trail.';}catch(e){if(dialog===currentDialog)$('mwBody').textContent='Gagal memuat audit: '+cleanErr(e.message);}}
  window.showIncidentAudit=showIncidentAudit;
})();
