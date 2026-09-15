// SLS Breakage Monitoring v96 — dashboard dimensions: Size, Pabrikasi, Kiriman, Jenis (GRANDE/GRANIT/KERAMIK).
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const esc94=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const qty=r=>Number(r?.qty_box||0);
  function group(field,labelFn){
    const m=new Map();(Array.isArray(INCIDENTS)?INCIDENTS:[]).forEach(r=>{let k=typeof field==='function'?field(r):r[field];k=String(k||'BELUM DIKLASIFIKASIKAN').trim()||'BELUM DIKLASIFIKASIKAN';k=labelFn?labelFn(k):k;m.set(k,(m.get(k)||0)+qty(r))});return [...m.entries()].map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value)
  }
  function bars(rows,maxRows=8){
    const data=rows.slice(0,maxRows),max=Math.max(1,...data.map(x=>x.value));if(!data.length)return '<div class="empty">Belum ada data.</div>';
    return `<div class="pd-bars">${data.map(x=>`<div class="pd-row"><div class="pd-label" title="${esc94(x.label)}">${esc94(x.label)}</div><div class="pd-track"><i style="width:${Math.max(2,x.value/max*100)}%"></i></div><div class="pd-val">${Number(x.value||0).toLocaleString('id-ID')} BOX</div></div>`).join('')}</div>`
  }
  function ensureSection(){
    if($('productDimV94')){const sub=$('productDimV94')?.querySelector('#pdKind')?.parentElement?.querySelector('.pd-sub');if(sub)sub.textContent='Grande / Granit / Keramik';return}const page=$('page-ringkasan');if(!page)return;
    const style=document.createElement('style');style.textContent='.pd-grid{display:grid;grid-template-columns:repeat(4,minmax(220px,1fr));gap:12px;margin-top:12px}.pd-card{padding:14px;min-width:0}.pd-kicker{font-size:9px;color:#6d7d94;text-transform:uppercase;letter-spacing:.7px;font-weight:800}.pd-title{font-size:15px;font-weight:900;margin:3px 0 3px;color:#102746}.pd-sub{font-size:10px;color:#6d7d94;margin-bottom:11px}.pd-bars{display:flex;flex-direction:column;gap:8px}.pd-row{display:grid;grid-template-columns:82px 1fr 74px;gap:7px;align-items:center;font-size:9.5px}.pd-label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:700}.pd-track{height:9px;background:#edf2f7;border-radius:99px;overflow:hidden}.pd-track i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#1675d1,#55a4ec)}.pd-val{text-align:right;font-weight:800;font-variant-numeric:tabular-nums}.pd-quality{margin-top:9px;padding-top:8px;border-top:1px dashed #dbe4ef;font-size:9.5px;color:#6d7d94}@media(max-width:1180px){.pd-grid{grid-template-columns:1fr 1fr}}@media(max-width:760px){.pd-grid{grid-template-columns:1fr}.pd-row{grid-template-columns:95px 1fr 78px}}';document.head.appendChild(style);
    const box=document.createElement('div');box.id='productDimV94';box.innerHTML='<div class="section-title" style="margin-top:14px">Profil Breakage Produk <span class="right small muted">Qty BOX · mengikuti Periode & RDC</span></div><div class="pd-grid"><div class="card pd-card"><div class="pd-kicker">DIMENSI 1</div><div class="pd-title">Size</div><div class="pd-sub">Distribusi breakage berdasarkan size produk</div><div id="pdSize"></div></div><div class="card pd-card"><div class="pd-kicker">DIMENSI 2</div><div class="pd-title">Pabrikasi</div><div class="pd-sub">Pabrik asal SRKI / RCI</div><div id="pdFactory"></div></div><div class="card pd-card"><div class="pd-kicker">DIMENSI 3</div><div class="pd-title">Kiriman</div><div class="pd-sub">Perbandingan breakage Kiriman vs Gudang</div><div id="pdShipment"></div></div><div class="card pd-card"><div class="pd-kicker">DIMENSI 4</div><div class="pd-title">Jenis</div><div class="pd-sub">Grande / Granit / Keramik</div><div id="pdKind"></div></div></div>';
    const twos=page.querySelectorAll('.two');(twos[0]||page.lastElementChild)?.insertAdjacentElement('afterend',box);
  }
  function renderDims(){
    ensureSection();if(!$('pdSize'))return;const rows=Array.isArray(INCIDENTS)?INCIDENTS:[];const total=rows.reduce((a,b)=>a+qty(b),0);const classified=rows.filter(r=>r.product_size&&r.product_kind).reduce((a,b)=>a+qty(b),0);
    $('pdSize').innerHTML=bars(group('product_size'),8)+`<div class="pd-quality">Terklasifikasi: ${total?Math.round(classified/total*100):0}% dari ${total.toLocaleString('id-ID')} BOX</div>`;
    $('pdFactory').innerHTML=bars(group('factory'),5);
    $('pdShipment').innerHTML=bars(group(r=>String(r.incident_type||'').toLowerCase()==='delivery'?'KIRIMAN':String(r.incident_type||'').toLowerCase()==='warehouse'?'GUDANG':'LAINNYA'),4);
    $('pdKind').innerHTML=bars(group('product_kind'),5);
  }
  try{const base=window.renderAll||renderAll;window.renderAll=function(){const r=base.apply(this,arguments);setTimeout(renderDims,0);return r};renderAll=window.renderAll}catch(_){ }
  try{const base=window.openIncident;if(typeof base==='function')window.openIncident=async function(id){const r=await base.apply(this,arguments);const row=(Array.isArray(INCIDENTS)?INCIDENTS:[]).find(x=>Number(x.incident_id)===Number(id));if(row&&$('detailFields')){const add=[['Jenis Produk',row.product_kind],['Size',row.product_size],['Series',row.ceramic_series]].filter(([,v])=>v);const existing=$('detailFields').textContent||'';add.forEach(([k,v])=>{if(!existing.includes(k))$('detailFields').insertAdjacentHTML('beforeend',`<div class="field"><label>${esc94(k)}</label><div>${esc94(v)}</div></div>`)})}return r}}catch(_){ }
  [100,500,1400].forEach(ms=>setTimeout(renderDims,ms));
})();