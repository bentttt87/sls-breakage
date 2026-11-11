/* SLS Breakage Monitoring v146: record coverage for all RDC, including Draft.
   Operational input status is intentionally SEPARATE from official approved KPI. */
(function(){
'use strict';
if(window.__SLS_INPUT_COVERAGE_146__)return;
window.__SLS_INPUT_COVERAGE_146__=true;
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const fm=x=>Number(x||0).toLocaleString('id-ID',{maximumFractionDigits:1});
const tm=x=>{if(!x)return '—';const d=new Date(x);return Number.isNaN(d.getTime())?'—':d.toLocaleString('id-ID',{timeZone:'Asia/Jakarta',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})+' WIB'};
let latestState=null,lastKey='',running=0;
function loggedIn(){try{return !!(SESSION&&SESSION.access_token)}catch(_){return false}}
function mount(){
 if(!$('slsInputCoverageCss146')){
 const css=document.createElement('style');css.id='slsInputCoverageCss146';
 css.textContent=[
 '#slsInputCoverage146,#slsInputCoverageRecap146{border:1px solid #d6e3ef;border-radius:16px;background:#fff;padding:20px;margin:16px 0;box-shadow:0 4px 14px rgba(15,51,87,.045)}',
 '.sic146-head{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:13px}',
 '.sic146-head h3{font-size:20px;line-height:1.3;color:#173d69;margin:0;font-weight:900}',
 '.sic146-head p{font-size:13px;color:#5b7691;margin:5px 0 0;line-height:1.5}',
 '.sic146-badge{background:#eef7fe;color:#155d9e;border-radius:99px;border:1px solid #c8dfee;font-size:12px;font-weight:800;padding:7px 10px}',
 '.sic146-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}',
 '.sic146-stat{background:#f6f9fd;border:1px solid #dce7f0;border-radius:11px;padding:13px 14px;min-width:0}',
 '.sic146-stat b{display:block;font-size:26px;color:#1b426b;font-weight:900;margin:3px 0}',
 '.sic146-stat span{color:#637e99;font-size:12px;font-weight:800}',
 '.sic146-stat small{display:block;font-size:12px;color:#6d8194;line-height:1.35}',
 '.sic146-stat:nth-child(3){background:#fff9ed;border-color:#ead6aa}',
 '.sic146-stat:nth-child(3) b{color:#ac7417}',
 '.sic146-stat:nth-child(4){background:#eefaf5;border-color:#c8e3d5}',
 '.sic146-stat:nth-child(4) b{color:#12765f}',
 '.sic146-table{border-collapse:separate;border-spacing:0;width:100%;min-width:0;table-layout:fixed}',
 '.sic146-table th{font-size:12px;color:#496884;background:#edf4fa;padding:11px 8px;text-align:left;font-weight:850}',
 '.sic146-table td{padding:13px 8px;border-bottom:1px solid #e7eef5;font-size:13px;vertical-align:middle;color:#284869;line-height:1.45}',
 '.sic146-table td:first-child{font-weight:900;color:#1a426c}',
 '.sic146-table td:not(:first-child){overflow-wrap:anywhere}',
 '.sic146-table tr:last-child td{border-bottom:none}',
 '.sic146-table .sic146-num{font-weight:850;color:#193d6a}',
 '.sic146-table .sic146-flag{font-size:11px;font-weight:850;padding:5px 8px;border-radius:20px;display:inline-block}',
 '.sic146-flag.pending{background:#fff0d3;color:#9a6511}',
 '.sic146-flag.ready{background:#e8f8f0;color:#167c5b}',
 '.sic146-flag.empty{background:#f0f3f7;color:#748399}',
 '.sic146-note{font-size:12px;color:#637c95;margin:12px 0 0;line-height:1.65}',
 '.sic146-warning{border:1px solid #efd7a8;background:#fffaeb;color:#906121;padding:10px 12px;border-radius:10px;margin-top:11px;font-size:12px;line-height:1.6}',
 '.sic146-action{display:flex;gap:8px;justify-content:flex-end;margin-top:12px;flex-wrap:wrap}',
 '.sic146-action button{background:#0d5da9;color:#fff;font-size:12px;font-weight:850;border:1px solid #0d5da9;border-radius:8px;padding:8px 12px;min-height:38px}',
 '.sic146-load{padding:22px;font-size:13px;color:#5d7894}',
 '@media(max-width:1100px){.sic146-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.sic146-table th,.sic146-table td{font-size:11.5px;padding:9px 5px}}',
 '@media(max-width:760px){#slsInputCoverage146,#slsInputCoverageRecap146{padding:14px 11px;margin:12px 0}.sic146-head h3{font-size:17px}.sic146-stats{gap:7px}.sic146-stat{padding:9px}.sic146-stat b{font-size:21px}.sic146-table,.sic146-table tbody,.sic146-table tr,.sic146-table td{display:block;width:100%;box-sizing:border-box}.sic146-table thead{display:none}.sic146-table tr{border:1px solid #dbe7f1;border-radius:11px;padding:10px;margin:10px 0;background:#fcfdff}.sic146-table td{display:grid;grid-template-columns:105px 1fr;gap:9px;padding:5px;border:none}.sic146-table td:before{content:attr(data-label);font-size:11px;color:#6b839a;font-weight:800}.sic146-table td:first-child{font-size:14px}}'
 ].join('');
 document.head.appendChild(css);
 }
 const cards=$('summaryCards');
 if(cards&&!$('slsInputCoverage146')){
 const node=document.createElement('section');node.id='slsInputCoverage146';node.setAttribute('aria-label','Rekap aktivitas input breakage semua RDC');
 node.innerHTML='<div class="sic146-load">Memuat status input semua RDC…</div>';
 cards.insertAdjacentElement('afterend',node);
 }
 const recap=$('page-rekap');
 if(recap&&!$('slsInputCoverageRecap146')){
 const node=document.createElement('section');node.id='slsInputCoverageRecap146';node.setAttribute('aria-label','Rekap status input per RDC');
 node.innerHTML='<div class="sic146-load">Memuat input semua RDC…</div>';
 recap.insertBefore(node,recap.firstChild);
 }
}
function stateOf(s){
 const yr=[...new Set((s.years||[]).map(Number))].sort((a,b)=>a-b);
 const mo=[...new Set((s.months||[]).map(Number))].sort((a,b)=>a-b);
 const rd=[...new Set((s.rdcs||[]).map(String))].sort();
 return {years:yr,months:mo,rdcs:rd};
}
function header(d,state,compact){
 const y=state.years.join(', ');
 const m=state.months.length===12?'Jan–Des':state.months.map(x=>['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][x-1]).join(', ');
 const scope=state.rdcs.length===5?'Semua RDC':state.rdcs.join(', ');
 return '<header class="sic146-head"><div><h3>Rekap Input Breakage · Semua Status</h3><p>'+
 esc(y+' · '+m+' · '+scope)+' — aktivitas yang benar-benar sudah tersimpan di sistem</p></div><span class="sic146-badge">'+
 fm(d.rdcs_with_input)+' dari '+fm(d.rdcs_selected)+' RDC sudah input</span></header>';
}
function status(x){
 if(!Number(x.total_count))return '<span class="sic146-flag empty">Belum ada input</span>';
 if(Number(x.draft_count)>0)return '<span class="sic146-flag pending">Perlu review SPV</span>';
 if(Number(x.review_count)>0)return '<span class="sic146-flag pending">Sedang diproses</span>';
 return '<span class="sic146-flag ready">Sudah review SPV</span>';
}
function recapTable(d){
 const rows=d.by_rdc||[];
 const totalQty=Number(d.total_box||0);
 return '<table class="sic146-table"><thead><tr><th style="width:16%">RDC</th><th style="width:10%">Insiden</th><th style="width:13%">Total BOX</th><th style="width:12%">Draft</th><th style="width:12%">Review SPV+</th><th style="width:18%">Input Terakhir</th><th style="width:19%">Status</th></tr></thead><tbody>'+
 rows.map(x=>'<tr>'+
 '<td data-label="RDC">'+esc(x.rdc)+'</td>'+
 '<td data-label="Insiden" class="sic146-num">'+fm(x.total_count)+'</td>'+
 '<td data-label="Total BOX" class="sic146-num">'+fm(x.total_box)+'</td>'+
 '<td data-label="Draft">'+fm(x.draft_count)+' ('+fm(x.draft_box)+' BOX)</td>'+
 '<td data-label="Review SPV+">'+fm(x.approved_count)+' ('+fm(x.approved_box)+' BOX)</td>'+
 '<td data-label="Input Terakhir">'+esc(tm(x.last_input))+'</td>'+
 '<td data-label="Status">'+status(x)+'</td></tr>').join('')+
 '<tr style="background:#eef5fb;font-weight:900"><td data-label="RDC">TOTAL</td>'+
 '<td data-label="Insiden">'+fm(d.total_count)+'</td><td data-label="Total BOX">'+fm(totalQty)+'</td>'+
 '<td data-label="Draft">'+fm(d.draft_count)+' ('+fm(d.draft_box)+' BOX)</td>'+
 '<td data-label="Review SPV+">'+fm(d.approved_count)+' ('+fm(d.approved_box)+' BOX)</td>'+
 '<td data-label="Input Terakhir">—</td><td data-label="Status">Semua RDC terpilih</td></tr></tbody></table>';
}
function stats(d){
 return '<div class="sic146-stats"><div class="sic146-stat"><span>RDC Sudah Input</span><b>'+fm(d.rdcs_with_input)+' / '+fm(d.rdcs_selected)+'</b><small>Memiliki insiden tersimpan</small></div>'+
 '<div class="sic146-stat"><span>Total Insiden</span><b>'+fm(d.total_count)+'</b><small>'+fm(d.total_box)+' BOX · Semua status</small></div>'+
 '<div class="sic146-stat"><span>Menunggu Review (Draft)</span><b>'+fm(d.draft_count)+'</b><small>'+fm(d.draft_box)+' BOX · Belum masuk KPI</small></div>'+
 '<div class="sic146-stat"><span>Sudah Review SPV+</span><b>'+fm(d.approved_count)+'</b><small>'+fm(d.approved_box)+' BOX · Belum tentu Final</small></div></div>';
}
function render(d,state){
 mount();
 const absent=(d.by_rdc||[]).filter(x=>!Number(x.total_count)).map(x=>x.rdc);
 const pending=(d.by_rdc||[]).filter(x=>Number(x.draft_count)>0).map(x=>x.rdc);
 const info='<div class="sic146-note">Data Draft ditampilkan agar semua aktivitas RDC terlihat, tetapi <b>tidak dimasukkan ke KPI resmi</b> sampai lolos review SPV. Review SPV+ mencakup APPROVED_SPV, MASTER_REVIEW, FINAL, dan CLOSED.</div>';
 const warn=(pending.length?'<div class="sic146-warning">⚠ Perlu pemeriksaan SPV: '+esc(pending.join(', '))+'.</div>':'')+
 (absent.length?'<div class="sic146-warning">Belum ada insiden yang tersimpan untuk filter ini: '+esc(absent.join(', '))+'. Data Draft yang baru disimpan secara lokal belum tercatat di server.</div>':'');
 const foot='<div class="sic146-note">Terakhir sinkronisasi: '+esc(d.read_at||'—')+'. Tidak mengubah status insiden maupun perhitungan rasio KPI.</div>';
 const action='<div class="sic146-action"><button type="button" id="slsInputCoverageOpenRecap146">Lihat rekap lengkap</button></div>';
 const overview=$('slsInputCoverage146'),full=$('slsInputCoverageRecap146');
 if(overview){
 overview.innerHTML=header(d,state,true)+stats(d)+recapTable(d)+info+warn+foot+action;
 const b=$('slsInputCoverageOpenRecap146');if(b)b.onclick=()=>{if(typeof showPage==='function')showPage('rekap');window.scrollTo({top:0,behavior:'smooth'})};
 }
 if(full)full.innerHTML=header(d,state,false)+stats(d)+recapTable(d)+info+warn+foot;
}
function loading(t){mount();for(const id of ['slsInputCoverage146','slsInputCoverageRecap146']){const e=$(id);if(e)e.innerHTML='<div class="sic146-load">'+esc(t)+'</div>'}}
async function update(state){
 if(!loggedIn())return;
 const s=stateOf(state),key=JSON.stringify(s);lastKey=key;
 if(!s.years.length||!s.months.length||!s.rdcs.length)return;
 const request=++running;loading('Mengambil data input semua RDC…');
 try{
 const data=await rpc('breakage_input_coverage_v146',{p_years:s.years,p_months:s.months,p_rdcs:s.rdcs});
 if(request!==running)return;
 if(!data||!Array.isArray(data.by_rdc))throw Error('Data rekap tidak tersedia');
 render(data,s);
 }catch(err){if(request!==running)return;lastKey='';
 loading('Gagal memuat rekap semua status: '+String(err?.message||err));}
}
function boot(){
 mount();
 window.addEventListener('sls:breakage-filter-applied',e=>update(e.detail||{}));
 if(window.__SLS_BREAKAGE_FILTER_STATE)update(window.__SLS_BREAKAGE_FILTER_STATE);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
