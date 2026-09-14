// SLS Breakage Monitoring v91 — canonical roles + logistics + SAP + BA+foto + official branding.
(function(){
  'use strict';
  const national=()=>!!ACCESS?.is_national||!!ACCESS?.is_master;
  const isManager=()=>!!ACCESS?.is_manager;
  const isSpv=()=>String(ACCESS?.breakage_role||ACCESS?.role||'').toLowerCase()==='spv'||String(ACCESS?.role||'').toLowerCase()==='supervisor';
  const isMaster=()=>!!ACCESS?.is_master;
  const ALL_OPTS='<option value="ALL">Nasional</option><option>Jakarta</option><option>Semarang</option><option>Surabaya</option><option>Denpasar</option><option>Palembang</option>';
  const LOGISTICS_URL='https://sls-breakage-input.vercel.app/logistics.html';
  const BRAND_SRC='https://raw.githubusercontent.com/bentttt87/sls-wms/main/quadra-roman-logo.svg?v=20260914-1617';

  function applyBrand(){
    const imgHtml=(w)=>`<img src="${BRAND_SRC}" alt="QUADRA ROMAN" style="width:${w}px;max-width:100%;height:auto;max-height:100px;object-fit:contain;display:block">`;
    const login=$('loginLogo'),side=$('sideLogo'),modal=$('modalLogo');
    if(login)login.innerHTML=imgHtml(166);
    if(side)side.innerHTML=imgHtml(116);
    if(modal)modal.innerHTML=imgHtml(84);
    document.querySelectorAll('svg.roman,svg[aria-label="ROMAN"],img[alt="ROMAN"],img[alt="Roman"]').forEach(el=>{
      if(el.closest('#loginLogo,#sideLogo,#modalLogo'))return;
      const img=document.createElement('img');img.src=BRAND_SRC;img.alt='QUADRA ROMAN';img.style.cssText='width:108px;height:auto;object-fit:contain';el.replaceWith(img);
    });
  }

  const oldRpcScope=rpcScope;
  rpcScope=function(){return national()?(SCOPE||'ALL'):oldRpcScope();};

  const oldLoadAll=loadAll;
  loadAll=async function(){if(national()&&!SCOPE)SCOPE='ALL';return oldLoadAll();};

  function ensureLogisticsMenu(){
    const input=$('inputBtn');if(!input)return;
    let b=$('logisticsBtnV73');
    if(!b){b=document.createElement('button');b.id='logisticsBtnV73';b.className=input.className;b.textContent='🚚 Database Ekspedisi';b.title='Vendor · Driver · No Polisi / Armada';b.onclick=()=>window.open(LOGISTICS_URL,'_blank','noopener');input.insertAdjacentElement('afterend',b);}
    b.style.display=(isSpv()||isManager()||isMaster())?'':'none';
  }

  function ensureSapUploadButton(){
    const toolbar=document.querySelector('.toolbar'),refresh=$('refreshBtn');
    if(!toolbar||!refresh)return;
    let b=$('sapUploadBtnV74');
    if(!b){
      b=document.createElement('button');
      b.id='sapUploadBtnV74';b.className='secondary';b.textContent='⇧ Upload SAP';
      b.title='Buka menu upload SAP Movement / rekonsiliasi';
      b.onclick=()=>{if(typeof showPage==='function')showPage('sap');setTimeout(()=>{const box=document.querySelector('#page-sap .uploadbox');if(box){box.scrollIntoView({behavior:'smooth',block:'center'});box.style.boxShadow='0 0 0 3px rgba(22,117,209,.16)';setTimeout(()=>box.style.boxShadow='',1400);}},80);};
      refresh.insertAdjacentElement('beforebegin',b);
    }
    b.style.display=(isSpv()||isMaster())?'':'none';
    const navSap=document.querySelector('[data-page="sap"]');if(navSap)navSap.textContent='⇧ Upload & Rekonsiliasi SAP';
  }

  function baGroupKey(r){return [r.rdc||'',r.occurrence_date||'',r.no_sj||'',r.customer||'',r.transporter||'',r.driver_name||'',r.vehicle_no||''].map(x=>String(x).trim().toUpperCase()).join('|');}
  function baGroups(){
    const map=new Map();
    (Array.isArray(INCIDENTS)?INCIDENTS:[]).filter(r=>String(r.incident_type||'').toLowerCase()==='delivery').forEach(r=>{
      const key=baGroupKey(r);if(!map.has(key))map.set(key,{key,rdc:r.rdc,occurrence_date:r.occurrence_date,no_sj:r.no_sj,factory:r.factory,customer:r.customer,receiver_name:r.ba_receiver_name,transporter:r.transporter,driver_name:r.driver_name,vehicle_no:r.vehicle_no,witness_name:r.ba_witness_name,items:[]});map.get(key).items.push(r);
    });
    return [...map.values()].map(g=>{
      g.qty=g.items.reduce((a,b)=>a+Number(b.qty_box||0),0);g.refs=[...new Set(g.items.map(x=>x.no_ba).filter(Boolean))];
      const st=g.items.map(x=>String(x.status||'').toUpperCase());g.status=st.every(x=>['FINAL','CLOSED'].includes(x))?'FINAL':st.every(x=>['APPROVED_SPV','MASTER_REVIEW','FINAL','CLOSED'].includes(x))?'VERIFIED':'OPEN';return g;
    }).sort((a,b)=>String(b.occurrence_date).localeCompare(String(a.occurrence_date))||String(b.no_sj||'').localeCompare(String(a.no_sj||'')));
  }
  function baStatusPill(s){return s==='FINAL'?'<span class="pill p-green">FINAL</span>':s==='VERIFIED'?'<span class="pill p-blue">SPV OK</span>':'<span class="pill p-amber">OPEN</span>';}
  function ensureBaUI(){
    if(!$('page-ba')){
      const sap=$('page-sap');if(sap)sap.insertAdjacentHTML('beforebegin',`<section id="page-ba" class="page"><div class="card section"><div class="section-title">Rekap Berita Acara Kepecahan Pengiriman <span class="right"><button class="secondary" id="baRefresh">↻ Refresh</button></span></div><div class="hint">Setiap download menghasilkan <b>satu dokumen</b>: halaman Berita Acara diikuti seluruh lampiran foto evidence untuk BA tersebut. Tabel otomatis bertambah jika item lebih dari 5 dan siap disimpan sebagai PDF multi-halaman.</div><div class="grid6" style="margin-top:10px"><div class="card metric"><div class="label">TOTAL BA / SJ</div><div class="value" id="baCount">0</div><div class="foot">Sesuai periode & scope aktif</div></div><div class="card metric"><div class="label">TOTAL ITEM</div><div class="value" id="baItems">0</div><div class="foot">Baris barang pecah</div></div><div class="card metric"><div class="label">TOTAL PECAH</div><div class="value" id="baQty">0</div><div class="foot">BOX</div></div></div><div class="filters" style="margin-top:12px;grid-template-columns:1fr 180px"><input id="baSearch" placeholder="Cari No SJ / Penerima / Ekspedisi / Driver / No BA"><select id="baStatusFilter"><option value="ALL">Semua Status</option><option value="OPEN">Open</option><option value="VERIFIED">SPV OK</option><option value="FINAL">Final</option></select></div><div id="baTable"></div></div></section>`);
    }
    if(!document.querySelector('.nav [data-page="ba"]')){const sap=document.querySelector('.nav [data-page="sap"]');if(sap){const b=document.createElement('button');b.dataset.page='ba';b.textContent='▧ Rekap BA';b.onclick=()=>{if(typeof showPage==='function')showPage('ba');setTimeout(renderBaRecap,30);};sap.insertAdjacentElement('beforebegin',b);}}
    if(!document.querySelector('.mobilebar [data-page="ba"]')){const sap=document.querySelector('.mobilebar [data-page="sap"]');if(sap){const b=document.createElement('button');b.dataset.page='ba';b.innerHTML='<b>▧</b>Rekap BA';b.onclick=()=>{if(typeof showPage==='function')showPage('ba');setTimeout(renderBaRecap,30);};sap.insertAdjacentElement('beforebegin',b);sap.parentElement.style.gridTemplateColumns='repeat(5,1fr)';}}
    const refresh=$('refreshBtn');if(refresh&&!$('baQuickBtn')){const b=document.createElement('button');b.id='baQuickBtn';b.className='secondary';b.textContent='🧾 Rekap BA';b.onclick=()=>{if(typeof showPage==='function')showPage('ba');setTimeout(renderBaRecap,30);};refresh.insertAdjacentElement('beforebegin',b);}
    if($('baRefresh'))$('baRefresh').onclick=()=>renderBaRecap();
    if($('baSearch'))$('baSearch').oninput=renderBaRecap;
    if($('baStatusFilter'))$('baStatusFilter').onchange=renderBaRecap;
  }
  function renderBaRecap(){
    if(!$('baTable'))return;let groups=baGroups();const q=String($('baSearch')?.value||'').trim().toLowerCase(),sf=$('baStatusFilter')?.value||'ALL';
    if(q)groups=groups.filter(g=>[g.no_sj,g.customer,g.transporter,g.driver_name,g.vehicle_no,...g.refs].some(v=>String(v||'').toLowerCase().includes(q)));
    if(sf!=='ALL')groups=groups.filter(g=>g.status===sf;
    const all=baGroups();$('baCount').textContent=fmt(all.length);$('baItems').textContent=fmt(all.reduce((a,g)=>a+g.items.length,0));$('baQty').textContent=fmt(all.reduce((a,g)=>a+g.qty,0));
    $('baTable').innerHTML=groups.length?`<div class="tablewrap"><table class="tbl"><thead><tr><th>Tanggal</th><th>RDC</th><th>No SJ</th><th>Penerima</th><th>Ekspedisi</th><th>Driver / No Polisi</th><th>Item</th><th>Qty</th><th>Ref BA</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${groups.map(g=>`<tr><td>${esc(g.occurrence_date||'—')}</td><td>${esc(g.rdc||'—')}</td><td><b>${esc(g.no_sj||'—')}</b></td><td>${esc(g.customer||'—')}</td><td>${esc(g.transporter||'—')}</td><td>${esc(g.driver_name||'—')}<div class="small muted">${esc(g.vehicle_no||'—')}</div></td><td>${fmt(g.items.length)}</td><td><b>${fmt(g.qty)}</b> BOX</td><td title="${esc(g.refs.join(', '))}">${esc(g.refs[0]||'—')}${g.refs.length>1?` (+${g.refs.length-1})`:''}</td><td>${baStatusPill(g.status)}</td><td><button class="secondary" onclick='window.printBaGroup(${JSON.stringify(g.key)})'>⬇ BA + Foto</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Belum ada BA Pecah Kiriman pada periode/scope ini.</div>';
  }
  window.printBaGroup=function(key){
    const g=baGroups().find(x=>x.key===key);if(!g){alert('Data BA tidak ditemukan.');return;}
    const storageKey='sls_ba_print_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);localStorage.setItem(storageKey,JSON.stringify(g));
    try{Object.keys(localStorage).filter(k=>k.startsWith('sls_ba_print_')&&k!==storageKey).slice(0,-8).forEach(k=>localStorage.removeItem(k));}catch(_){ }
    const w=window.open('/ba_print.html?k='+encodeURIComponent(storageKey),'_blank');if(!w)alert('Popup diblokir browser. Izinkan popup untuk membuka BA + foto.');
  };

  const oldRenderAll=renderAll;
  renderAll=function(){
    oldRenderAll();
    if(national()){$('scope').innerHTML=ALL_OPTS;$('scope').disabled=false;$('scope').value=SCOPE||'ALL';$('who').textContent=`${isManager()?'MGR':String(ACCESS?.breakage_role||ACCESS?.role||'').toUpperCase()} · Nasional`;}
    if(isManager()){if($('monthEndBtn')){$('monthEndBtn').disabled=true;$('monthEndBtn').title='Rekonsiliasi final/publish dilakukan Master';}const up=$('sapFile');if(up)up.disabled=true;const input=$('inputBtn');if(input)input.textContent='Buka Breakage Input (Read Only)';}
    ensureLogisticsMenu();ensureSapUploadButton();ensureBaUI();renderBaRecap();applyBrand();
  };

  if($('username'))$('username').placeholder='SPV.JKT / MGR.SLS / MASTER.SLS';
  const recOpt=document.querySelector('#filterType option[value="receiving"]');if(recOpt)recOpt.textContent='Penerimaan (Legacy)';
  ensureBaUI();applyBrand();
  setTimeout(()=>{ensureLogisticsMenu();ensureSapUploadButton();ensureBaUI();renderBaRecap();applyBrand();},300);
  setTimeout(()=>{ensureLogisticsMenu();ensureSapUploadButton();ensureBaUI();renderBaRecap();applyBrand();},1200);
})();