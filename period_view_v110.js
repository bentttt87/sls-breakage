// Breakage Monitoring v110 — Month / Year / Annual Average views
(() => {
  let VIEW_MODE = 'MONTH';
  let VIEW_YEAR = Number((typeof PERIOD !== 'undefined' && PERIOD ? PERIOD : new Date().toISOString().slice(0,7)).slice(0,4));
  let YEAR_DATA = null;

  const oldLoadAll = loadAll;
  const oldRenderSummary = renderSummary;

  function modeLabel(){
    if(VIEW_MODE==='YEAR') return `Tahun ${VIEW_YEAR}`;
    if(VIEW_MODE==='AVG') return `Rata-rata Bulanan ${VIEW_YEAR}`;
    return monthName(PERIOD);
  }
  function latestDataMonth(d){
    const rows=(d?.months||[]).filter(x=>x.has_data);
    return rows.length ? rows[rows.length-1].period : null;
  }
  function modePill(text){ return `<span class="pill p-blue">${esc(text)}</span>`; }

  async function applyMonthMetrics(){
    if(VIEW_MODE!=='MONTH' || !SESSION) return;
    const m = await safeRpc('breakage_period_metrics_v110',{p_period:PERIOD,p_rdc:rpcScope()},null);
    if(!m) return;
    const ex=currentExposure(), status=ex?.status||'DATA_REQUIRED';
    const digital = m.source==='DIGITAL_INCIDENT';
    const incidentText = Number(m.incident_count||0)>0 ? fmt(m.incident_count) : '—';
    const sourceText = m.source==='MONTHLY_KPI' ? 'KPI bulanan resmi' : 'Insiden digital terverifikasi';
    $('summaryCards').innerHTML=`
      <div class="card metric"><div class="label">Total Insiden</div><div class="value">${incidentText}</div><div class="foot">${sourceText}${Number(m.legacy_records||0)>0?` · ${fmt(m.legacy_records)} legacy evidence`:''}.</div></div>
      <div class="card metric bad"><div class="label">Total Pecah</div><div class="value">${fmt(m.total_breakage_box)} <span class="small">BOX</span></div><div class="foot">Pecah Gudang + Pecah Pengiriman.</div></div>
      <div class="card metric"><div class="label">Pecah Gudang</div><div class="value">${fmt(m.pecah_gudang_box)} <span class="small">BOX</span></div><div class="foot">${digital?'Terverifikasi dari Breakage Input.':'KPI bulanan resmi.'}</div></div>
      <div class="card metric"><div class="label">Pecah Pengiriman</div><div class="value">${fmt(m.pecah_kiriman_box)} <span class="small">BOX</span></div><div class="foot">${digital?'Terverifikasi dari Breakage Input.':'KPI bulanan resmi.'}</div></div>
      <div class="card metric"><div class="label">Rasio Pecah Pengiriman</div><div class="value">${rate(m.delivery_rate)} <span class="small">/10.000</span></div><div class="foot">${m.delivered_box?`Delivered ${fmt(m.delivered_box)} BOX.`:'Menunggu denominator Delivered BOX.'}</div></div>
      <div class="card metric ${status==='FINAL'?'good':status==='REVIEW_REQUIRED'?'bad':'warn'}"><div class="label">Rasio Pecah Gudang</div><div class="value">${m.warehouse_rate!=null?rate(m.warehouse_rate):rate(ex?.rate_per_10000)} <span class="small">/10.000</span></div><div class="foot">${dataPill(status)} &nbsp; Exposure ${fmt(m.stock_exposure_box ?? ex?.exposure)} BOX.</div></div>`;
  }

  function yearCards(d){
    const avg=VIEW_MODE==='AVG';
    const months=Number(d.months_with_data||0);
    const total = avg ? d.avg_total_breakage_box : d.total_breakage_box;
    const wh = avg ? d.avg_pecah_gudang_box : d.pecah_gudang_box;
    const del = avg ? d.avg_pecah_kiriman_box : d.pecah_kiriman_box;
    const unit = avg ? 'BOX/bln' : 'BOX';
    $('summaryCards').innerHTML=`
      <div class="card metric"><div class="label">Bulan dengan Data</div><div class="value">${fmt(months)} <span class="small">BULAN</span></div><div class="foot">Periode data yang sudah tersedia pada ${VIEW_YEAR}.</div></div>
      <div class="card metric bad"><div class="label">${avg?'Rata-rata Total Pecah':'Total Pecah YTD'}</div><div class="value">${fmt(total)} <span class="small">${unit}</span></div><div class="foot">${avg?'Total breakage ÷ bulan dengan data.':'Akumulasi bulan yang sudah memiliki data.'}</div></div>
      <div class="card metric"><div class="label">${avg?'Rata-rata Pecah Gudang':'Pecah Gudang YTD'}</div><div class="value">${fmt(wh)} <span class="small">${unit}</span></div><div class="foot">${avg?'Rata-rata bulanan gudang.':'Akumulasi Pecah Gudang.'}</div></div>
      <div class="card metric"><div class="label">${avg?'Rata-rata Pecah Pengiriman':'Pecah Pengiriman YTD'}</div><div class="value">${fmt(del)} <span class="small">${unit}</span></div><div class="foot">${avg?'Rata-rata bulanan pengiriman.':'Akumulasi Pecah Pengiriman.'}</div></div>
      <div class="card metric"><div class="label">Rasio Pecah Pengiriman</div><div class="value">${rate(d.delivery_rate)} <span class="small">/10.000</span></div><div class="foot">SUM Pecah ÷ SUM Delivered untuk bulan dengan denominator.</div></div>
      <div class="card metric"><div class="label">Rasio Pecah Gudang</div><div class="value">${rate(d.warehouse_rate)} <span class="small">/10.000</span></div><div class="foot">SUM Pecah ÷ SUM Exposure untuk bulan dengan denominator.</div></div>`;
  }

  function renderYearRdc(d){
    const rows=(d.by_rdc||[]).filter(r=>Number(r.total_breakage_box||0)>0 || SCOPE!=='ALL');
    if(!rows.length){ $('rdcQuick').innerHTML='<div class="empty">Belum ada data RDC pada tahun ini.</div>'; return; }
    const max=Math.max(...rows.map(r=>Number(r.total_breakage_box||0)),1);
    $('rdcQuick').innerHTML=`<div class="barlist">${rows.map(r=>`<div class="barrow"><b>${esc(r.rdc)}</b><div class="bartrack"><div class="barfill red" style="width:${Math.max(2,Number(r.total_breakage_box||0)/max*100)}%"></div></div><div style="text-align:right"><b>${fmt(r.total_breakage_box)}</b> BOX</div></div>`).join('')}</div>`;
  }

  function renderYearTables(d){
    const rows=(d.months||[]).filter(r=>r.has_data);
    const body=rows.map(r=>`<tr><td><b>${esc(monthName(r.period))}</b></td><td>${fmt(r.pecah_gudang_box)}</td><td>${fmt(r.pecah_kiriman_box)}</td><td><b>${fmt(r.total_breakage_box)}</b></td><td>${rate(r.warehouse_rate)}</td><td>${rate(r.delivery_rate)}</td><td>${r.source==='MONTHLY_KPI'?'<span class="pill p-green">Bulanan Final</span>':'<span class="pill p-blue">Digital MTD</span>'}</td></tr>`).join('');
    $('rekapSummary').innerHTML=`<div class="tablewrap"><table class="tbl"><thead><tr><th>Periode</th><th>Pecah Gudang</th><th>Pecah Pengiriman</th><th>Total BOX</th><th>Rasio Gudang</th><th>Rasio Pengiriman</th><th>Sumber</th></tr></thead><tbody>${body||'<tr><td colspan="7"><div class="empty">Belum ada data.</div></td></tr>'}</tbody></table></div>`;
    $('rekapTrend').innerHTML=`<div class="section-title">Trend ${VIEW_YEAR}</div>${trendBars(rows.map(r=>({bulan:r.month_label+' '+VIEW_YEAR,delivery_rate:r.delivery_rate,warehouse_rate:r.warehouse_rate})))}`;
  }

  async function renderYearView(){
    if(!SESSION || VIEW_MODE==='MONTH') return;
    YEAR_DATA=await safeRpc('breakage_year_summary_v110',{p_year:VIEW_YEAR,p_rdc:rpcScope()},null);
    if(!YEAR_DATA) return;
    yearCards(YEAR_DATA);
    $('heroPeriod').textContent=modeLabel();
    const last=latestDataMonth(YEAR_DATA);
    $('heroStatus').innerHTML=`${modePill(`${fmt(YEAR_DATA.months_with_data)} bulan data`)} · ${SCOPE==='ALL'?'Nasional':esc(SCOPE)}${last?` · s.d. ${esc(monthName(last))}`:''}`;
    renderYearRdc(YEAR_DATA);
    $('causeQuick').innerHTML='<div class="hint">Penyebab tahunan belum digabung dengan histori legacy. Gunakan tampilan <b>Bulan</b> untuk analisa penyebab yang detail.</div>';
    renderYearTables(YEAR_DATA);
    const recent=(YEAR_DATA.months||[]).filter(x=>x.has_data).slice(-6).reverse();
    $('latestIncidents').innerHTML=`<div class="tablewrap"><table class="tbl"><thead><tr><th>Periode</th><th>Pecah Gudang</th><th>Pecah Pengiriman</th><th>Total</th></tr></thead><tbody>${recent.map(r=>`<tr><td>${esc(monthName(r.period))}</td><td>${fmt(r.pecah_gudang_box)} BOX</td><td>${fmt(r.pecah_kiriman_box)} BOX</td><td><b>${fmt(r.total_breakage_box)} BOX</b></td></tr>`).join('')}</tbody></table></div>`;
  }

  renderSummary = function(){
    oldRenderSummary();
    if(VIEW_MODE==='MONTH') applyMonthMetrics();
    else renderYearView();
  };

  loadAll = async function(){
    await oldLoadAll();
    if(VIEW_MODE==='MONTH') await applyMonthMetrics();
    else await renderYearView();
  };

  function syncControls(){
    const pCtrl=$('period')?.closest('.ctrl');
    const yCtrl=$('yearViewCtrl');
    if(pCtrl) pCtrl.style.display=VIEW_MODE==='MONTH'?'flex':'none';
    if(yCtrl) yCtrl.style.display=VIEW_MODE==='MONTH'?'none':'flex';
  }

  function ensureControls(){
    const periodEl=$('period'); if(!periodEl || $('periodMode')) return;
    const toolbar=periodEl.closest('.toolbar'); if(!toolbar) return;
    const pCtrl=periodEl.closest('.ctrl');
    const mode=document.createElement('div'); mode.className='ctrl'; mode.innerHTML='<label>Tampilan</label><select id="periodMode"><option value="MONTH">Bulan</option><option value="YEAR">Tahun</option><option value="AVG">Rata-rata / Tahun</option></select>';
    toolbar.insertBefore(mode,pCtrl);
    const year=document.createElement('div'); year.className='ctrl'; year.id='yearViewCtrl';
    const nowY=new Date().getFullYear();
    year.innerHTML=`<label>Tahun</label><select id="yearView">${[nowY-1,nowY,nowY+1].map(y=>`<option value="${y}" ${y===VIEW_YEAR?'selected':''}>${y}</option>`).join('')}</select>`;
    toolbar.insertBefore(year,pCtrl);
    $('periodMode').addEventListener('change',async e=>{ VIEW_MODE=e.target.value; syncControls(); if(VIEW_MODE==='MONTH'){ await loadAll(); } else { await renderYearView(); } });
    $('yearView').addEventListener('change',async e=>{ VIEW_YEAR=Number(e.target.value); if(VIEW_MODE!=='MONTH') await renderYearView(); });
    syncControls();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',ensureControls); else ensureControls();
  setTimeout(ensureControls,500);
})();
