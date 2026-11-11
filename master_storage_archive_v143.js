/* SLS Breakage Monitoring v143 — Master-only offline archive & storage. */
(function(){
'use strict';
if(window.__SLS_ARCHIVE_MASTER_143__)return;
window.__SLS_ARCHIVE_MASTER_143__=true;
const RDC=['Jakarta','Semarang','Surabaya','Denpasar','Palembang'];
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const size=n=>{const v=Number(n)||0;return v>=1e9?(v/1e9).toFixed(2)+' GB':v>=1e6?(v/1e6).toFixed(1)+' MB':(v/1000).toFixed(1)+' KB'};
const num=n=>Number(n||0).toLocaleString('id-ID');
const fmtPct=(n,d)=>d?(100*n/d).toFixed(1)+'%':'0,0%';
let installed=false,running=false,installedArchive=null;
const css=`
#slsArchNav143{border:1px solid rgba(118,190,242,.35);color:#e7f3ff}
#slsArchNav143.active{background:#185b9a}
#slsArchOpenMobile143{display:none}
#page-archive{max-width:1400px}
.sls-arch-layout{display:grid;grid-template-columns:minmax(230px,.8fr) minmax(400px,1.65fr);gap:16px}
.sls-arch-panel{background:#fff;border:1px solid #d7e4f0;border-radius:16px;padding:22px;min-width:0}
.sls-arch-title{font-size:21px;font-weight:900;color:#153b69;margin-bottom:7px}
.sls-arch-intro{font-size:13px;color:#58718a;line-height:1.65;margin-bottom:17px}
.sls-arch-label{font-size:12px;font-weight:800;color:#2e527b;display:block;margin-bottom:6px}
.sls-arch-inputs{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px}
.sls-arch-inputs select{width:100%;min-height:45px;border:1px solid #b9d1e8;border-radius:9px;padding:10px;font-size:14px;color:#183e69;background:#f8fbfe}
.sls-arch-btn{border:1px solid #83acd5;color:#115a9d;background:#fff;border-radius:9px;
min-height:43px;padding:10px 14px;font-size:13px;font-weight:850;cursor:pointer}
.sls-arch-btn.primary{background:#0e5eab;color:white;border-color:#0e5eab}
.sls-arch-btn.danger{background:#fff4f3;border-color:#ebafa8;color:#ab3128}
.sls-arch-btn:disabled{opacity:.45;cursor:not-allowed}
.sls-arch-buttons{display:flex;gap:9px;flex-wrap:wrap;margin:14px 0}
.sls-arch-stat{padding:12px;background:#f5f9fd;border-radius:10px;margin:12px 0;border:1px solid #e0eaf4}
.sls-arch-stat b{font-weight:900;color:#134879}
.sls-arch-meter{height:12px;background:#e5edf5;border-radius:20px;overflow:hidden;margin:9px 0}
.sls-arch-meter span{display:block;height:100%;border-radius:20px;background:#208c7d}
.sls-arch-meter.db span{background:#4383c1}
.sls-arch-meta{color:#637a92;font-size:12px;line-height:1.55}
.sls-arch-notice{background:#fff8e7;border:1px solid #f2daa7;padding:12px;border-radius:9px;color:#86601d;font-size:12px;line-height:1.6;margin:12px 0}
.sls-arch-success{background:#eef8f3;border-color:#b6dfc9;color:#157350}
.sls-arch-error{background:#fff0ed;border-color:#edbcb4;color:#b63f32}
.sls-arch-check{display:flex;align-items:flex-start;gap:8px;font-size:13px;color:#314e6d;margin:12px 0}
.sls-arch-check input{margin-top:3px;transform:scale(1.2)}
#slsArchPhrase143{width:100%;box-sizing:border-box;border:1px solid #bfcfe0;border-radius:8px;padding:10px;margin:6px 0 9px;min-height:45px}
#slsArchFile143{max-width:100%;font-size:13px;margin:10px 0}
#slsArchLog143{font-size:12px;line-height:1.5;color:#41617e;white-space:pre-wrap;overflow-wrap:anywhere;min-height:28px}
.sls-arch-kpi{display:flex;gap:8px;flex-wrap:wrap}
.sls-arch-kpi span{padding:7px 10px;background:#eef5fb;border:1px solid #d2e1ee;border-radius:8px;font-size:12px;color:#2b587f}
@media(max-width:1000px){.sls-arch-layout{grid-template-columns:1fr}}
@media(max-width:760px){#slsArchOpenMobile143{display:block;min-height:41px;margin-bottom:10px}
.sls-arch-panel{padding:16px}.sls-arch-inputs{grid-template-columns:1fr}
.sls-arch-title{font-size:18px}.sls-arch-buttons button{flex:1 1 170px}}
`;
function isMaster(){try{return !!(ACCESS&&ACCESS.is_master===true&&SESSION&&SESSION.access_token)}catch(_){return false}}
function message(s,type=''){const node=$('slsArchLog143');if(!node)return;node.className='sls-arch-notice '+(type?'sls-arch-'+type:'');node.textContent=s}
async function call(fn,args){if(!isMaster())throw Error('Akun Master diperlukan');return await rpc(fn,args)}
function selectMonth(){
const sel=$('slsArchMonth143');if(!sel)return;
const d=new Date();
for(let i=1;i<=24;i++){const m=new Date(d.getFullYear(),d.getMonth()-i,1);
const k=m.getFullYear()+'-'+String(m.getMonth()+1).padStart(2,'0');
const o=new Option(m.toLocaleDateString('id-ID',{month:'long',year:'numeric'}),k);sel.add(o)}
}

/* v145: storage status shown immediately on Monitoring overview and sidebar. */
function storageLevel145(p){
 if(!Number.isFinite(p)) return {key:'unknown',label:'Belum tersedia',color:'#a0afc1'};
 if(p>=90)return {key:'critical',label:'KRITIS',color:'#c13c35'};
 if(p>=75)return {key:'high',label:'Tinggi',color:'#dc8218'};
 if(p>=50)return {key:'warning',label:'PERINGATAN',color:'#d39c28'};
 return {key:'normal',label:'Normal',color:'#168778'};
}
function storagePercent145(v){return Number(v).toLocaleString('id-ID',{minimumFractionDigits:1,maximumFractionDigits:1})+'%'}
function installOverviewStorage145(){
 if(!isMaster())return;
 if(!$('slsOverviewStorageStyle145')){
 const style=document.createElement('style');
 style.id='slsOverviewStorageStyle145';
 style.textContent=[
 '#slsOverviewStorage145{border:1px solid #d0deee;border-radius:15px;padding:18px 19px;margin:15px 0 18px;background:#fff;box-shadow:0 3px 13px rgba(15,46,86,.045)}',
 '#slsOverviewStorage145 .sls-storage-top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px}',
 '#slsOverviewStorage145 h3{font-size:19px;font-weight:900;color:#153b6b;margin:0 0 3px}',
 '#slsOverviewStorage145 .sls-storage-desc{font-size:12px;line-height:1.5;color:#6b819a}',
 '#slsOverviewStorage145 .sls-storage-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
 '#slsOverviewStorage145 button{border-radius:8px;padding:9px 13px;font-size:13px;min-height:38px;font-weight:850;background:#fff;color:#145a9d;border:1px solid #b1cbe3}',
 '#slsOverviewStorage145 button:hover{background:#eff7ff}',
 '#slsOverviewStorage145 .sls-storage-open{background:#165eaa;color:#fff;border-color:#165eaa}',
 '#slsOverviewStorage145 .sls-storage-open:hover{background:#104f94}',
 '#slsOverviewStorage145 .sls-storage-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}',
 '#slsOverviewStorage145 .sls-storage-card{padding:14px 16px;background:#f7fafd;border:1px solid #dce8f3;border-radius:11px;min-width:0}',
 '#slsOverviewStorage145 .sls-storage-card[data-level="warning"]{background:#fffaef;border-color:#efd8a8}',
 '#slsOverviewStorage145 .sls-storage-card[data-level="high"],#slsOverviewStorage145 .sls-storage-card[data-level="critical"]{background:#fff4f1;border-color:#e9bfb7}',
 '#slsOverviewStorage145 .sls-storage-label{font-size:13px;font-weight:850;color:#436282;display:flex;justify-content:space-between;gap:12px;align-items:center}',
 '#slsOverviewStorage145 .sls-storage-val{font-size:26px;font-weight:900;line-height:1.3;color:#143c6a;margin:6px 0}',
 '#slsOverviewStorage145 .sls-storage-card[data-level="warning"] .sls-storage-val{color:#a77316}',
 '#slsOverviewStorage145 .sls-storage-card[data-level="high"] .sls-storage-val,#slsOverviewStorage145 .sls-storage-card[data-level="critical"] .sls-storage-val{color:#ad3c35}',
 '#slsOverviewStorage145 .sls-storage-small{font-size:12px;color:#627b94;line-height:1.5}',
 '#slsOverviewStorage145 .sls-storage-track{height:10px;background:#e1eaf3;border-radius:20px;overflow:hidden;margin:11px 0 7px}',
 '#slsOverviewStorage145 .sls-storage-fill{height:100%;background:#168778;width:0;border-radius:20px;transition:width .25s ease}',
 '#slsOverviewStorage145 .sls-storage-warning{font-size:13px;color:#825619;background:#fff6e8;border:1px solid #eccb91;padding:12px 14px;border-radius:10px;margin-top:11px;line-height:1.55;font-weight:750}',
 '#slsOverviewStorage145 .sls-storage-warning[data-critical="true"]{color:#a1362f;background:#fff0ef;border-color:#eca9a4}',
 '#slsOverviewStorage145 .sls-storage-foot{font-size:11px;color:#6d8298;margin-top:10px;line-height:1.5}',
 '#slsOverviewSide145{background:rgba(255,255,255,.09);border:1px solid rgba(206,230,252,.18);color:white;border-radius:10px;padding:10px;margin:0 0 12px}',
 '#slsOverviewSide145[data-warn="true"]{background:rgba(180,100,17,.20);border-color:#e4b16b}',
 '#slsOverviewSide145 .head{font-weight:900;font-size:12px;margin-bottom:8px}',
 '#slsOverviewSide145[data-warn="true"] .head{color:#ffe2ac}',
 '#slsOverviewSide145 .line{display:flex;justify-content:space-between;gap:5px;font-size:11px;line-height:1.5}',
 '#slsOverviewSide145 .line b{font-size:12px;color:#e3f8ff}',
 '@media(max-width:900px){#slsOverviewStorage145 .sls-storage-grid{grid-template-columns:1fr}}',
 '@media(max-width:760px){#slsOverviewStorage145{padding:13px;margin:12px 0}#slsOverviewStorage145 h3{font-size:17px}#slsOverviewStorage145 .sls-storage-val{font-size:23px}}'
 ].join('');
 document.head.appendChild(style);
 }
 const cards=$('summaryCards');
 if(cards&&!$('slsOverviewStorage145')){
 const panel=document.createElement('section');
 panel.id='slsOverviewStorage145';
 panel.setAttribute('aria-label','Kapasitas penyimpanan SLS untuk Master');
 panel.innerHTML=
 '<div class="sls-storage-top"><div><h3>Storage SLS · Status Kapasitas</h3><div class="sls-storage-desc">Peringatan otomatis ketika penggunaan file atau database mencapai 50%</div></div>'+
 '<div class="sls-storage-actions"><button id="slsStorageRefresh145" type="button">↻ Perbarui</button><button id="slsStorageOpen145" type="button" class="sls-storage-open">Buka Arsip & Storage</button></div></div>'+
 '<div class="sls-storage-grid">'+
 '<div class="sls-storage-card" id="slsStorageFile145"><div class="sls-storage-label">Foto & File Storage <span data-status>—</span></div><div class="sls-storage-val" data-pct>—</div><div class="sls-storage-small" data-used>Menunggu data...</div><div class="sls-storage-track"><div class="sls-storage-fill"></div></div><div class="sls-storage-small" data-left>Sisa: —</div></div>'+
 '<div class="sls-storage-card" id="slsStorageDb145"><div class="sls-storage-label">Database <span data-status>—</span></div><div class="sls-storage-val" data-pct>—</div><div class="sls-storage-small" data-used>Menunggu data...</div><div class="sls-storage-track"><div class="sls-storage-fill"></div></div><div class="sls-storage-small" data-left>Sisa: —</div></div>'+
 '</div><div class="sls-storage-warning" role="alert" id="slsStorageWarning145" hidden></div><div class="sls-storage-foot" id="slsStorageFoot145">Memuat status Supabase...</div>';
 cards.insertAdjacentElement('afterend',panel);
 $('slsStorageRefresh145').onclick=reloadStorage;
 $('slsStorageOpen145').onclick=()=>{
 const link=$('slsArchNav143');if(link)link.click();
 else if(typeof showPage==='function')showPage('archive');
 };
 }
 const focus=document.querySelector('#app .sidebar .side-note');
 if(focus&&!$('slsOverviewSide145')){
 const sidebar=document.createElement('div');
 sidebar.id='slsOverviewSide145';
 sidebar.innerHTML='<div class="head">◫ Storage SLS</div><div class="line"><span>Foto / File</span><b id="slsStorageSideFile145">—</b></div><div class="line"><span>Database</span><b id="slsStorageSideDb145">—</b></div>';
 focus.insertAdjacentElement('afterend',sidebar);
 }
}
function renderOverviewStorage145(data){
 if(!isMaster())return;
 installOverviewStorage145();
 const status=[];
 for(const [id,prefix] of [['slsStorageFile145','storage'],['slsStorageDb145','database']]){
 const card=$(id);if(!card)continue;
 const used=Number(data[prefix+'_used_bytes']);
 const max=Number(data[prefix+'_quota_bytes']);
 const percent=Number.isFinite(used)&&Number.isFinite(max)&&max>0?used/max*100:NaN;
 const v=storageLevel145(percent);
 card.dataset.level=v.key;
 card.querySelector('[data-status]').textContent=v.label;
 card.querySelector('[data-pct]').textContent=Number.isFinite(percent)?storagePercent145(percent):'—';
 card.querySelector('[data-used]').textContent=size(used)+' dari '+size(max)+' terpakai';
 card.querySelector('[data-left]').textContent='Sisa '+size(Math.max(0,max-used));
 const fill=card.querySelector('.sls-storage-fill');fill.style.width=Number.isFinite(percent)?Math.min(100,percent)+'%':'0';fill.style.background=v.color;
 status.push({prefix,p:percent,key:v.key});
 }
 const file=status.find(x=>x.prefix==='storage');
 const db=status.find(x=>x.prefix==='database');
 const sidebar=$('slsOverviewSide145');
 if(sidebar){
 const warning=status.some(x=>x.p>=50);
 sidebar.dataset.warn=warning?'true':'false';
 sidebar.querySelector('.head').textContent=warning?'⚠ Storage ≥50%':'◫ Storage SLS';
 $('slsStorageSideFile145').textContent=Number.isFinite(file?.p)?storagePercent145(file.p):'—';
 $('slsStorageSideDb145').textContent=Number.isFinite(db?.p)?storagePercent145(db.p):'—';
 }
 const warningBox=$('slsStorageWarning145');
 if(warningBox){
 const reached=status.filter(x=>x.p>=50);
 warningBox.hidden=reached.length===0;
 if(reached.length){
 const critical=reached.some(x=>x.p>=90),high=reached.some(x=>x.p>=75);
 const label=critical?'KRITIS':high?'PERINGATAN TINGGI':'PERINGATAN 50%';
 warningBox.dataset.critical=critical?'true':'false';
 warningBox.textContent='⚠ '+label+': '+reached.map(x=>(x.prefix==='storage'?'File Storage':'Database')+' '+storagePercent145(x.p)).join(' · ')+'. Periksa arsip bulanan dan backup. Hapus hanya data yang telah Final dan terverifikasi.';
 }
 }
 const foot=$('slsStorageFoot145');
 if(foot)foot.textContent='Foto Breakage: '+num(data.breakage_files_count)+' file ('+size(data.breakage_files_bytes)+') · '+(data.observed_at||'Waktu pemeriksaan tidak tersedia')+'. Estimasi pemakaian proyek terhadap batas Free, bukan total billing organisasi.';
}

function setStorage(data){
for(const kind of ['storage','database']){
const used=Number(kind==='storage'?data.storage_used_bytes:data.database_used_bytes)||0;
const limit=Number(kind==='storage'?data.storage_quota_bytes:data.database_quota_bytes)||1;
const remain=Math.max(0,limit-used),percent=100*used/limit;
const root=$('slsArch'+kind+'143');if(!root)continue;
root.querySelector('[data-remain]').textContent=size(remain)+' sisa';
root.querySelector('[data-used]').textContent=size(used)+' dari '+size(limit)+' terpakai ('+percent.toFixed(1)+'%)';
const bar=root.querySelector('.sls-arch-meter span');bar.style.width=Math.min(100,percent)+'%';
bar.style.background=percent>=90?'#c83c35':percent>=75?'#e38b23':percent>=50?'#d39b27':kind==='storage'?'#208c7d':'#4383c1';
}
$('slsArchFiles143').textContent='Foto Breakage: '+num(data.breakage_files_count)+' file · '+size(data.breakage_files_bytes);
$('slsArchObserved143').textContent='Terakhir diperiksa: '+(data.observed_at||'—');
renderOverviewStorage145(data);
}
async function reloadStorage(){
try{const d=await call('breakage_storage_status_master_v142',{});setStorage(d)}
catch(e){$('slsArchObserved143').textContent='Storage tidak tersedia: '+String(e.message||e)}
}
const month=()=>$('slsArchMonth143').value,rdc=()=>$('slsArchRdc143').value;
async function reloadStatus(){
if(!isMaster())return;
try{
const d=await call('breakage_offline_archive_status_v143',{p_period:month(),p_rdc:rdc()});
const text=[
'Insiden aktif: '+num(d.active_incidents),
'Belum final: '+num(d.unfinished),
'KPI bulanan: '+(d.monthly_kpi_ready?'Tersedia':'Belum lengkap'),
'Rekonsiliasi SAP: '+(d.sap_published?'Published':'Belum published'),
'Cut-off: '+(d.past_cutoff?'Lewat':'Belum lewat'),
'Arsip: '+(d.archive?.status||'Belum dibuat')
];
$('slsArchCheck143').innerHTML=text.map(x=>'<span>'+esc(x)+'</span>').join('');
const canPurge=d.cleanup_eligible&&d.archive?.status==='BACKUP_VERIFIED';
$('slsArchPurge143').disabled=!canPurge;
$('slsArchCheck143').dataset.allowed=canPurge?'1':'0';
$('slsArchResume143').hidden=d.archive?.status!=='DB_PURGED_MEDIA_PENDING';
if(!canPurge){
$('slsArchEligibility143').textContent=d.archive?.status==='COMPLETE'
?'Sudah selesai diarsipkan. Rekap bulanan tetap tersimpan.'
:'Penghapusan dikunci sampai semua insiden Final, KPI dan SAP siap, serta arsip offline terverifikasi.';
}else $('slsArchEligibility143').textContent='Semua syarat terpenuhi. Verifikasi file offline dan konfirmasi dua lokasi penyimpanan sebelum menghapus.';
}catch(e){message('Gagal memeriksa status: '+String(e.message||e),'error')}
}
function loadZipLib(){
if(window.JSZip)return Promise.resolve(window.JSZip);
return new Promise((resolve,reject)=>{
const tag=document.createElement('script');
tag.src='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
tag.async=true;tag.onload=()=>window.JSZip?resolve(window.JSZip):reject(Error('Library ZIP tidak tersedia'));
tag.onerror=()=>reject(Error('Gagal membuka pembuat ZIP. Pastikan koneksi internet.'));
document.head.appendChild(tag);
})}
function filePath(p){return String(p||'').split('/').filter(x=>x&&x!=='.'&&x!=='..').map(s=>s.replace(/[^a-zA-Z0-9_.()@ -]/g,'_')).join('/')}
function safeCsv(v){let s=String(v??'');if(/^[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'}
function csv(rows,cols){return [cols.join(','),...rows.map(r=>cols.map(k=>safeCsv(r[k])).join(','))].join('\r\n')}
function baHtml(entries,photoMap){
const group=entries[0]||{},fields=[
['No BA',group.no_ba],['RDC',group.rdc_name],['Tanggal',group.occurrence_date],
['Jenis',group.incident_type==='warehouse'?'Pecah Pallet':'Pecah Kirim'],
['No Surat Jalan',group.no_sj],['Pelanggan',group.customer],
['Vendor',group.transporter],['Driver',group.driver_name]];
const meta=fields.map(([k,v])=>'<tr><th>'+esc(k)+'</th><td>'+esc(v||'—')+'</td></tr>').join('');
const rows=entries.map(i=>'<tr><td>'+esc(i.incident_no)+'</td><td>'+esc(i.item_code)+'</td><td>'+esc(i.ceramic_series)+'</td><td>'+esc(i.product_size)+'</td><td>'+esc(i.qty_box)+'</td><td>'+esc(i.cause)+'</td></tr>').join('');
const imgs=[];for(const item of entries){for(const p of Array.isArray(item.photo_paths)?item.photo_paths:[]){
const rel=photoMap[p];if(rel)imgs.push('<figure><img src="../'+esc(rel)+'"><figcaption>'+esc(item.incident_no)+'</figcaption></figure>');
}}
return '<!doctype html><html lang="id"><meta charset="utf-8"><title>BA '+esc(group.no_ba||group.incident_no)+'</title>'+
'<style>body{font:14px Arial;color:#142f52;max-width:950px;margin:24px auto;padding:15px}h1{font-size:22px}table{width:100%;border-collapse:collapse;margin:12px 0}th,td{border:1px solid #afbfce;padding:8px;text-align:left}th{background:#eaf2f9}figure{display:inline-block;width:210px;vertical-align:top;margin:8px}img{width:100%;height:150px;object-fit:contain}figcaption{font-size:11px}.sub{color:#596e86}@media print{body{margin:0}}</style>'+
'<h1>Berita Acara Breakage — Arsip Offline</h1><p class="sub">Salinan arsip; tanda tangan asli lihat foto/lampiran.</p>'+
'<table>'+meta+'</table><table><tr><th>Insiden</th><th>Item</th><th>Seri</th><th>Size</th><th>Qty BOX</th><th>Penyebab</th></tr>'+rows+'</table>'+
'<h2>Lampiran Foto</h2>'+imgs.join('')+'</html>'}
async function sha256(blob){const b=await blob.arrayBuffer(),h=await crypto.subtle.digest('SHA-256',b);return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function photoFetch(path){
const url=SUPABASE_URL+'/storage/v1/object/authenticated/breakage-evidence/'+String(path).split('/').map(encodeURIComponent).join('/');
const r=await fetch(url,{headers:{apikey:PUBLIC_ANON,Authorization:'Bearer '+SESSION.access_token},cache:'no-store'});
if(!r.ok)throw Error('Foto '+path+' tidak dapat diunduh (HTTP '+r.status+'). Arsip dibatalkan.');
return await r.blob();
}
async function exportZip(){
if(running)return;running=true;$('slsArchExport143').disabled=true;
try{
message('Menyiapkan data arsip dari database…');
const selectedMonth=month(),selectedRdc=rdc();
const d=await call('breakage_offline_archive_read_v143',{p_period:selectedMonth,p_rdc:selectedRdc});
if(!d.incidents?.length)throw Error('Belum ada insiden yang bisa diarsipkan.');
const files=d.evidence||[];const missing=files.filter(x=>!x.exists);
if(missing.length)throw Error('Ada '+missing.length+' foto yang tidak ditemukan di storage. Arsip tidak dapat dibuat sebelum diperbaiki.');
const ZIP=await loadZipLib(),zip=new ZIP();
const today=new Date().toISOString().slice(0,10).replace(/-/g,'');
const basename='SLS_Breakage_'+selectedMonth+'_'+selectedRdc+'_'+today;
const photoMap={};const photos=[];
for(let i=0;i<files.length;i++){
 const item=files[i];message('Mengunduh foto '+(i+1)+' / '+files.length+'…');
 const blob=await photoFetch(item.path);
 if(Number.isFinite(Number(item.bytes))&&Number(item.bytes)!==blob.size)throw Error('Ukuran foto berubah: '+item.path);
 const safe='evidence/'+filePath(item.path);
 photoMap[item.path]=safe;zip.file(safe,blob,{binary:true,compression:'STORE'});
 photos.push({path:item.path,archive_path:safe,bytes:blob.size});
}
zip.file('data/insiden.json',JSON.stringify(d.incidents,null,2));
zip.file('data/insiden.csv',csv(d.incidents,['incident_no','rdc_name','occurrence_date','incident_type','item_code','ceramic_series','product_size','qty_box','no_ba','cause','status']));
zip.file('data/audit.json',JSON.stringify(d.audit,null,2));
zip.file('data/foto_edit.json',JSON.stringify(d.photo_annotations,null,2));
zip.file('data/kpi_bulanan.json',JSON.stringify(d.monthly_kpi,null,2));
zip.file('data/sap_upload.json',JSON.stringify(d.sap_uploads,null,2));
zip.file('data/rekonsiliasi.json',JSON.stringify(d.reconciliation,null,2));
zip.file('data/manifest_foto.json',JSON.stringify(photos,null,2));
const groups={};for(const i of d.incidents){
 if(i.deleted_at)continue;
 const key=i.no_ba||i.incident_no||String(i.id);
 (groups[key]||(groups[key]=[])).push(i);
}
for(const [ba,entries] of Object.entries(groups))zip.file('BA/'+filePath(ba)+'.html',baHtml(entries,photoMap));
const manifest={period:d.period,rdc:d.rdc,snapshot_fingerprint:d.snapshot_fingerprint,
incident_count:d.incidents.length,audit_count:d.audit.length,evidence_count:files.length,
created_at:d.exported_at,archive_version:143,zip_basename:basename};
zip.file('manifest.json',JSON.stringify(manifest,null,2));
zip.file('README_PENTING.txt','ARSIP SLS BREAKAGE\nPeriode: '+d.period+' / '+d.rdc+'\n\nSimpan ZIP ini ke minimal 2 lokasi aman.\nJangan hapus atau ubah file.\nBuka folder BA untuk salinan Berita Acara dan folder evidence untuk foto.\nData incident, audit, KPI dan rekonsiliasi tersedia di folder data.\nSetelah unduh, unggah file ZIP tersebut kembali melalui tombol VERIFIKASI BACKUP untuk mencocokkan checksum.\nData akan tetap berada di database sampai seluruh persyaratan Master terpenuhi.\n');
message('Mengemas ZIP dan menghitung checksum…');
const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:1}});
const checksum=await sha256(blob);
const name=basename+'.zip';
const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),45000);
installedArchive={name,checksum,bytes:blob.size,period:d.period,rdc:d.rdc};
message('File '+name+' ('+size(blob.size)+') sudah disiapkan untuk download.\nSHA-256: '+checksum+'\nSimpan ke dua lokasi, lalu pilih file ZIP tersebut pada Verifikasi Backup.','success');
}catch(e){message('Arsip gagal: '+String(e.message||e),'error')}
finally{running=false;$('slsArchExport143').disabled=false}
}
async function verifyZip(file){
if(!file)return;
try{
message('Memeriksa file ZIP yang Anda pilih…');const ZIP=await loadZipLib();
const digest=await sha256(file);const zip=await ZIP.loadAsync(file,{checkCRC32:true});
const text=await zip.file('manifest.json')?.async('string');
if(!text)throw Error('Manifest arsip tidak ditemukan.');
const m=JSON.parse(text);
if(m.period!==month()||m.rdc!==rdc())throw Error('Bulan/RDC ZIP berbeda dari pilihan saat ini.');
const photoPaths=JSON.parse(await zip.file('data/manifest_foto.json')?.async('string')||'[]');
if(photoPaths.length!==m.evidence_count)throw Error('Jumlah foto tidak cocok dengan manifest.');
for(const item of photoPaths){if(!zip.file(item.archive_path))throw Error('Foto hilang dalam ZIP: '+item.path)}
if(!zip.file('data/insiden.json')||!zip.file('data/audit.json'))throw Error('Data insiden atau audit tidak lengkap.');
if(!file.name.startsWith('SLS_Breakage_'+month()+'_'+rdc()+'_'))throw Error('Nama arsip tidak sesuai.');
message('File ZIP valid. Mendaftarkan checksum cadangan di database…');
const result=await call('breakage_offline_archive_register_v143',{p_period:month(),p_rdc:rdc(),
p_filename:file.name,p_sha256:digest,p_snapshot_fingerprint:m.snapshot_fingerprint,
p_zip_bytes:file.size,p_evidence_count:m.evidence_count});
installedArchive={name:file.name,checksum:digest,bytes:file.size,period:m.period,rdc:m.rdc};
message('VERIFIED — '+num(result.incidents)+' insiden, '+num(result.photos)+' file evidence.\nChecksum SHA-256: '+digest+
'\nSimpan ZIP di dua tempat. Penghapusan baru aktif apabila data Final, SAP Published, dan KPI lengkap.','success');
await reloadStatus();
}catch(e){message('Verifikasi gagal: '+String(e.message||e),'error')}
}
async function deleteMedia(paths){
const n=paths.length;for(let i=0;i<n;i+=80){
const chunk=paths.slice(i,i+80),res=await fetch(SUPABASE_URL+'/storage/v1/object/breakage-evidence',
{method:'DELETE',headers:{apikey:PUBLIC_ANON,Authorization:'Bearer '+SESSION.access_token,'Content-Type':'application/json'},
body:JSON.stringify({prefixes:chunk})});
if(!res.ok)throw Error('Penghapusan foto gagal (HTTP '+res.status+'). Klik Lanjutkan Cleanup untuk mencoba lagi.');
message('Menghapus file evidence yang telah dibackup: '+Math.min(i+chunk.length,n)+' / '+n);
}
const fin=await call('breakage_offline_archive_finish_v143',{p_period:month(),p_rdc:rdc()});
if(fin.status!=='COMPLETE')throw Error('Masih ada '+fin.remaining_files+' foto yang harus dibersihkan.');
message('Arsip selesai. Detail lama telah dihapus; rekap KPI dan ringkasan historis tetap tersimpan.','success');
await reloadStorage();await reloadStatus();
}
async function purge(){
if(running)return;
const phrase='HAPUS ARSIP '+month()+' '+rdc().toUpperCase();
if(!$('slsArchCheckbox143').checked){message('Simpan ZIP ke minimal dua lokasi terlebih dahulu.','error');return}
if($('slsArchPhrase143').value.trim()!==phrase){message('Ketik tepat: '+phrase,'error');return}
if(!installedArchive||installedArchive.period!==month()||installedArchive.rdc!==rdc()){
message('Verifikasi file ZIP pada sesi ini sebelum penghapusan.','error');return}
if(!confirm('Yakin menghapus data detail '+month()+' / '+rdc()+' dari database? Arsip ZIP harus tersimpan aman.'))return;
running=true;$('slsArchPurge143').disabled=true;
try{
const res=await call('breakage_offline_archive_purge_v143',{p_period:month(),p_rdc:rdc(),
p_sha256:installedArchive.checksum,p_phrase:phrase});
message('Data detail telah dipindahkan ke arsip. Membersihkan foto yang sudah diekspor…');
await deleteMedia(res.pending_evidence_paths||[]);
}catch(e){message('Proses belum selesai: '+String(e.message||e),'error');await reloadStatus()}
finally{running=false}
}
async function resume(){
if(running)return;running=true;
try{const s=await call('breakage_offline_archive_pending_media_v143',{p_period:month(),p_rdc:rdc()});
if(s.status!=='DB_PURGED_MEDIA_PENDING')throw Error('Tidak ada cleanup tertunda.');
await deleteMedia(s.paths||[]);
}catch(e){message(String(e.message||e),'error')}finally{running=false}
}
function install(){
if(installed)return;
installed=true;
const style=document.createElement('style');style.id='slsArchStyle143';style.textContent=css;document.head.appendChild(style);
const nav=document.querySelector('#app .sidebar .nav');
const content=document.querySelector('#app .content');
if(!nav||!content)return;
const button=document.createElement('button');button.id='slsArchNav143';button.dataset.page='archive';button.textContent='▤ Arsip & Storage';nav.appendChild(button);
button.onclick=()=>{showPage('archive');reloadStorage();reloadStatus()};
const shortcut=document.createElement('button');shortcut.type='button';shortcut.id='slsArchOpenMobile143';shortcut.className='secondary';
shortcut.textContent='▤ Arsip & Storage (Master)';shortcut.onclick=button.onclick;
content.insertBefore(shortcut,content.firstChild);
const sec=document.createElement('section');sec.id='page-archive';sec.className='page';
sec.innerHTML=
'<div class="sls-arch-layout">'+
'<div class="sls-arch-panel"><div class="sls-arch-title">Sisa Storage</div>'+
'<div class="sls-arch-intro">Pemakaian proyek Supabase SLS. Terbarui saat Master membuka halaman atau menekan Perbarui.</div>'+
'<div class="sls-arch-stat" id="slsArchstorage143"><b>File storage</b><div data-remain class="sls-arch-title">—</div><div data-used class="sls-arch-meta">Memuat…</div><div class="sls-arch-meter"><span></span></div></div>'+
'<div class="sls-arch-stat" id="slsArchdatabase143"><b>Database</b><div data-remain class="sls-arch-title">—</div><div data-used class="sls-arch-meta">Memuat…</div><div class="sls-arch-meter db"><span></span></div></div>'+
'<div class="sls-arch-meta" id="slsArchFiles143"></div><div class="sls-arch-meta" id="slsArchObserved143"></div>'+
'<div class="sls-arch-buttons"><button class="sls-arch-btn" id="slsArchRefreshStorage143">↻ Perbarui Storage</button></div>'+
'<div class="sls-arch-notice">Paket Free: file 1 GB per organisasi, database 500 MB per proyek. Statistik saat ini, bukan rata-rata tagihan bulanan.</div></div>'+
'<div class="sls-arch-panel"><div class="sls-arch-title">Arsip Offline Bulanan</div>'+
'<div class="sls-arch-intro">Download semua insiden, audit, foto, BA, KPI dan data rekonsiliasi per RDC. Setelah download, unggah kembali ZIP untuk verifikasi. Penghapusan terkunci sampai laporan Final.</div>'+
'<div class="sls-arch-inputs"><div><label class="sls-arch-label">Bulan</label><select id="slsArchMonth143"></select></div>'+
'<div><label class="sls-arch-label">RDC</label><select id="slsArchRdc143">'+RDC.map(r=>'<option>'+r+'</option>').join('')+'</select></div></div>'+
'<div id="slsArchCheck143" class="sls-arch-kpi"></div><p class="sls-arch-meta" id="slsArchEligibility143"></p>'+
'<div class="sls-arch-buttons"><button class="sls-arch-btn" id="slsArchCheckBtn143">↻ Cek Kesiapan</button><button class="sls-arch-btn primary" id="slsArchExport143">↓ Download Arsip ZIP</button></div>'+
'<label class="sls-arch-label" for="slsArchFile143">Verifikasi file ZIP yang sudah disimpan</label>'+
'<input type="file" id="slsArchFile143" accept=".zip,application/zip">'+
'<div class="sls-arch-notice">Hanya Master yang boleh menghapus. File harus tersimpan offline pada minimal dua lokasi. Tidak ada penghapusan otomatis saat cut-off.</div>'+
'<label class="sls-arch-check"><input type="checkbox" id="slsArchCheckbox143">Saya sudah menyimpan arsip ZIP di dua lokasi terpisah dan memeriksa isinya.</label>'+
'<label class="sls-arch-label" for="slsArchPhrase143">Konfirmasi penghapusan (contoh: HAPUS ARSIP 2026-09 JAKARTA)</label>'+
'<input id="slsArchPhrase143" type="text" autocomplete="off" placeholder="Ketik HAPUS ARSIP YYYY-MM RDC">'+
'<div class="sls-arch-buttons"><button class="sls-arch-btn danger" disabled id="slsArchPurge143">Hapus Data Detail yang Sudah Final</button>'+
'<button class="sls-arch-btn" id="slsArchResume143" hidden>Lanjutkan Cleanup Foto</button></div>'+
'<div id="slsArchLog143" role="status" class="sls-arch-notice">Belum ada proses arsip.</div></div></div>';
content.appendChild(sec);
selectMonth();
$('slsArchMonth143').addEventListener('change',()=>{installedArchive=null;reloadStatus()});
$('slsArchRdc143').addEventListener('change',()=>{installedArchive=null;reloadStatus()});
$('slsArchRefreshStorage143').onclick=reloadStorage;
$('slsArchCheckBtn143').onclick=reloadStatus;
$('slsArchExport143').onclick=exportZip;
$('slsArchFile143').addEventListener('change',e=>verifyZip(e.target.files?.[0]));
$('slsArchPurge143').onclick=purge;
$('slsArchResume143').onclick=resume;
installOverviewStorage145();
reloadStorage();reloadStatus();
}
function reconcile(){
if(!isMaster()){
const b=$('slsArchNav143'),s=$('page-archive'),o=$('slsArchOpenMobile143');
if(b)b.remove();if(s)s.remove();if(o)o.remove();installed=false;return;
}
install();
}
function boot(){
reconcile();
const app=document.getElementById('app');
if(app){new MutationObserver(reconcile).observe(app,{attributes:true,attributeFilter:['style']});}
let counter=0;
const t=setInterval(()=>{reconcile();if(++counter>120)clearInterval(t)},1000);
setInterval(()=>{if(isMaster()&&installed)reloadStorage()},300000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();