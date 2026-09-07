// SLS Breakage Monitoring v62 — Monthly Archive (Excel + Evidence Photos)
// Safety rule: archive is generated first; online evidence deletion is a separate, explicit Master action.
(function(){
  const BUILD='v62-monthly-archive';
  const RDC_OPTIONS=['ALL','Jakarta','Semarang','Surabaya','Denpasar','Palembang'];
  let ARCHIVE_SCOPE='ALL';
  let ARCHIVE_BUSY=false;

  function currentJakartaMonth(){
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit'}).formatToParts(new Date());
    const y=parts.find(x=>x.type==='year')?.value||'';
    const m=parts.find(x=>x.type==='month')?.value||'';
    return `${y}-${m}`;
  }
  function isClosedPeriod(p){return /^\d{4}-\d{2}$/.test(String(p||''))&&String(p)<currentJakartaMonth()}
  function safe(v){return String(v??'').replace(/[\\/:*?"<>|]+/g,'_').replace(/\s+/g,'_').replace(/^_+|_+$/g,'').slice(0,100)||'NA'}
  function baseName(path){return String(path||'').split('/').pop()||'evidence.jpg'}
  function bytesLabel(v){v=Number(v||0);if(v<1024)return `${v} B`;if(v<1024*1024)return `${(v/1024).toFixed(1)} KB`;return `${(v/1024/1024).toFixed(2)} MB`}
  function excelValue(v){if(v==null)return '';if(typeof v==='object')return JSON.stringify(v);return v}
  function toRows(arr){return (arr||[]).map(r=>Object.fromEntries(Object.entries(r||{}).map(([k,v])=>[k,excelValue(v)])))}
  function evidenceArchivePath(m){return `Evidence/${safe(m.rdc)}/${safe(m.incident_no||m.incident_id)}/${safe(baseName(m.path))}`}

  async function ensureJsZip(){
    if(window.JSZip)return window.JSZip;
    await new Promise((resolve,reject)=>{
      const exists=document.querySelector('script[data-sls-jszip="1"]');
      if(exists){exists.addEventListener('load',resolve,{once:true});exists.addEventListener('error',reject,{once:true});return}
      const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';s.async=true;s.dataset.slsJszip='1';s.onload=resolve;s.onerror=()=>reject(new Error('Library ZIP gagal dimuat'));document.head.appendChild(s);
    });
    if(!window.JSZip)throw new Error('JSZip tidak tersedia');
    return window.JSZip;
  }
  async function sha256Hex(blob){
    if(!crypto?.subtle)return null;
    const buf=await blob.arrayBuffer();
    const dig=await crypto.subtle.digest('SHA-256',buf);
    return Array.from(new Uint8Array(dig)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  async function evidenceBlob(path){
    if(typeof window.slsRefreshBreakageMonitoringSession==='function')await window.slsRefreshBreakageMonitoringSession(false).catch(()=>false);
    const encoded=String(path).split('/').map(encodeURIComponent).join('/');
    const r=await fetch(`${SUPABASE_URL}/storage/v1/object/authenticated/breakage-evidence/${encoded}`,{
      method:'GET',cache:'no-store',headers:{apikey:PUBLIC_ANON,Authorization:`Bearer ${auth()}`},signal:AbortSignal.timeout(30000)
    });
    if(!r.ok)throw new Error(`Evidence tidak dapat diunduh: ${path} (HTTP ${r.status})`);
    return await r.blob();
  }
  function downloadBlob(blob,filename){
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  function makeSheetFromAoa(wb,name,aoa,widths){
    const ws=XLSX.utils.aoa_to_sheet(aoa);if(widths)ws['!cols']=widths.map(w=>({wch:w}));XLSX.utils.book_append_sheet(wb,ws,name);return ws;
  }
  function makeSheetFromJson(wb,name,rows){
    const data=toRows(rows);const ws=data.length?XLSX.utils.json_to_sheet(data):XLSX.utils.aoa_to_sheet([['Tidak ada data']]);XLSX.utils.book_append_sheet(wb,ws,name);return ws;
  }

  function incidentRows(payload){
    return (payload.incidents||[]).map(i=>({
      'Incident No':i.incident_no,'Tanggal':i.occurrence_date,'RDC':i.rdc_name,'Jenis':i.incident_type,'Item':i.item_code,
      'Qty Box':i.qty_box,'UOM':i.uom,'No BA':i.no_ba,'No SJ':i.no_sj,'Factory':i.factory,'Customer':i.customer,
      'Transporter':i.transporter,'Driver':i.driver_name,'No Polisi':i.vehicle_no,'Penyebab':i.cause,'Keterangan':i.cause_detail,
      'Kejadian Gudang':i.warehouse_event,'Nama Terkait':i.related_person,'Reported By':i.reported_by,'Status':i.status,
      'Created By':i.created_by,'SPV Reviewed By':i.spv_reviewed_by,'SPV Note':i.spv_note,'Master Reviewed By':i.master_reviewed_by,
      'Master Note':i.master_note,'Finalized By':i.finalized_by,'Deleted At':i.deleted_at,'Deleted By':i.deleted_by,'Delete Reason':i.delete_reason,
      'Jumlah Foto':Array.isArray(i.photo_paths)?i.photo_paths.length:0,
      'Folder Evidence':`Evidence/${safe(i.rdc_name)}/${safe(i.incident_no||i.id)}/`
    }));
  }
  function evidenceRows(payload){
    return (payload.evidence_manifest||[]).map(m=>({
      'Incident No':m.incident_no,'No BA':m.no_ba,'RDC':m.rdc,'Original Storage Path':m.path,
      'Path di Archive ZIP':evidenceArchivePath(m),'Size Bytes':Number(m.size_bytes||0),'Size':bytesLabel(m.size_bytes)
    }));
  }
  function summaryAoa(payload){
    const inc=payload.incidents||[], ev=payload.evidence_manifest||[];
    const active=inc.filter(x=>!x.deleted_at), deleted=inc.filter(x=>!!x.deleted_at);
    const byType={receiving:0,delivery:0,warehouse:0};
    active.forEach(x=>{const k=String(x.incident_type||'').toLowerCase();if(k in byType)byType[k]+=Number(x.qty_box||0)});
    return [
      ['SLS BREAKAGE MONTHLY ARCHIVE',''],
      ['Periode',payload.period],['Scope',payload.rdc],['Dibuat',new Date().toLocaleString('id-ID')],
      ['Status Periode','CLOSED'],['Incident Aktif',active.length],['Incident Soft Deleted (Audit)',deleted.length],
      ['Qty Delivery (Box)',byType.delivery],['Qty Warehouse (Box)',byType.warehouse],['Qty Receiving (Box)',byType.receiving],
      ['Jumlah Evidence',ev.length],['Ukuran Evidence',bytesLabel(ev.reduce((a,b)=>a+Number(b.size_bytes||0),0))],
      ['Catatan','Database incident/KPI tetap online. Hanya file evidence yang boleh dihapus setelah ZIP archive sudah diverifikasi.'],
      [],['OVERVIEW JSON',JSON.stringify(payload.overview||{})],['EXPOSURE JSON',JSON.stringify(payload.exposure||{})]
    ];
  }

  async function buildArchive(payload,progress){
    const JSZip=await ensureJsZip();
    if(!window.XLSX)throw new Error('Library Excel tidak tersedia');
    const zip=new JSZip();
    const wb=XLSX.utils.book_new();
    makeSheetFromAoa(wb,'Ringkasan',summaryAoa(payload),[28,80]);
    makeSheetFromJson(wb,'Incident Detail',incidentRows(payload));
    makeSheetFromJson(wb,'Evidence Index',evidenceRows(payload));
    makeSheetFromJson(wb,'Audit Trail',payload.audit||[]);
    const recon=(payload.reconciliation||[]).filter(r=>String(r.period||'').slice(0,7)===payload.period);
    makeSheetFromJson(wb,'Reconciliation',recon);
    makeSheetFromJson(wb,'Target KPI',payload.targets||[]);
    makeSheetFromJson(wb,'KPI Setting',payload.kpi_settings||[]);
    const xlsx=XLSX.write(wb,{bookType:'xlsx',type:'array'});
    const xlsxName=`Breakage_${safe(payload.period)}_${safe(payload.rdc)}.xlsx`;
    zip.file(xlsxName,xlsx);

    const manifest=payload.evidence_manifest||[];
    let downloadedBytes=0;
    for(let i=0;i<manifest.length;i++){
      const m=manifest[i];
      progress(`Mengambil foto ${i+1}/${manifest.length}…`);
      const blob=await evidenceBlob(m.path);
      downloadedBytes+=blob.size;
      zip.file(evidenceArchivePath(m),blob);
    }
    zip.file('README.txt',[
      'SLS BREAKAGE MONTHLY ARCHIVE',
      `Periode: ${payload.period}`,
      `Scope: ${payload.rdc}`,
      '',
      'Isi archive:',
      `1. ${xlsxName} — data incident, KPI, audit trail, reconciliation dan index evidence.`,
      '2. Folder Evidence — lampiran foto per RDC dan per Incident No.',
      '3. archive_manifest.json — daftar file evidence dan metadata.',
      '',
      'PENTING:',
      '- Simpan file ZIP ini sebagai arsip resmi bulan tersebut.',
      '- Buka Excel dan minimal satu foto sebelum melakukan Hapus Evidence Online.',
      '- Database incident/KPI tetap disimpan untuk trend, audit, dan Control Tower.',
      '- Hapus Evidence Online hanya menghapus foto dari Supabase Storage setelah archive diverifikasi.'
    ].join('\n'));
    zip.file('archive_manifest.json',JSON.stringify({period:payload.period,rdc:payload.rdc,created_at:new Date().toISOString(),evidence:manifest.map(m=>({...m,archive_path:evidenceArchivePath(m)}))},null,2));
    progress('Membentuk file ZIP archive…');
    const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}});
    return {blob,downloadedBytes,xlsxName};
  }

  function archivePanelHtml(){
    const closed=isClosedPeriod(PERIOD),master=!!ACCESS?.is_master;
    if(!master)return '';
    const currentScope=RDC_OPTIONS.includes(SCOPE)?SCOPE:'ALL';ARCHIVE_SCOPE=currentScope;
    return `<div id="monthlyArchivePanel" style="margin-top:22px;border:1px solid #ccd7e7;border-radius:10px;padding:14px;background:#f8fbff">
      <div class="section-title" style="margin:0 0 8px">Monthly Archive — Excel + Lampiran Foto <span style="margin-left:auto"><span class="status-pill ${closed?'s-blue':'s-watch'}">${closed?'PERIODE CLOSED':'MENUNGGU MONTH-END'}</span></span></div>
      <div class="hint" style="margin-bottom:10px"><b>Kebijakan aman:</b> Archive dibuat lebih dulu menjadi <b>1 file ZIP</b> berisi Excel + folder foto. <b>Tidak auto-delete.</b> Setelah file ZIP tersimpan dan berhasil dibuka, Master centang verifikasi lalu klik <b>Hapus Evidence Online</b>. Data incident/KPI tetap berada di database untuk trend, audit, dan Control Tower.</div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <label style="font-size:11px;font-weight:800">Scope Archive</label>
        <select id="archiveScope" class="secondary" style="padding:7px 9px;background:#fff">${RDC_OPTIONS.map(x=>`<option value="${x}" ${x===currentScope?'selected':''}>${x==='ALL'?'Nasional / Semua RDC':x}</option>`).join('')}</select>
        <button class="primary" id="archiveDownloadBtn" ${closed?'':'disabled'}>↓ Download Archive (Excel + Foto)</button>
        <button class="secondary" id="archiveRefreshBtn">↻ Cek Status</button>
      </div>
      <div id="archiveProgress" class="smallnote" style="margin-top:9px">${closed?'Siap dibuat setelah month-end reconciliation/final review.':'Archive bulan berjalan belum dibuka. Sistem baru mengizinkan periode yang sudah CLOSED.'}</div>
      <div id="archiveDeleteBox" style="display:none;margin-top:12px;border-top:1px solid #dfe5ee;padding-top:12px">
        <label style="display:flex;gap:8px;align-items:flex-start;font-size:12px"><input type="checkbox" id="archiveVerified" style="margin-top:2px"> <span>Saya sudah memastikan file ZIP archive <b>tersimpan dan dapat dibuka</b> (Excel + minimal satu foto sudah diperiksa).</span></label>
        <button class="secondary" id="archiveDeleteBtn" style="margin-top:9px;border-color:#f1b8b5;color:#b42318" disabled>Hapus Evidence Online dari Supabase</button>
        <div class="smallnote" style="margin-top:6px;color:#8b4b45">Tindakan ini permanen untuk file foto online. Data incident, KPI, audit trail, dan reference archive tetap disimpan.</div>
      </div>
    </div>`;
  }

  async function refreshArchiveStatus(){
    const prog=document.getElementById('archiveProgress'),delBox=document.getElementById('archiveDeleteBox'),btn=document.getElementById('archiveDeleteBtn');
    if(!prog||!ACCESS?.is_master||!isClosedPeriod(PERIOD))return;
    const scope=document.getElementById('archiveScope')?.value||ARCHIVE_SCOPE||'ALL';ARCHIVE_SCOPE=scope;
    try{
      const s=await rpc('breakage_archive_status_v62',{p_period:PERIOD,p_rdc:scope});
      if(s.status==='NOT_GENERATED'){
        prog.innerHTML='Belum ada archive untuk periode/scope ini.';if(delBox)delBox.style.display='none';
      }else if(s.status==='GENERATED'){
        prog.innerHTML=`<b>ARCHIVE GENERATED</b> · ${esc(s.filename||'-')} · ${fmt(s.incident_count)} incident · ${fmt(s.evidence_count)} foto (${bytesLabel(s.evidence_bytes)}) · ${new Date(s.generated_at).toLocaleString('id-ID')}`;
        if(delBox)delBox.style.display='block';if(btn)btn.disabled=!document.getElementById('archiveVerified')?.checked;
      }else if(s.status==='CLEANED'){
        prog.innerHTML=`<b style="color:#067647">ARCHIVED & ONLINE EVIDENCE CLEANED</b> · ${esc(s.filename||'-')} · ${fmt(s.cleaned_evidence_count||0)} foto dihapus dari Storage pada ${s.cleaned_at?new Date(s.cleaned_at).toLocaleString('id-ID'):'-'}. Data historis tetap online.`;
        if(delBox)delBox.style.display='none';
      }
    }catch(e){prog.textContent='Status archive gagal dimuat: '+cleanErr(e?.message||String(e));}
  }

  async function downloadMonthlyArchive(){
    if(ARCHIVE_BUSY)return;
    const prog=document.getElementById('archiveProgress'),btn=document.getElementById('archiveDownloadBtn');
    const scope=document.getElementById('archiveScope')?.value||'ALL';ARCHIVE_SCOPE=scope;
    if(!isClosedPeriod(PERIOD)){if(prog)prog.textContent='Archive hanya tersedia untuk periode CLOSED.';return}
    ARCHIVE_BUSY=true;if(btn)btn.disabled=true;
    try{
      if(prog)prog.textContent='Menyiapkan data archive…';
      const payload=await rpc('breakage_archive_payload_v62',{p_period:PERIOD,p_rdc:scope});
      const built=await buildArchive(payload,msg=>{if(prog)prog.textContent=msg});
      const filename=`SLS_Breakage_Archive_${safe(PERIOD)}_${safe(scope)}.zip`;
      if(prog)prog.textContent='Mendaftarkan archive & checksum…';
      const checksum=await sha256Hex(built.blob);
      const evidenceBytes=(payload.evidence_manifest||[]).reduce((a,b)=>a+Number(b.size_bytes||0),0)||built.downloadedBytes;
      await rpc('breakage_archive_register_v62',{
        p_period:PERIOD,p_rdc:scope,p_filename:filename,p_incident_count:(payload.incidents||[]).length,
        p_evidence_count:(payload.evidence_manifest||[]).length,p_evidence_bytes:evidenceBytes,p_checksum:checksum
      });
      downloadBlob(built.blob,filename);
      if(prog)prog.innerHTML=`<b style="color:#067647">✓ Archive berhasil dibuat.</b> Download dimulai: ${esc(filename)}. <b>Sebelum menghapus evidence online, buka ZIP → buka Excel → cek minimal satu foto.</b>`;
      await refreshArchiveStatus();
    }catch(e){if(prog)prog.textContent='Archive gagal: '+cleanErr(e?.message||String(e));}
    finally{ARCHIVE_BUSY=false;if(btn)btn.disabled=!isClosedPeriod(PERIOD)}
  }

  async function deleteOnlineEvidence(){
    if(ARCHIVE_BUSY)return;
    const verified=document.getElementById('archiveVerified'),btn=document.getElementById('archiveDeleteBtn'),prog=document.getElementById('archiveProgress');
    if(!verified?.checked){if(prog)prog.textContent='Centang verifikasi archive terlebih dahulu.';return}
    const scope=document.getElementById('archiveScope')?.value||ARCHIVE_SCOPE||'ALL';
    ARCHIVE_BUSY=true;if(btn)btn.disabled=true;
    try{
      if(typeof window.slsRefreshBreakageMonitoringSession==='function')await window.slsRefreshBreakageMonitoringSession(false).catch(()=>false);
      if(prog)prog.textContent='Menghapus evidence online yang sudah diarsipkan…';
      const r=await fetch(`${SUPABASE_URL}/functions/v1/breakage-archive-cleanup-v62`,{
        method:'POST',headers:{apikey:PUBLIC_ANON,Authorization:`Bearer ${auth()}`,'Content-Type':'application/json'},
        body:JSON.stringify({period:PERIOD,rdc:scope,confirmation:'ARCHIVE_VERIFIED'}),signal:AbortSignal.timeout(120000)
      });
      const body=await r.json().catch(()=>({error:`HTTP ${r.status}`}));
      if(!r.ok)throw new Error(body.error||`HTTP ${r.status}`);
      if(prog)prog.innerHTML=`<b style="color:#067647">✓ Cleanup selesai.</b> ${fmt(body.deleted||0)} evidence online dihapus. Data historis dan reference archive tetap tersimpan.`;
      await refreshArchiveStatus();
      if(typeof loadAll==='function')await loadAll();
    }catch(e){if(prog)prog.textContent='Cleanup gagal: '+cleanErr(e?.message||String(e));}
    finally{ARCHIVE_BUSY=false}
  }

  function wireArchivePanel(){
    const scope=document.getElementById('archiveScope'),dl=document.getElementById('archiveDownloadBtn'),rf=document.getElementById('archiveRefreshBtn'),ck=document.getElementById('archiveVerified'),del=document.getElementById('archiveDeleteBtn');
    if(scope)scope.onchange=()=>{ARCHIVE_SCOPE=scope.value;refreshArchiveStatus()};
    if(dl)dl.onclick=downloadMonthlyArchive;
    if(rf)rf.onclick=refreshArchiveStatus;
    if(ck)ck.onchange=()=>{if(del)del.disabled=!ck.checked};
    if(del)del.onclick=deleteOnlineEvidence;
    if(isClosedPeriod(PERIOD))setTimeout(refreshArchiveStatus,0);
  }
  function injectArchivePanel(){
    const body=document.getElementById('reconBody');if(!body||!ACCESS?.is_master)return;
    if(document.getElementById('monthlyArchivePanel'))return;
    body.insertAdjacentHTML('beforeend',archivePanelHtml());wireArchivePanel();
  }

  if(typeof renderReconPage==='function'){
    const baseRenderReconPage=renderReconPage;
    renderReconPage=function(){const out=baseRenderReconPage.apply(this,arguments);injectArchivePanel();return out};
    window.renderReconPage=renderReconPage;
  }
  setTimeout(injectArchivePanel,200);
  window.__SLS_BREAKAGE_ARCHIVE=BUILD;
})();