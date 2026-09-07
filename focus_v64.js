// SLS Breakage Monitoring v64 — focus only on Delivery & Storage breakage.
(function(){
  const BUILD='BUILD v64';
  const TYPE_LABEL={delivery:'Pecah Kiriman',warehouse:'Pecah Penyimpanan'};
  const activeIncidents=()=>Array.isArray(INCIDENTS)?INCIDENTS.filter(i=>['delivery','warehouse'].includes(String(i.incident_type||'').toLowerCase())):[];
  const lbl=t=>TYPE_LABEL[String(t||'').toLowerCase()]||String(t||'');

  function setBuild(){const el=document.getElementById('slsMonBuildBadge');if(el)el.textContent=BUILD}
  function stripReceivingOptions(){
    const mk=document.getElementById('mKpi');
    if(mk){[...mk.options].forEach(o=>{if(o.value==='receiving')o.remove()});if(mk.value==='receiving')mk.value='delivery'}
    const typeTabs=document.getElementById('typeTabs');
    if(typeTabs){const b=typeTabs.querySelector('[data-type="receiving"]');if(b)b.remove();const wh=typeTabs.querySelector('[data-type="warehouse"]');if(wh)wh.textContent='⌂ Penyimpanan'}
  }
  function addPolicyNote(){
    const head=document.querySelector('.head-sub');if(!head)return;
    let n=document.getElementById('focusPolicyV64');
    if(!n){n=document.createElement('span');n.id='focusPolicyV64';head.appendChild(n)}
    n.textContent='Fokus aktif: Pecah Kiriman & Pecah Penyimpanan. Receiving diretur ke pabrik; force majeure via BA management/stock adjustment.';
  }

  renderKpis=function(){
    const d=OVERVIEW?.delivery||{},td=targetFor('delivery'),md=managementSetting('delivery'),mw=managementSetting('warehouse'),df=baselineFallback('delivery'),ex=currentExposure();
    const whRate=ex?.rate_per_10000!=null?Number(ex.rate_per_10000):null,whScore=ex?.score!=null?Number(ex.score):null,whStatus=!cutoffSummary().complete?'CUT_OFF_REQUIRED':(ex?.status||'DATA_REQUIRED');
    const dLabel=df.isBaseline?'Baseline Jan–Jun 2026 · actual periode belum tersedia':(d.delivered?fmt(d.delivered)+' Delivered Box':'denominator belum tersedia');
    const whFoot=whStatus==='PROVISIONAL'?`SAP movement s.d. ${esc(ex.data_through_date||'—')} · Exposure MTD ${fmt(ex.exposure)} Box`:whStatus==='FINAL'?`Final month-end · Exposure ${fmt(ex.exposure)} Box`:whStatus==='REVIEW_REQUIRED'?`${fmt(ex.review_rows)} movement row perlu mapping`:whStatus==='CUT_OFF_REQUIRED'?`Cut-off stock siap ${cutoffSummary().ready}/${cutoffSummary().total}`:'Menunggu SAP MB51 D+1 / MTD';
    $('kpis').style.gridTemplateColumns='repeat(2,minmax(260px,1fr))';
    $('kpis').innerHTML=`
      <div class="card kpi"><div class="label">▣ Pecah Kiriman</div><div class="sub">Pecah Kiriman / 10.000 Delivered Box</div><div class="value">${rate(df.value)} ${df.value!=null?'<span class="unit">/10.000</span>':''}</div><div class="foot">${df.isBaseline?'<b class="warn">BASELINE PRESENTATION</b> · ':''}Target Utama ${md?.target_rate_per_10000!=null?'≤ '+fmt(md.target_rate_per_10000):'DATA REQUIRED'} · Recovery ${td?'≤ '+fmt(td.target_value):'—'} · ${dLabel}</div>${pillFor(df.value,'delivery')}</div>
      <div class="card kpi"><div class="label">⌂ Pecah Penyimpanan</div><div class="sub">Pecah Penyimpanan / (Stock Awal + Stock In + Stock Out)</div><div class="value">${whRate==null?(whStatus==='CUT_OFF_REQUIRED'?'CUT-OFF REQUIRED':whStatus==='REVIEW_REQUIRED'?'REVIEW REQUIRED':'DATA REQUIRED'):rate(whRate)+' <span class="unit">/10.000</span>'}</div><div class="foot"><b>Target ≤ ${mw?.target_rate_per_10000!=null?fmt(mw.target_rate_per_10000)+' /10.000':'—'}</b>${whScore!=null?` · Score ${scoreText(whScore)}`:''}<br>${whFoot}</div>${kpiStatusPill(whStatus)}</div>`;
  };

  renderTargetWindow=function(){
    const all=TARGETS.filter(x=>x.program_code==='BREAKAGE_REDUCTION_SEP_OCT_2026'&&['delivery','warehouse'].includes(x.kpi_code));
    const windows=[...new Map(all.map(x=>[x.window_code,x])).values()].sort((a,b)=>a.window_order-b.window_order),val=(k,w)=>all.find(x=>x.kpi_code===k&&x.window_code===w)?.target_value;
    $('targetWindow').innerHTML=`<div class="section-title">▣ Target Window KPI Rate / 10.000 <span style="font-size:10px;color:var(--muted);font-weight:600">Fokus Project Breakage All RDC</span></div><div class="target-matrix" style="grid-template-columns:minmax(155px,1.35fr) repeat(${Math.max(windows.length,1)},minmax(115px,1fr))"><div class="tm-cell tm-head">KPI</div>${windows.map(w=>`<div class="tm-cell tm-head">${esc(w.window_label)}</div>`).join('')}<div class="tm-cell tm-kpi">Pecah Kiriman</div>${windows.map(w=>`<div class="tm-cell" style="text-align:center;font-weight:800">≤ ${fmt(val('delivery',w.window_code))}</div>`).join('')}<div class="tm-cell tm-kpi">Pecah Penyimpanan</div>${windows.map(w=>`<div class="tm-cell" style="text-align:center;font-weight:800">≤ ${fmt(val('warehouse',w.window_code))}</div>`).join('')}</div><div class="smallnote" style="margin-top:8px">Receiving tidak masuk Breakage Monitoring SLS: barang diretur ke pabrik dan menjadi recap pecah pengiriman pabrik. Force majeure diselesaikan melalui BA ke management dan stock adjustment sesuai approval.</div>`;
  };

  renderOperationalScorecard=function(){
    const groups={};activeIncidents().forEach(i=>{const d=new Date(i.occurrence_date+'T00:00:00');let key=GRAN==='daily'?i.occurrence_date:`Week ${Math.ceil(d.getDate()/7)}`;const g=groups[key]||(groups[key]={key,delivery:0,warehouse:0,cases:0});g[i.incident_type]=(g[i.incident_type]||0)+Number(i.qty_box||0);g.cases++});
    const rows=Object.values(groups);
    $('scorecard').innerHTML=`<div class="section-title" style="padding:12px 14px;margin:0">Rekap ${GRAN==='daily'?'Harian':'Mingguan'} — ${esc(SCOPE==='ALL'?'Nasional':SCOPE)}</div><div class="hint" style="margin:0 12px 10px">Fokus hanya Pecah Kiriman dan Pecah Penyimpanan. Rate/Score harian atau mingguan menunggu denominator authoritative.</div><div class="tablewrap"><table class="tbl"><thead><tr><th>Periode</th><th>Pecah Kiriman Qty</th><th>Pecah Penyimpanan Qty</th><th>Kasus</th><th>Kiriman Rate</th><th>Penyimpanan Rate</th><th>Score</th></tr></thead><tbody>${rows.length?rows.map(r=>`<tr><td>${esc(r.key)}</td><td>${fmt(r.delivery)}</td><td>${fmt(r.warehouse)}</td><td>${r.cases}</td><td class="warn">DATA REQUIRED</td><td class="warn">DATA REQUIRED</td><td class="warn">DATA REQUIRED</td></tr>`).join(''):`<tr><td colspan="7"><div class="empty">Belum ada incident untuk periode ini.</div></td></tr>`}</tbody></table></div>`;
  };

  renderIncidentPage=function(){
    const rows=activeIncidents();
    $('incidentBody').innerHTML=`<div class="section-title">Incident — ${monthName(PERIOD)} <span style="margin-left:auto"><button class="primary" onclick="openBreakageInput()">↗ Buka Breakage Input</button></span></div><div class="hint" style="margin-bottom:10px"><b>Scope input:</b> Pecah Kiriman & Pecah Penyimpanan. Receiving diretur ke pabrik. Force majeure ditangani via BA management/stock adjustment.</div><div class="tablewrap"><table class="tbl"><thead><tr><th>Incident</th><th>Tanggal</th><th>RDC</th><th>Jenis</th><th>Item</th><th>Qty</th><th>No BA</th><th>Reported By</th><th>Status</th></tr></thead><tbody>${rows.length?rows.map(r=>`<tr><td>${esc(r.incident_no)}</td><td>${esc(r.occurrence_date)}</td><td>${esc(r.rdc)}</td><td>${esc(lbl(r.incident_type))}</td><td>${esc(r.item_code)}</td><td>${fmt(r.qty_box)} ${esc(r.uom)}</td><td>${esc(r.no_ba)}</td><td>${esc(r.reported_by)}</td><td><span class="status-pill ${String(r.status).toUpperCase()==='FINAL'?'s-good':'s-watch'}">${esc(r.status)}</span></td></tr>`).join(''):`<tr><td colspan="9"><div class="empty">Belum ada incident aktif pada periode ini.</div></td></tr>`}</tbody></table></div>`;
  };

  if(typeof renderTargetPage==='function'){
    const baseRenderTargetPage=renderTargetPage;
    renderTargetPage=function(){baseRenderTargetPage();const el=$('targetBody');if(!el)return;el.querySelectorAll('.hl-item').forEach(x=>{if(/Receiving/i.test(x.textContent))x.remove()});el.innerHTML=el.innerHTML.replace(/Warehouse · Target Utama/g,'Penyimpanan · Target Utama').replace(/Warehouse KPI resmi/g,'Penyimpanan KPI resmi').replace(/Warehouse/g,'Penyimpanan');};
  }
  if(typeof renderRekapPage==='function'){
    const baseRenderRekapPage=renderRekapPage;
    renderRekapPage=function(){baseRenderRekapPage();const el=$('rekapBody');if(el)el.innerHTML=el.innerHTML.replace(/Warehouse Rate/g,'Penyimpanan Rate').replace(/Warehouse Score/g,'Penyimpanan Score').replace(/Status Warehouse/g,'Status Penyimpanan')};
  }
  if(typeof renderReconPage==='function'){
    const baseRenderReconPage=renderReconPage;
    renderReconPage=function(){baseRenderReconPage();const el=$('reconBody');if(el)el.innerHTML=el.innerHTML.replace(/Warehouse KPI/g,'Penyimpanan KPI').replace(/Warehouse Exposure/g,'Exposure Penyimpanan')};
  }
  if(typeof renderAll==='function'){
    const baseRenderAllV64=renderAll;
    renderAll=function(){const out=baseRenderAllV64.apply(this,arguments);stripReceivingOptions();addPolicyNote();setBuild();return out};
  }

  stripReceivingOptions();addPolicyNote();setBuild();
  window.__SLS_BREAKAGE_FOCUS='v64-delivery-storage';
})();
