
/* SLS Breakage — permanent historical breakdown displayed after offline cleanup. */
(function(){
'use strict';
if(window.__SLS_ARCHIVE_HISTORICAL_143__)return;
window.__SLS_ARCHIVE_HISTORICAL_143__=true;
const style=document.createElement('style');
style.id='archiveHistoricalCss143';
style.textContent=
'#slsArchivedNote143{border:1px solid #bad8eb;background:#eef7ff;border-radius:11px;padding:13px 16px;margin:12px 0;font-size:13px;color:#244f77;line-height:1.55}'+
'#slsArchivedRecap143{margin:13px 0;padding:19px;border:1px solid #c3d9ea;background:#f8fbff;border-radius:14px}'+
'#slsArchivedRecap143 h3{color:#184776;font-size:19px;font-weight:900;margin:0 0 5px}'+
'#slsArchivedRecap143 p{font-size:12px;color:#526f8d;line-height:1.6;margin:0 0 12px}'+
'#slsArchivedRecap143 .columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}'+
'#slsArchivedRecap143 .snap{background:#fff;border:1px solid #dde9f2;border-radius:10px;padding:13px}'+
'#slsArchivedRecap143 .snap h4{font-size:15px;margin:0 0 10px;color:#1b527f}'+
'#slsArchivedRecap143 table{width:100%;border-collapse:collapse;font-size:13px}'+
'#slsArchivedRecap143 th,#slsArchivedRecap143 td{text-align:left;padding:8px 6px;border-bottom:1px solid #e5eef6}'+
'#slsArchivedRecap143 td:last-child{text-align:right;font-weight:900}'+
'@media(max-width:760px){#slsArchivedRecap143 .columns{grid-template-columns:1fr}}';
document.head.appendChild(style);
const esc=x=>String(x??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
const fmt=x=>Number(x||0).toLocaleString('id-ID',{maximumFractionDigits:1});
function reduceRows(rows,field){
const m=new Map();for(const r of rows){const name=String(r[field]||'Tidak diketahui').trim();m.set(name,(m.get(name)||0)+Number(r.qty_box||0))}
return [...m.entries()].sort((a,b)=>b[1]-a[1]);
}
function table(name,rows,total){
return '<div class="snap"><h4>'+name+'</h4><table><thead><tr><th>Kategori</th><th>BOX / %</th></tr></thead><tbody>'+
(rows.length?rows.map(([k,v])=>'<tr><td>'+esc(k)+'</td><td>'+fmt(v)+' BOX · '+(total?Number(v/total*100).toFixed(1):'0.0')+'%</td></tr>').join(''):
'<tr><td colspan="2">Tidak ada data arsip.</td></tr>')+'</tbody></table></div>';
}
let activeKey='',busy=false;
async function render(){
if(busy)return;
let authed=false,period='',scope='';
try{authed=!!SESSION?.access_token;period=PERIOD;scope=SCOPE||'ALL'}catch(_){}
if(!authed||!/^\d{4}-\d{2}$/.test(period))return;
const key=period+'|'+scope;
if(key===activeKey)return;activeKey=key;busy=true;
try{
const result=await rpc('breakage_offline_archive_rollup_v143',{p_period:period,p_rdc:scope});
const data=(result?.rows||[]).flatMap(a=>(a.summary||[]).map(r=>({...r,rdc:a.rdc})));
let note=document.getElementById('slsArchivedNote143');
let box=document.getElementById('slsArchivedRecap143');
const overview=document.getElementById('page-ringkasan');
const recap=document.getElementById('page-rekap');
if(!note&&overview){note=document.createElement('div');note.id='slsArchivedNote143';overview.insertBefore(note,overview.firstChild)}
if(!box&&recap){box=document.createElement('div');box.id='slsArchivedRecap143';recap.insertBefore(box,recap.firstChild)}
if(!data.length){if(note)note.style.display='none';if(box)box.style.display='none';return}
const total=data.reduce((s,x)=>s+Number(x.qty_box||0),0);
const count=result.archived_incident_count||0;
if(note){note.style.display='block';note.textContent='Arsip Offline '+period+': '+fmt(count)+
 ' insiden detail telah diamankan di ZIP. Rekap KPI dan tren tetap disimpan di Supabase. Lihat ringkasan arsip pada Rekap Breakage.'}
if(box){
box.style.display='block';
box.innerHTML='<h3>Rekap Historis dari Arsip Offline · '+esc(period)+'</h3>'+
'<p>Rekap tersimpan setelah data detail dibersihkan oleh Master. Menampilkan '+fmt(count)+
' kejadian / '+fmt(total)+' BOX, tanpa membuka file arsip ZIP. Laporan tren nasional tetap memakai KPI bulanan yang telah dipublikasikan.</p>'+
'<div class="columns">'+
table('Per RDC',reduceRows(data,'rdc'),total)+
table('Jenis Kejadian',reduceRows(data,'incident_type'),total)+
table('Penyebab',reduceRows(data,'cause'),total)+
table('Ukuran',reduceRows(data,'product_size'),total)+
table('Factory',reduceRows(data,'factory'),total)+
'</div>';
}
}catch(e){console.warn('Archived historical summary unavailable',e);activeKey=''}
finally{busy=false}
}
function run(){
const hero=document.getElementById('heroPeriod');
if(hero){
let debounce;
new MutationObserver(()=>{
 clearTimeout(debounce);debounce=setTimeout(()=>{activeKey='';render()},140);
}).observe(hero,{childList:true,characterData:true,subtree:true});
}
document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>setTimeout(render,120)));
const ref=document.getElementById('refreshBtn');if(ref)ref.addEventListener('click',()=>setTimeout(()=>{activeKey='';render()},900));
[400,1200,2500,5500].forEach(ms=>setTimeout(render,ms));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
