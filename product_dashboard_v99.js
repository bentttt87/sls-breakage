// SLS Breakage Monitoring v99 — operational analysis: Size, Case, Origin, Vendor Kirim.
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const qty=r=>Number(r?.qty_box||0);
  const rows=()=>Array.isArray(INCIDENTS)?INCIDENTS:[];
  const scopeLabel=()=>{try{return SCOPE==='ALL'?'Nasional':(SCOPE||'Nasional')}catch(_){return 'Nasional'}};

  function grouped(source,keyFn,emptyLabel='BELUM DIKLASIFIKASIKAN'){
    const m=new Map();
    source.forEach(r=>{
      let k=typeof keyFn==='function'?keyFn(r):r?.[keyFn];
      k=String(k||emptyLabel).trim()||emptyLabel;
      m.set(k,(m.get(k)||0)+qty(r));
    });
    return [...m.entries()].map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value||a.label.localeCompare(b.label));
  }

  function bars(data,maxRows=10){
    const list=data.slice(0,maxRows),max=Math.max(1,...list.map(x=>x.value));
    if(!list.length)return '<div class="empty">Belum ada data.</div>';
    return `<div class="pd99-bars">${list.map((x,i)=>`<div class="pd99-row"><div class="pd99-rank">${i+1}</div><div class="pd99-label" title="${esc(x.label)}">${esc(x.label)}</div><div class="pd99-track"><i style="width:${Math.max(2,x.value/max*100)}%"></i></div><div class="pd99-val">${Number(x.value||0).toLocaleString('id-ID')} BOX</div></div>`).join('')}</div>`;
  }

  function qualityText(field,source){
    const total=source.reduce((a,b)=>a+qty(b),0),classified=source.filter(r=>String(r?.[field]||'').trim()).reduce((a,b)=>a+qty(b),0);
    return `Data terisi: ${total?Math.round(classified/total*100):0}% · ${classified.toLocaleString('id-ID')} dari ${total.toLocaleString('id-ID')} BOX`;
  }

  function topText(data,prefix='Terbesar'){
    if(!data.length)return 'Belum ada data.';
    return `${prefix}: ${esc(data[0].label)} · ${Number(data[0].value||0).toLocaleString('id-ID')} BOX`;
  }

  function ensureSection(){
    if($('analysisV99'))return;
    const page=$('page-ringkasan');if(!page)return;
    const style=document.createElement('style');
    style.textContent=`
      .pd99-head{display:flex;gap:10px;align-items:flex-end;margin:18px 0 8px}.pd99-head h3{margin:0;font-size:16px}.pd99-scope{margin-left:auto;font-size:10px;color:#6d7d94;font-weight:700}
      .pd99-grid{display:grid;grid-template-columns:repeat(2,minmax(280px,1fr));gap:12px}.pd99-card{padding:15px;min-width:0}.pd99-kicker{font-size:9px;font-weight:900;letter-spacing:.8px;color:#6d7d94;text-transform:uppercase}.pd99-title{font-size:15px;font-weight:900;color:#102746;margin:4px 0}.pd99-sub{font-size:10px;color:#6d7d94;margin-bottom:11px;line-height:1.4}.pd99-bars{display:flex;flex-direction:column;gap:8px}.pd99-row{display:grid;grid-template-columns:18px 110px 1fr 78px;gap:7px;align-items:center;font-size:10px}.pd99-rank{width:18px;height:18px;border-radius:50%;background:#edf4fb;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;color:#406487}.pd99-label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:800}.pd99-track{height:10px;background:#edf2f7;border-radius:99px;overflow:hidden}.pd99-track i{display:block;height:100%;background:linear-gradient(90deg,#1675d1,#55a4ec);border-radius:99px}.pd99-val{text-align:right;font-weight:900;font-variant-numeric:tabular-nums}.pd99-foot{margin-top:10px;padding-top:9px;border-top:1px dashed #dbe4ef;font-size:9.5px;color:#60728a;line-height:1.5}.pd99-note{margin-top:8px;background:#f7fbff;border:1px solid #d4e7f8;border-radius:8px;padding:8px 10px;font-size:9.5px;color:#456582}.pd99-case .pd99-track i{background:linear-gradient(90deg,#0b66be,#66a9e6)}.pd99-origin .pd99-track i{background:linear-gradient(90deg,#7d5fd4,#b599f1)}.pd99-vendor .pd99-track i{background:linear-gradient(90deg,#d68410,#f4b84d)}
      @media(max-width:1180px){.pd99-grid{grid-template-columns:1fr 1fr}.pd99-row{grid-template-columns:18px 96px 1fr 72px}}
      @media(max-width:760px){.pd99-grid{grid-template-columns:1fr}.pd99-head{align-items:flex-start}.pd99-scope{margin-left:0}.pd99-row{grid-template-columns:18px 94px 1fr 70px}}
    `;
    document.head.appendChild(style);
    const box=document.createElement('div');
    box.id='analysisV99';
    box.innerHTML=`
      <div class="pd99-head"><div><div class="pd99-kicker">ANALISA OPERASIONAL</div><h3>Profil Breakage</h3></div><div class="pd99-scope" id="pd99Scope">—</div></div>
      <div class="pd99-grid">
        <div class="card pd99-card"><div class="pd99-kicker">BREAKAGE BY SIZE</div><div class="pd99-title">Pecahan by Size</div><div class="pd99-sub">Menunjukkan size dengan jumlah breakage terbesar pada scope aktif.</div><div id="pd99Size"></div><div class="pd99-foot" id="pd99SizeFoot"></div></div>
        <div class="card pd99-card pd99-case"><div class="pd99-kicker">BREAKAGE BY CASE</div><div class="pd99-title">Pecahan Kirim vs Gudang</div><div class="pd99-sub">Perbandingan sumber kejadian: pengiriman dan aktivitas gudang.</div><div id="pd99Case"></div><div class="pd99-foot" id="pd99CaseFoot"></div></div>
        <div class="card pd99-card pd99-origin"><div class="pd99-kicker">BREAKAGE BY ORIGIN</div><div class="pd99-title">Pecahan by Origin</div><div class="pd99-sub">Kontribusi breakage berdasarkan pabrik asal: SRKI / RCI.</div><div id="pd99Origin"></div><div class="pd99-foot" id="pd99OriginFoot"></div></div>
        <div class="card pd99-card pd99-vendor"><div class="pd99-kicker">DELIVERY BREAKAGE BY VENDOR</div><div class="pd99-title">Pecahan by Vendor Kirim</div><div class="pd99-sub">Khusus Pecah Pengiriman; membantu menentukan vendor yang perlu tindakan koreksi.</div><div id="pd99Vendor"></div><div class="pd99-foot" id="pd99VendorFoot"></div></div>
      </div>
      <div class="pd99-note">Semua grafik mengikuti filter <b>Periode</b> dan <b>RDC</b> di bagian atas. Pilih RDC = <b>Nasional</b> untuk seluruh network, atau pilih Jakarta / Semarang / Surabaya / Denpasar / Palembang untuk analisa per RDC.</div>`;
    const anchor=$('productDimV94')||page.querySelector('.two')||page.lastElementChild;
    if(anchor)anchor.insertAdjacentElement('afterend',box);else page.appendChild(box);
    if($('productDimV94'))$('productDimV94').style.display='none';
  }

  function render(){
    ensureSection();if(!$('pd99Size'))return;
    if($('productDimV94'))$('productDimV94').style.display='none';
    const all=rows();
    const delivery=all.filter(r=>String(r.incident_type||'').toLowerCase()==='delivery');
    const sizeData=grouped(all,'product_size');
    const caseData=grouped(all,r=>String(r.incident_type||'').toLowerCase()==='delivery'?'PECAH KIRIM':String(r.incident_type||'').toLowerCase()==='warehouse'?'PECAH GUDANG':'LAINNYA');
    const originData=grouped(all,r=>String(r.factory||'').toUpperCase(),'BELUM DIISI');
    const vendorData=grouped(delivery,r=>String(r.transporter||'').toUpperCase(),'BELUM DIISI');
    $('pd99Scope').textContent=`${scopeLabel()} · ${typeof monthName==='function'?monthName(PERIOD):PERIOD}`;
    $('pd99Size').innerHTML=bars(sizeData,10);$('pd99SizeFoot').innerHTML=`${topText(sizeData,'Size terbesar')}<br>${qualityText('product_size',all)}`;
    $('pd99Case').innerHTML=bars(caseData,4);$('pd99CaseFoot').innerHTML=topText(caseData,'Case terbesar');
    $('pd99Origin').innerHTML=bars(originData,5);$('pd99OriginFoot').innerHTML=`${topText(originData,'Origin terbesar')}<br>${qualityText('factory',all)}`;
    $('pd99Vendor').innerHTML=bars(vendorData,10);$('pd99VendorFoot').innerHTML=delivery.length?topText(vendorData,'Vendor kirim terbesar'):'Belum ada Pecah Pengiriman pada scope ini.';
  }

  try{
    const base=window.renderAll||renderAll;
    window.renderAll=function(){const r=base.apply(this,arguments);setTimeout(render,0);return r};
    renderAll=window.renderAll;
  }catch(_){ }
  [100,400,1000,2000].forEach(ms=>setTimeout(render,ms));
})();
