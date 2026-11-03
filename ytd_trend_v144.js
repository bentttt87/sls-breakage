/* Breakage Monitoring v144: YTD charts based on monthly summary, never an average of RDC ratios. */
(function(){
'use strict';
if(window.__SLS_BREAKAGE_YTD_144__)return;
window.__SLS_BREAKAGE_YTD_144__=true;
var MONTHS=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
var BLUE='#2874b6',TEAL='#128b78',INK='#173c63',MUTED='#7186a0',GRAY='#9aa9b9',AMBER='#bd8431';
var mounted=false,token=0,lastKey='';
function esc(v){return String(v===undefined||v===null?'':v).replace(/[&<>"']/g,function(s){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]})}
function n(v){var a=Number(v);return Number.isFinite(a)?a:0}
function fmt(v){return n(v).toLocaleString('id-ID',{maximumFractionDigits:1})}
function dec(v){return n(v).toLocaleString('id-ID',{minimumFractionDigits:2,maximumFractionDigits:2})}
function delta(v){return (v>0?'+':'')+n(v).toLocaleString('id-ID',{minimumFractionDigits:1,maximumFractionDigits:1})+'%'}
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function currentWib(){var d=new Date();var parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit'}).formatToParts(d);return {year:Number(parts.find(x=>x.type==='year')?.value||d.getFullYear()),month:Number(parts.find(x=>x.type==='month')?.value||d.getMonth()+1)}}
function active(){try{return !!(SESSION&&SESSION.access_token)}catch(_){return false}}
function css(){
if(document.getElementById('slsYtdCss144'))return;
var el=document.createElement('style');el.id='slsYtdCss144';
el.textContent=[
'.ytd144{border:1px solid #d4e2f0;background:#fff;border-radius:16px;padding:21px;margin:18px 0 20px;min-width:0}',
'.ytd144-head{display:flex;justify-content:space-between;align-items:center;gap:15px;flex-wrap:wrap;margin-bottom:12px}',
'.ytd144-head h2{margin:0;font-size:23px;line-height:1.2;font-weight:900;color:#103e72}',
'.ytd144-desc{font-size:13px;color:#61768d;line-height:1.6;margin:6px 0 0}',
'.ytd144-tag{font-size:12px;color:#145a91;background:#e8f3fd;border:1px solid #c8e2f6;border-radius:999px;padding:7px 11px;font-weight:800}',
'.ytd144-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;margin:15px 0}',
'.ytd144-kpi{border:1px solid #dce7f2;background:#f7fafd;border-radius:12px;padding:14px;min-width:0}',
'.ytd144-kpi label{display:block;font-size:12px;font-weight:800;color:#51708d;line-height:1.4}',
'.ytd144-kpi b{display:block;font-size:26px;font-weight:900;color:#163e6a;line-height:1.3;margin:5px 0}',
'.ytd144-kpi small{font-size:12px;display:block;color:#6a7f98;line-height:1.4}',
'.ytd144-kpi.highlight{border-color:#bcd9ee;background:#edf6fe}',
'.ytd144-kpi.teal{border-color:#c2e8dc;background:#effaf5}',
'.ytd144-kpi.teal b{color:#117960}',
'.ytd144-kpi.warn{border-color:#f0d4a3;background:#fffaf0}',
'.ytd144-kpi.warn b{color:#9f6919}',
'.ytd144-graphs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px;margin-top:17px}',
'.ytd144-graph{border:1px solid #e0eaf4;border-radius:13px;padding:15px 15px 11px;min-width:0;background:#fff}',
'.ytd144-graph.wide{grid-column:1/-1}',
'.ytd144-graph h3{font-size:16px;margin:0 0 8px;font-weight:850;color:#163e68}',
'.ytd144-legend{display:flex;gap:15px;flex-wrap:wrap;font-size:12px;font-weight:700;color:#54708a;margin:0 0 8px}',
'.ytd144-legend i{display:inline-block;width:11px;height:11px;border-radius:3px;vertical-align:middle;margin-right:5px}',
'.ytd144-chart{width:100%;min-width:0}',
'.ytd144-chart svg{display:block;width:100%;height:auto;max-height:300px}',
'.ytd144-graph-note{font-size:12px;color:#677e95;line-height:1.5;min-height:31px;margin:6px 0 0}',
'.ytd144-insights{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:15px 0}',
'.ytd144-insight{border-left:4px solid #2f7fbe;border-radius:9px;background:#f4f8fc;padding:12px 14px;font-size:13px;line-height:1.6;color:#345371}',
'.ytd144-insight:nth-child(2){border-color:#128b78}',
'.ytd144-insight:nth-child(3){border-color:#db9f42}',
'.ytd144-insight b{color:#173d69}',
'.ytd144-alert{border:1px solid #f0d6aa;background:#fff9ed;color:#926121;border-radius:10px;padding:12px 14px;font-size:12px;line-height:1.6;margin-top:12px}',
'.ytd144-a11y{margin-top:14px}',
'.ytd144-a11y summary{font-weight:800;color:#155589;font-size:13px;cursor:pointer;padding:5px}',
'.ytd144-table{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}',
'.ytd144-table th,.ytd144-table td{padding:10px;border-bottom:1px solid #e2ecf6;text-align:right}',
'.ytd144-table th:first-child,.ytd144-table td:first-child{text-align:left}',
'.ytd144-table th{background:#eff5fb;font-weight:800;color:#23496c}',
'.ytd144-quick-action{background:#0f61a9;color:#fff;border:0;border-radius:9px;padding:10px 15px;font-weight:850;font-size:13px;cursor:pointer}',
'.ytd144-load{padding:28px;color:#67819a;font-size:14px;text-align:center}',
'@media(max-width:1150px){.ytd144-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.ytd144-graphs{grid-template-columns:1fr}.ytd144-insights{grid-template-columns:1fr}.ytd144-graph.wide{grid-column:auto}}',
'@media(max-width:760px){.ytd144{padding:14px;margin:12px 0}.ytd144-head h2{font-size:19px}.ytd144-kpis{gap:8px}.ytd144-kpi{padding:10px}.ytd144-kpi b{font-size:21px}.ytd144-kpi label{font-size:11px}.ytd144-graph{padding:11px}.ytd144-graph h3{font-size:15px}.ytd144-table{font-size:11px}.ytd144-table td,.ytd144-table th{padding:6px 4px}}'
].join('');
document.head.appendChild(el)}
function mount(){
if(mounted)return;
var summary=document.getElementById('summaryCards'),recap=document.getElementById('rekapSummary');
if(!summary||!recap)return;
css();
var quick=document.createElement('section');quick.id='slsYtdQuick144';quick.className='ytd144';
quick.innerHTML='<div class="ytd144-load">Tren YTD akan muncul setelah data dimuat…</div>';
summary.insertAdjacentElement('afterend',quick);
var full=document.createElement('section');full.id='slsYtdFull144';full.className='ytd144';
full.innerHTML='<div class="ytd144-load">Memuat grafik YTD…</div>';
var page=document.getElementById('page-rekap');
if(page)page.insertBefore(full,page.firstChild);
else recap.parentNode.insertBefore(full,recap);
mounted=true;
}
function empty(reason){
mount();['slsYtdQuick144','slsYtdFull144'].forEach(function(id){var e=document.getElementById(id);if(e)e.innerHTML='<div class="ytd144-load">'+esc(reason)+'</div>'})}
function roundedScale(max){if(max<=0)return 1;var step=Math.pow(10,Math.floor(Math.log10(max/4||1)));var multiple=Math.ceil(max/4/step);return step*Math.max(1,multiple)*4}
function canvas(title,w,h){return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+esc(title)+'">'}
function grid(max,w,h,l,t,r,b){
var pH=h-t-b,pW=w-l-r,out='';
for(var i=0;i<=4;i++){
 var y=t+i*pH/4,v=max*(4-i)/4;
 out+='<line x1="'+l+'" y1="'+y+'" x2="'+(w-r)+'" y2="'+y+'" stroke="#e7eef6" stroke-width="1"/>';
 out+='<text x="'+(l-7)+'" y="'+(y+4)+'" text-anchor="end" font-size="13" font-weight="700" fill="'+MUTED+'">'+esc(Number.isInteger(v)?fmt(v):dec(v))+'</text>';
}
return out}
function xLabels(data,w,h,l,r,b){
var pW=w-l-r,step=pW/data.length;
return data.map((x,i)=>'<text x="'+(l+step*(i+.5))+'" y="'+(h-b+20)+'" text-anchor="middle" font-size="13" font-weight="750" fill="'+INK+'">'+MONTHS[i]+'</text>').join('')}
function barSvg(data){
var w=900,h=294,l=58,r=17,t=22,b=37;
var max=roundedScale(Math.max(1,...data.map(d=>d.has?d.total:0)));
var ph=h-t-b,pw=w-l-r,step=pw/data.length,bw=Math.min(step*.62,45);
var out=canvas('Volume breakage tiap bulan dalam BOX; warna pucat menunjukkan cakupan parsial',w,h)+grid(max,w,h,l,t,r,b)+xLabels(data,w,h,l,r,b);
data.forEach(function(d,i){
 if(!d.has)return;
 var x=l+step*(i+.5)-bw/2;
 var a=d.delivery/max*ph,z=d.warehouse/max*ph;
 var y=h-b-a;
 var opa=d.full?1:.42;
 out+='<rect x="'+x+'" y="'+y+'" width="'+bw+'" height="'+a+'" fill="'+BLUE+'" opacity="'+opa+'" rx="2"><title>'+MONTHS[i]+' Pecah Kirim '+fmt(d.delivery)+' BOX</title></rect>';
 out+='<rect x="'+x+'" y="'+(y-z)+'" width="'+bw+'" height="'+z+'" fill="'+TEAL+'" opacity="'+opa+'" rx="2"><title>'+MONTHS[i]+' Pecah Pallet '+fmt(d.warehouse)+' BOX</title></rect>';
 if(!d.full)out+='<rect x="'+x+'" y="'+(y-z)+'" width="'+bw+'" height="'+(a+z)+'" fill="none" stroke="'+AMBER+'" stroke-width="1.5" stroke-dasharray="5 4"/>';
 out+='<text x="'+(x+bw/2)+'" y="'+Math.max(13,y-z-6)+'" text-anchor="middle" font-size="12" fill="'+(d.full?INK:AMBER)+'" font-weight="850">'+fmt(d.total)+'</text>';
});
return out+'</svg>'}
function points(data,key,w,h,l,t,r,b,ymax){
var ph=h-t-b,pw=w-l-r,step=pw/data.length;
return data.map(function(d,i){var v=d[key];if(v===null||v===undefined||!Number.isFinite(v))return null;return {x:l+step*(i+.5),y:h-b-v/ymax*ph,value:v,month:i}})}
function pathWithGaps(ps,color){
var seg='',started=false;
for(const p of ps){if(!p){started=false;continue}seg+=(started?' L ':' M ')+p.x.toFixed(2)+' '+p.y.toFixed(2);started=true}
var out='<path d="'+seg+'" fill="none" stroke="'+color+'" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"/>';
for(const p of ps){if(!p)continue;out+='<circle cx="'+p.x+'" cy="'+p.y+'" r="4.5" fill="'+color+'" stroke="#fff" stroke-width="2"><title>'+MONTHS[p.month]+' '+dec(p.value)+' /10.000 BOX</title></circle>'}
return out}
function rateSvg(data){
var w=900,h=294,l=61,r=17,t=24,b=38;
var vals=data.flatMap(d=>[d.deliveryRate,d.warehouseRate]).filter(v=>v!==null&&Number.isFinite(v));
if(!vals.length)return '<div class="ytd144-load">Rasio belum bisa dihitung: denominator lengkap belum tersedia.</div>';
var max=roundedScale(Math.max(1,...vals));
return canvas('Rasio bulanan untuk data dengan cakupan RDC dan denominator lengkap',w,h)+grid(max,w,h,l,t,r,b)+xLabels(data,w,h,l,r,b)+pathWithGaps(points(data,'deliveryRate',w,h,l,t,r,b,max),BLUE)+pathWithGaps(points(data,'warehouseRate',w,h,l,t,r,b,max),TEAL)+'</svg>'}
function cumulativeSvg(cur,prev){
var w=900,h=257,l=61,r=17,t=22,b=35;
var a=0,bTotal=0,current=[],previous=[];
var usable=0;
for(var i=0;i<cur.length;i++){
 var eligible=cur[i].full&&prev[i]&&prev[i].full;
 if(eligible){a+=cur[i].total;bTotal+=prev[i].total;usable++}
 current.push({current:eligible?a:null,previous:eligible?bTotal:null});
}
if(!usable)return '<div class="ytd144-load">Belum ada bulan dengan data lengkap pada kedua tahun.</div>';
var max=roundedScale(Math.max(a,bTotal,1));
var drawData=current.map((x,i)=>({current:x.current,previous:x.previous}));
return canvas('Akumulasi YTD lengkap dan sebanding dengan tahun sebelumnya',w,h)+grid(max,w,h,l,t,r,b)+xLabels(cur,w,h,l,r,b)+pathWithGaps(points(drawData,'current',w,h,l,t,r,b,max),BLUE)+pathWithGaps(points(drawData,'previous',w,h,l,t,r,b,max),GRAY)+'</svg>'}
function legend(a,b){return '<div class="ytd144-legend"><span><i style="background:'+BLUE+'"></i>'+esc(a)+'</span><span><i style="background:'+TEAL+'"></i>'+esc(b)+'</span></div>'}
function graph(title,legendHtml,svg,foot,wide){
return '<article class="ytd144-graph'+(wide?' wide':'')+'"><h3>'+esc(title)+'</h3>'+legendHtml+
'<div class="ytd144-chart">'+svg+'</div><p class="ytd144-graph-note">'+foot+'</p></article>'}
function getRows(source,year,endMonth){
var map=new Map((source?.periods||[]).map(p=>[p.period,p]));
return Array.from({length:endMonth},(_,i)=>{
 var mon=i+1,key=year+'-'+String(mon).padStart(2,'0'),d=map.get(key);
 var has=!!d?.has_data,coverage=n(d?.rdc_with_data),totalRdc=n(d?.total_rdc);
 var now=currentWib(),ongoing=year===now.year&&mon===now.month;
 var full=has&&coverage===totalRdc&&totalRdc>0&&!ongoing;
 var fbD=n(d?.delivery_fallback_rdc),fbW=n(d?.warehouse_fallback_rdc);
 var denD=n(d?.delivered_box),denW=n(d?.stock_exposure_box);
 var dl=n(d?.pecah_kiriman_box),wh=n(d?.pecah_gudang_box);
 return {period:key,month:mon,delivery:dl,warehouse:wh,total:dl+wh,has,coverage,totalRdc,full,ongoing,
  deliveryRate:full&&fbD===0&&denD>0?dl/denD*10000:null,
  warehouseRate:full&&fbW===0&&denW>0?wh/denW*10000:null,
  deliveryDen:denD,warehouseDen:denW,fbD,fbW};
})}
function yearMonths(state){
var now=currentWib(),years=(state?.years||[]).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
var year=years.length?years[years.length-1]:now.year;
var months=(state?.months||[]).map(Number).filter(m=>m>=1&&m<=12);
var end=months.length?Math.max(...months):now.month;
if(year===now.year)end=Math.min(end,now.month);
return {year,end:clamp(end,1,12),rdcs:[...new Set(state?.rdcs||[])]}}
function insightCards(rows,prior,year,endMonth){
var complete=rows.filter(x=>x.full),recorded=rows.reduce((s,x)=>s+(x.has?x.total:0),0);
var completeQty=complete.reduce((s,x)=>s+x.total,0);
var kirim=rows.reduce((s,x)=>s+(x.has?x.delivery:0),0);
var pallet=rows.reduce((s,x)=>s+(x.has?x.warehouse:0),0);
var pairs=rows.filter((r,i)=>r.full&&prior[i]?.full);
var pairCurrent=pairs.reduce((s,x)=>s+x.total,0);
var pairPrev=rows.reduce((s,x,i)=>s+(x.full&&prior[i]?.full?prior[i].total:0),0);
var yoy=pairPrev>0?(pairCurrent/pairPrev-1)*100:null;
var eligibleR=rows.filter(x=>x.deliveryRate!==null);
var eligibleW=rows.filter(x=>x.warehouseRate!==null);
var rateD=eligibleR.reduce((s,x)=>s+x.delivery,0)/Math.max(1,eligibleR.reduce((s,x)=>s+x.deliveryDen,0))*10000;
var rateW=eligibleW.reduce((s,x)=>s+x.warehouse,0)/Math.max(1,eligibleW.reduce((s,x)=>s+x.warehouseDen,0))*10000;
return {complete,recorded,completeQty,kirim,pallet,pairs,pairCurrent,pairPrev,yoy,rateD:eligibleR.length?rateD:null,
rateW:eligibleW.length?rateW:null,partial:rows.filter(x=>x.has&&!x.full),missing:rows.filter(x=>!x.has),endMonth,year};
}
function insightText(rows,prior,metrics){
var full=metrics.complete,peak=full.reduce((p,c)=>!p||c.total>p.total?c:p,null);
var last=full.at(-1),previous=last?rows[last.month-2]:null;
var mom=last&&previous&&previous.full&&previous.total>0?(last.total/previous.total-1)*100:null;
var one='<b>Bulan tertinggi:</b> '+(peak?MONTHS[peak.month-1]+' '+fmt(peak.total)+' BOX (cakupan lengkap)':'Belum ada data lengkap.');
var two='<b>Perubahan bulanan:</b> '+(mom!==null?MONTHS[last.month-1]+' vs '+MONTHS[previous.month-1]+' '+delta(mom):'Belum tersedia dua bulan berurutan dengan data lengkap.');
var three='<b>Perbandingan YTD:</b> '+(metrics.yoy!==null?fmt(metrics.pairCurrent)+' vs '+fmt(metrics.pairPrev)+' BOX ('+delta(metrics.yoy)+', '+metrics.pairs.length+' bulan sebanding)':'Belum ada bulan sebanding dengan tahun sebelumnya.');
return '<div class="ytd144-insights"><div class="ytd144-insight">'+one+'</div><div class="ytd144-insight">'+two+'</div><div class="ytd144-insight">'+three+'</div></div>'}
function kpi(label,value,foot,kind){return '<div class="ytd144-kpi '+(kind||'')+'"><label>'+esc(label)+'</label><b>'+esc(value)+'</b><small>'+esc(foot)+'</small></div>'}
function table(rows){
return '<details class="ytd144-a11y"><summary>Lihat tabel angka per bulan</summary><div style="overflow-x:auto"><table class="ytd144-table"><thead><tr><th>Bulan</th><th>Kirim BOX</th><th>Pallet BOX</th><th>Total BOX</th><th>Rasio Kirim</th><th>Rasio Pallet</th><th>Cakupan</th></tr></thead><tbody>'+
rows.map(r=>'<tr><td>'+MONTHS[r.month-1]+'</td><td>'+fmt(r.delivery)+'</td><td>'+fmt(r.warehouse)+'</td><td><b>'+fmt(r.total)+'</b></td><td>'+(r.deliveryRate!==null?dec(r.deliveryRate):'—')+'</td><td>'+(r.warehouseRate!==null?dec(r.warehouseRate):'—')+'</td><td>'+(r.full?'Lengkap':r.has?'Parsial '+r.coverage+'/'+r.totalRdc:'Belum ada')+'</td></tr>').join('')+
'</tbody></table></div></details>'}
function render(source,prev,state){
var info=yearMonths(state),rows=getRows(source,info.year,info.end),prior=getRows(prev,info.year-1,info.end),m=insightCards(rows,prior,info.year,info.end);
var name=MONTHS[info.end-1]+' '+info.year,scope=info.rdcs.length===5?'Semua RDC':info.rdcs.join(', ');
var label='Jan–'+MONTHS[info.end-1]+' '+info.year+' · '+scope;
var warn=m.partial.length?'Data sebagian: '+m.partial.map(r=>MONTHS[r.month-1]+' ('+r.coverage+'/'+r.totalRdc+' RDC)').join(', ')+'. ':'';
if(m.missing.length)warn+='Belum ada data: '+m.missing.map(r=>MONTHS[r.month-1]).join(', ')+'. ';
warn+='Rasio hanya ditampilkan untuk bulan dengan cakupan RDC lengkap dan denominator pada periode yang sama. Tidak memakai rerata rasio antar-RDC.';
var metrics='<div class="ytd144-kpis">'+
 kpi('Total YTD tercatat',fmt(m.recorded)+' BOX',m.complete.length+'/'+rows.length+' bulan lengkap','highlight')+
 kpi('Pecah Kirim',fmt(m.kirim)+' BOX',m.recorded?((m.kirim/m.recorded*100).toFixed(1)+'% dari total tercatat'):'Belum ada data','')+
 kpi('Pecah Pallet',fmt(m.pallet)+' BOX',m.recorded?((m.pallet/m.recorded*100).toFixed(1)+'% dari total tercatat'):'Belum ada data','teal')+
 kpi('YTD sebanding vs '+(info.year-1),m.yoy===null?'—':delta(m.yoy),m.yoy===null?'Belum ada periode pembanding':m.pairs.length+' bulan sama-sama lengkap','warn')+
'</div>';
var head='<div class="ytd144-head"><div><h2>Tren Breakage YTD</h2><p class="ytd144-desc">'+esc(label)+' · Jumlah BOX, rasio, dan perbandingan tahunan</p></div><span class="ytd144-tag">'+(m.partial.length||m.missing.length?'Sebagian data belum lengkap':'Cakupan lengkap')+'</span></div>';
var monthly=graph('Jumlah Pecah per Bulan (BOX)',legend('Pecah Kirim','Pecah Pallet'),barSvg(rows),'Batang transparan bergaris menunjukkan data sebagian. Tinggi batang bukan otomatis pencapaian KPI.',false);
var ratio=graph('Tren Rasio per 10.000 BOX',legend('Kirim / Delivered','Pallet / Stock Exposure'),rateSvg(rows),'Tidak ada titik pada bulan yang datanya parsial atau memakai denominator dari periode lain.',false);
var cumulLegend='<div class="ytd144-legend"><span><i style="background:'+BLUE+'"></i>'+info.year+'</span><span><i style="background:'+GRAY+'"></i>'+(info.year-1)+'</span></div>';
var cum=graph('Akumulasi YTD: '+info.year+' vs '+(info.year-1),cumulLegend,cumulativeSvg(rows,prior),'Perbandingan hanya menggunakan bulan dengan cakupan RDC lengkap di kedua tahun. Tidak menjumlahkan bulan yang berbeda cakupannya.',true);
var intro='<div class="ytd144-graphs">'+monthly+ratio+cum+'</div>';
var summary=insightText(rows,prior,m);
var foot='<div class="ytd144-alert">'+esc(warn)+'</div>';
var q=document.getElementById('slsYtdQuick144');
var f=document.getElementById('slsYtdFull144');
if(q){
q.innerHTML=head+metrics+'<div class="ytd144-graphs">'+monthly+'</div>'+summary+
'<button class="ytd144-quick-action" type="button" id="slsYtdGoRecap144">Lihat analisis lengkap di Rekap Breakage</button>'+foot;
var btn=document.getElementById('slsYtdGoRecap144');
if(btn)btn.onclick=function(){if(typeof showPage==='function')showPage('rekap');window.scrollTo({top:0,behavior:'smooth'})};
}
if(f)f.innerHTML=head+metrics+intro+summary+table(rows)+foot;
}
async function update(state){
if(!active())return;
mount();
var input=yearMonths(state);
if(!input.rdcs.length){empty('Pilih minimal satu RDC untuk menampilkan YTD.');return}
var key=input.year+'|'+input.end+'|'+input.rdcs.join('~');
if(key===lastKey)return;lastKey=key;
var serial=++token;
empty('Memuat data YTD '+input.year+' dari database…');
var months=Array.from({length:input.end},(_,i)=>i+1);
try{
var jobs=[rpc('breakage_filter_summary_v111',{p_years:[input.year],p_months:months,p_rdcs:input.rdcs})];
if(input.year>2025)jobs.push(rpc('breakage_filter_summary_v111',{p_years:[input.year-1],p_months:months,p_rdcs:input.rdcs}));
var a=await Promise.all(jobs);
if(serial!==token)return;
if(!a[0]||!Array.isArray(a[0].periods))throw Error('Format ringkasan bulanan tidak tersedia.');
render(a[0],a[1]||{periods:[]},state);
}catch(e){if(serial!==token)return;lastKey='';empty('Tren YTD gagal dimuat: '+String(e?.message||e))}
}
function boot(){
mount();
window.addEventListener('sls:breakage-filter-applied',function(ev){update(ev.detail||{})});
if(window.__SLS_BREAKAGE_FILTER_STATE)update(window.__SLS_BREAKAGE_FILTER_STATE);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();