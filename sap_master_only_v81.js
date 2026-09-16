// SLS Breakage Monitoring v111 — flexible SAP weekly upload, daily BOX ledger, no normal Stock Awal workflow.
(function(){
  'use strict';
  function ready(){return typeof ACCESS!=='undefined' && ACCESS && (ACCESS.role||ACCESS.breakage_role);}
  function rawRole(){return String(ACCESS?.role||'').toLowerCase();}
  function breakageRole(){return String(ACCESS?.breakage_role||'').toLowerCase();}
  function isMaster(){return !!ACCESS?.is_master || rawRole()==='master' || breakageRole()==='master';}
  function isSpv(){return rawRole()==='supervisor' || breakageRole()==='spv' || breakageRole()==='supervisor';}
  function canUpload(){return isMaster()||isSpv()||ACCESS?.can_upload_sap===true;}
  function id(n){return document.getElementById(n)}
  function statusPillV111(s){
    const x=String(s||'').toUpperCase();
    if(x==='FINAL')return '<span class="pill p-green">Final</span>';
    if(x==='PROVISIONAL'||x==='READY')return '<span class="pill p-blue">Sementara</span>';
    if(x==='REVIEW_REQUIRED')return '<span class="pill p-red">Perlu Review</span>';
    if(['PARTIAL','DATA_REQUIRED','CUT_OFF_REQUIRED','BASELINE_REQUIRED'].includes(x))return '<span class="pill p-amber">Data SAP Belum Lengkap</span>';
    return '<span class="pill p-gray">Data Belum Lengkap</span>';
  }
  function dateLabel(v){if(!v)return '—';const d=new Date(v+'T00:00:00');return Number.isNaN(d.getTime())?String(v):new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',year:'numeric'}).format(d)}
  try{dataPill=statusPillV111}catch(_){window.dataPill=statusPillV111}

  function sourceLabel(s){return ({MONTHLY_SAP:'SAP bulan sebelumnya',SAP_DAILY_LEDGER:'SAP movement',MASTER_CORRECTION:'Koreksi Master'})[String(s||'').toUpperCase()]||s||'—'}
  function renderSapV111(){
    const ex=typeof currentExposure==='function'?currentExposure():null,status=ex?.status||'DATA_REQUIRED',rows=Array.isArray(EXPOSURE?.rows)?EXPOSURE.rows:[];
    if(id('sapStatus'))id('sapStatus').innerHTML=`
      <div class="card sapmetric"><span class="small muted">Saldo Awal Periode</span><b>${fmt(ex?.opening_stock)} BOX</b><div class="small muted">Baseline ${dateLabel(ex?.baseline_date)}</div></div>
      <div class="card sapmetric"><span class="small muted">Stock Masuk</span><b>${fmt(ex?.stock_in)} BOX</b></div>
      <div class="card sapmetric"><span class="small muted">Stock Keluar</span><b>${fmt(ex?.stock_out)} BOX</b></div>
      <div class="card sapmetric"><span class="small muted">Stock Akhir / Eksposur</span><b>${fmt(ex?.exposure)} BOX</b><div style="margin-top:5px">${statusPillV111(status)} <span class="small muted">Data s.d. ${dateLabel(ex?.data_through_date)}</span></div></div>`;
    if(id('cutoffBlock'))id('cutoffBlock').innerHTML=`<div class="section-title">Status Data SAP</div><div class="tablewrap"><table class="tbl"><thead><tr><th>RDC</th><th>Baseline</th><th>Data SAP s.d.</th><th>Stock Akhir</th><th>Sumber</th><th>Status</th></tr></thead><tbody>${rows.length?rows.map(r=>`<tr><td><b>${esc(r.rdc)}</b></td><td>${dateLabel(r.baseline_date)}</td><td>${dateLabel(r.data_through_date)}</td><td>${r.exposure==null?'—':fmt(r.exposure)+' BOX'}</td><td>${esc(sourceLabel(r.source))}</td><td>${statusPillV111(r.status)}</td></tr>`).join(''):`<tr><td colspan="6"><div class="empty">Belum ada data SAP untuk scope/periode ini.</div></td></tr>`}</tbody></table></div><div class="hint" style="margin-top:9px">Tidak ada kewajiban input Stock Awal oleh SPV. Sistem memakai saldo SAP periode sebelumnya dan movement SAP. Tanggal checkpoint mengikuti <b>Posting Date terakhir di file</b>.</div>`;
    if(id('sapHistory'))id('sapHistory').innerHTML=`<div class="tablewrap"><table class="tbl"><thead><tr><th>File</th><th>RDC</th><th>Mode</th><th>Data s.d.</th><th>Rows</th><th>Status</th></tr></thead><tbody>${MOVEH.length?MOVEH.slice(0,30).map(r=>`<tr><td>${esc(r.filename)}</td><td>${esc(r.rdc)}</td><td>${esc(r.mode)}</td><td>${dateLabel(r.data_through_date)}</td><td>${fmt(r.total_rows)}</td><td>${statusPillV111(r.status==='READY'?'PROVISIONAL':r.status)}</td></tr>`).join(''):`<tr><td colspan="6"><div class="empty">Belum ada upload SAP.</div></td></tr>`}</tbody></table></div>`;
    if(id('reconHistory'))id('reconHistory').innerHTML=`<div class="tablewrap"><table class="tbl"><thead><tr><th>Periode</th><th>RDC</th><th>File</th><th>Rows</th><th>Status</th><th>Publish</th></tr></thead><tbody>${RECONH.length?RECONH.map(r=>`<tr><td>${esc(r.period)}</td><td>${esc(r.rdc)}</td><td>${esc(r.filename)}</td><td>${fmt(r.total_rows)}</td><td>${esc(r.status)}</td><td>${esc(r.published_at||'—')}</td></tr>`).join(''):`<tr><td colspan="6"><div class="empty">Belum ada rekonsiliasi final.</div></td></tr>`}</tbody></table></div>`;
  }
  try{renderSap=renderSapV111}catch(_){window.renderSap=renderSapV111}

  function headerIndex(h,names){for(const n of names){const i=h.findIndex(x=>String(x??'').trim().toLowerCase()===String(n).trim().toLowerCase());if(i>=0)return i}return -1}
  function isoDate(v){
    if(v instanceof Date && !Number.isNaN(v.getTime()))return `${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,'0')}-${String(v.getDate()).padStart(2,'0')}`;
    if(typeof v==='number' && typeof XLSX!=='undefined' && XLSX.SSF?.parse_date_code){const z=XLSX.SSF.parse_date_code(v);if(z)return `${z.y}-${String(z.m).padStart(2,'0')}-${String(z.d).padStart(2,'0')}`;}
    const d=new Date(v);if(!Number.isNaN(d.getTime()))return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return null;
  }
  function parseDailyLedger(wb){
    let found=null;
    for(const sn of wb.SheetNames){
      const g=XLSX.utils.sheet_to_json(wb.Sheets[sn],{header:1,defval:null,raw:true,cellDates:true});if(!g.length)continue;
      const h=(g[0]||[]).map(x=>String(x??'').trim());
      const cd=headerIndex(h,['Posting Date']),cq=headerIndex(h,['Quantity','Qty']),cu=headerIndex(h,['Unit of Entry','UoM','Unit']),cr=headerIndex(h,['Name 1','RDC','Plant Name']);
      if([cd,cq,cu,cr].some(i=>i<0))continue;
      const groups=new Map(),rawByRdc=new Map();
      for(let i=1;i<g.length;i++){
        const r=g[i],dt=isoDate(r[cd]),rdc=normRdc(r[cr]);if(!dt||!RDC_LIST.includes(rdc))continue;
        rawByRdc.set(rdc,(rawByRdc.get(rdc)||0)+1);
        const uom=String(r[cu]??'').trim().toUpperCase(),qty=Number(r[cq]);if(uom!=='BOX'||!Number.isFinite(qty)||qty===0)continue;
        const k=rdc+'|'+dt;let a=groups.get(k);if(!a){a={rdc_name:rdc,posting_date:dt,stock_in_box:0,stock_out_box:0,net_box:0,box_rows:0};groups.set(k,a)}
        if(qty>0)a.stock_in_box+=qty;else a.stock_out_box+=Math.abs(qty);a.net_box+=qty;a.box_rows++;
      }
      if(groups.size){found={rows:[...groups.values()].sort((a,b)=>a.posting_date.localeCompare(b.posting_date)),rawByRdc};break;}
    }
    return found;
  }

  function handleMovementFileV111(file){
    if(typeof XLSX==='undefined'){if(id('sapMsg'))id('sapMsg').textContent='Library Excel belum termuat.';return}
    if(!canUpload()){if(id('sapMsg'))id('sapMsg').textContent='Upload SAP hanya untuk Master / SPV RDC.';return}
    id('sapMsg').textContent='Membaca file SAP…';const fr=new FileReader();
    fr.onload=async e=>{try{
      const wb=XLSX.read(e.target.result,{type:'array',cellDates:true}),parsed=parseDailyLedger(wb);if(!parsed)throw new Error('File SAP tidak dikenali. Kolom Posting Date, Quantity, Unit of Entry dan Name 1/RDC wajib tersedia.');
      const byRdc=new Map();for(const r of parsed.rows){if(!byRdc.has(r.rdc_name))byRdc.set(r.rdc_name,[]);byRdc.get(r.rdc_name).push(r)}
      const allowed=[];for(const [rdc,rr] of byRdc){if(isSpv()&&rdc!==ACCESS.rdc_name)continue;allowed.push([rdc,rr]);}
      if(!allowed.length)throw new Error(isSpv()?'File tidak berisi data untuk RDC '+ACCESS.rdc_name+'.':'Tidak ada RDC yang dapat diproses.');
      const results=[];for(const [rdc,rr] of allowed){results.push(await rpc('breakage_stock_ledger_stage_v109',{p_filename:file.name,p_rows:rr,p_raw_rows:parsed.rawByRdc.get(rdc)||0,p_mode:id('sapMode')?.value||'MTD'}));}
      const latest=results.slice().sort((a,b)=>String(b.data_through_date||'').localeCompare(String(a.data_through_date||'')))[0];
      if(latest?.period){PERIOD=latest.period;if(id('period')&&[...id('period').options].some(o=>o.value===PERIOD))id('period').value=PERIOD;}
      id('sapMsg').innerHTML=`✓ Upload berhasil. <b>Data SAP s.d. ${dateLabel(latest?.data_through_date)}</b>. Upload overlap/ulang tidak menggandakan saldo.`;
      await loadAll();setTimeout(apply,80);
    }catch(x){id('sapMsg').textContent='Gagal: '+cleanErr(x.message)}};
    fr.readAsArrayBuffer(file);
  }
  try{handleMovementFile=handleMovementFileV111}catch(_){window.handleMovementFile=handleMovementFileV111}

  function ensureWarning(uploadBox){let w=id('sapUploadNote');if(!w){w=document.createElement('div');w.id='sapUploadNote';w.className='hint warning';w.style.marginTop='10px';uploadBox.appendChild(w)}w.innerHTML='Upload SAP hanya dapat dilakukan oleh <b>Master Nasional</b> atau <b>SPV RDC</b>.'}
  function ensureRoleNote(uploadBox){let n=id('sapDailyMtdNote');if(!n){n=document.createElement('div');n.id='sapDailyMtdNote';n.className='hint';n.style.marginTop='10px';uploadBox.appendChild(n)}n.innerHTML='Sistem menggunakan <b>Posting Date terakhir di file</b> sebagai tanggal data. Upload terlambat, overlap, atau file yang sama tetap aman karena data RDC + tanggal <b>diganti, bukan dijumlahkan dua kali</b>. Hanya UOM <b>BOX</b> yang masuk denominator Breakage.'}
  function apply(){
    if(!ready())return;const allowed=canUpload(),sapFile=id('sapFile'),uploadBox=sapFile?.closest('.uploadbox'),monthEndBtn=id('monthEndBtn');
    if(uploadBox){const label=uploadBox.querySelector('label[for="sapFile"]'),mode=id('sapMode'),title=uploadBox.querySelector('b'),sub=uploadBox.querySelector('.sub');
      if(title)title.textContent='Upload SAP Stock & Movement';if(sub)sub.textContent=isSpv()?'Upload SAP untuk RDC Anda. Jadwal Senin adalah target operasional, bukan batas sistem.':'Upload SAP per RDC. Tanggal checkpoint otomatis mengikuti data terakhir dalam file.';
      if(allowed){if(label){label.style.display='inline-block';label.textContent='Pilih File SAP'}sapFile.disabled=false;if(mode){mode.style.display='inline-block';if(isSpv()&&mode.value==='MONTH_END')mode.value='MTD'}id('sapUploadNote')?.remove();ensureRoleNote(uploadBox);sapFile.onchange=e=>{if(e.target.files?.[0])handleMovementFileV111(e.target.files[0])};}
      else{if(label)label.style.display='none';sapFile.disabled=true;if(mode)mode.style.display='none';id('sapDailyMtdNote')?.remove();ensureWarning(uploadBox)}
    }
    if(monthEndBtn)monthEndBtn.style.display=isMaster()?'':'none';
    if(id('cutoffModal'))id('cutoffModal').setAttribute('aria-hidden','true');
  }
  [30,100,250,600,1200,2500,4500].forEach(ms=>setTimeout(apply,ms));
  document.addEventListener('click',e=>{if(e.target&&(e.target.id==='refreshBtn'||e.target.dataset?.page==='sap'))setTimeout(apply,80)});
  window.addEventListener('focus',()=>setTimeout(apply,80));
  window.__SLS_SAP_UPLOAD_ACCESS='v111_daily_ledger';
})();
