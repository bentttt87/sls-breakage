// Breakage Monitoring v111 — independent multi-select Year / Month / RDC filters
(() => {
  const MONTHS=[
    [1,'Januari'],[2,'Februari'],[3,'Maret'],[4,'April'],[5,'Mei'],[6,'Juni'],
    [7,'Juli'],[8,'Agustus'],[9,'September'],[10,'Oktober'],[11,'November'],[12,'Desember']
  ];
  const ALL_RDCS=['Jakarta','Semarang','Surabaya','Denpasar','Palembang'];
  let F={years:[],months:[],rdcs:[]};
  let FILTER_DATA=null;
  const oldLoadAll=loadAll;

  function initState(){
    const p=(typeof PERIOD!=='undefined'&&PERIOD?PERIOD:currentPeriod());
    const [y,m]=p.split('-').map(Number);
    if(!F.years.length)F.years=[y];
    if(!F.months.length)F.months=[m];
    if(!F.rdcs.length){
      if(ACCESS && !ACCESS.is_master && ACCESS.rdc_name)F.rdcs=[ACCESS.rdc_name];
      else if(typeof SCOPE!=='undefined' && SCOPE && SCOPE!=='ALL')F.rdcs=[SCOPE];
      else F.rdcs=[...ALL_RDCS];
    }
  }
  function escAttr(s){return esc(s).replace(/"/g,'&quot;')}
  function sortedNums(a){return [...new Set(a.map(Number).filter(Number.isFinite))].sort((x,y)=>x-y)}
  function selectedPeriods(){
    const a=[];for(const y of sortedNums(F.years))for(const m of sortedNums(F.months))a.push(`${y}-${String(m).padStart(2,'0')}`);return a;
  }
  function latestSelectedPeriod(){const a=selectedPeriods();return a.length?a[a.length-1]:currentPeriod()}
  function selectedRdcLabel(){
    if(F.rdcs.length===ALL_RDCS.length)return 'Semua RDC';
    if(F.rdcs.length<=2)return F.rdcs.join(' + ');
    return `${F.rdcs.length} RDC`;
  }
  function monthSelectionLabel(){
    const ms=sortedNums(F.months);
    if(ms.length===12)return 'Jan–Des';
    if(ms.length===1)return MONTHS.find(x=>x[0]===ms[0])?.[1]||String(ms[0]);
    if(ms.length<=3)return ms.map(m=>(MONTHS.find(x=>x[0]===m)?.[1]||'').slice(0,3)).join(', ');
    return `${ms.length} bulan`;
  }
  function yearSelectionLabel(){const ys=sortedNums(F.years);return ys.length<=2?ys.join(', '):`${ys[0]}–${ys[ys.length-1]}`}
  function filterLabel(){return `${monthSelectionLabel()} ${yearSelectionLabel()} · ${selectedRdcLabel()}`}

  function addCss(){
    if(document.getElementById('mfStyle'))return;
    const st=document.createElement('style');st.id='mfStyle';st.textContent=`
      .mf{position:relative;background:#fff;border:1px solid var(--line);border-radius:9px;min-width:150px}
      .mf>summary{list-style:none;cursor:pointer;padding:8px 12px;display:flex;gap:8px;align-items:center;font-weight:800;color:var(--ink)}
      .mf>summary::-webkit-details-marker{display:none}.mf-label{font-size:10px;color:var(--muted);font-weight:800}.mf-value{font-size:13px;white-space:nowrap}
      .mf-menu{position:absolute;z-index:80;top:calc(100% + 6px);left:0;min-width:220px;max-height:330px;overflow:auto;background:#fff;border:1px solid var(--line);border-radius:10px;box-shadow:0 14px 36px rgba(15,36,71,.18);padding:10px}
      .mf-actions{display:flex;gap:6px;padding-bottom:8px;border-bottom:1px solid var(--line);margin-bottom:6px}.mf-actions button{border:0;background:#eef5ff;color:var(--navy);border-radius:7px;padding:6px 8px;font-size:10px;font-weight:800}
      .mf-opt{display:flex;gap:8px;align-items:center;padding:7px 5px;font-size:12px}.mf-opt input{accent-color:#0b64b5}
      #applyMultiFilter{align-self:stretch}.mf-note{font-size:9.5px;color:var(--muted);padding:4px 2px 0}
      @media(max-width:760px){.mf{flex:1;min-width:130px}.mf-menu{position:fixed;left:12px;right:12px;top:auto;bottom:82px;max-height:55vh}.mf>summary{padding:8px}.mf-value{font-size:12px}}
    `;document.head.appendChild(st);
  }
  function setChecks(id,vals){
    const root=$(id);if(!root)return;
    root.querySelectorAll('input[type=checkbox]').forEach(cb=>cb.checked=vals.map(String).includes(cb.value));
  }
  function readChecks(id){return [...$(id).querySelectorAll('input[type=checkbox]:checked')].map(x=>x.value)}
  function updateFilterSummaries(){
    const y=$('mfYearVal'),m=$('mfMonthVal'),r=$('mfRdcVal');
    if(y)y.textContent=yearSelectionLabel()||'—';if(m)m.textContent=monthSelectionLabel()||'—';if(r)r.textContent=selectedRdcLabel()||'—';
  }
  function checkboxList(items,selected){return items.map(([v,l])=>`<label class="mf-opt"><input type="checkbox" value="${escAttr(v)}" ${selected.map(String).includes(String(v))?'checked':''}><span>${esc(l)}</span></label>`).join('')}
  function multiControl(id,label,valueId,items,selected,allowAll=true){return `<details class="mf" id="${id}"><summary><span class="mf-label">${label}</span><span class="mf-value" id="${valueId}"></span><span style="margin-left:auto">⌄</span></summary><div class="mf-menu"><div class="mf-actions">${allowAll?'<button type="button" data-act="all">Pilih Semua</button>':''}<button type="button" data-act="clear">Hapus</button></div>${checkboxList(items,selected)}<div class="mf-note">Bisa pilih lebih dari satu.</div></div></details>`}

  function ensureControls(){
    initState();addCss();
    const periodEl=$('period');if(!periodEl)return;
    const toolbar=periodEl.closest('.toolbar');if(!toolbar)return;
    if($('mfYear')){updateAccess();updateFilterSummaries();return;}
    const pCtrl=periodEl.closest('.ctrl');const scopeCtrl=$('scope')?.closest('.ctrl');
    if(pCtrl)pCtrl.style.display='none';if(scopeCtrl)scopeCtrl.style.display='none';
    const oldMode=$('periodMode')?.closest('.ctrl');const oldYear=$('yearViewCtrl');if(oldMode)oldMode.style.display='none';if(oldYear)oldYear.style.display='none';
    const nowY=new Date().getFullYear();const years=[];for(let y=2025;y<=Math.max(nowY,2026);y++)years.push([y,String(y)]);
    const holder=document.createElement('div');holder.id='multiFilterHolder';holder.style.display='contents';
    holder.innerHTML=multiControl('mfYear','Tahun','mfYearVal',years,F.years)+multiControl('mfMonth','Bulan','mfMonthVal',MONTHS,F.months)+multiControl('mfRdc','RDC','mfRdcVal',ALL_RDCS.map(x=>[x,x]),F.rdcs)+`<button class="primary" id="applyMultiFilter">Terapkan</button>`;
    toolbar.insertBefore(holder,toolbar.firstChild);
    document.querySelectorAll('.mf').forEach(d=>{
      d.querySelector('[data-act=all]')?.addEventListener('click',()=>{d.querySelectorAll('input[type=checkbox]').forEach(x=>x.checked=true)});
      d.querySelector('[data-act=clear]')?.addEventListener('click',()=>{d.querySelectorAll('input[type=checkbox]').forEach(x=>x.checked=false)});
    });
    $('applyMultiFilter').addEventListener('click',applyFilters);
    updateAccess();updateFilterSummaries();
  }
  function updateAccess(){
    if(!ACCESS)return;
    if(!ACCESS.is_master && ACCESS.rdc_name){
      F.rdcs=[ACCESS.rdc_name];setChecks('mfRdc',F.rdcs);
      const d=$('mfRdc');if(d){d.querySelectorAll('input').forEach(x=>x.disabled=true);d.querySelectorAll('.mf-actions button').forEach(x=>x.style.display='none')}
    }
  }

  async function applyFilters(){
    const ys=readChecks('mfYear').map(Number),ms=readChecks('mfMonth').map(Number),rs=readChecks('mfRdc');
    if(!ys.length||!ms.length||!rs.length){alert('Pilih minimal 1 Tahun, 1 Bulan, dan 1 RDC.');return}
    F.years=sortedNums(ys);F.months=sortedNums(ms);F.rdcs=ACCESS&&!ACCESS.is_master&&ACCESS.rdc_name?[ACCESS.rdc_name]:rs;
    updateFilterSummaries();document.querySelectorAll('.mf[open]').forEach(x=>x.removeAttribute('open'));
    PERIOD=latestSelectedPeriod();SCOPE=F.rdcs.length===1?F.rdcs[0]:'ALL';
    if($('period'))$('period').value=PERIOD;if($('scope') && [...$('scope').options].some(o=>o.value===SCOPE))$('scope').value=SCOPE;
    await loadAll();
  }

  function usablePeriods(d){const rows=(d?.periods||[]).filter(x=>x.has_data);const complete=rows.filter(x=>Number(x.rdc_with_data||0)>=Number(x.total_rdc||0));return complete.length?complete:rows}
  function average(rows,key){if(!rows.length)return null;return rows.reduce((a,b)=>a+Number(b[key]||0),0)/rows.length}
  function ratioFromRows(rows,numKey,denKey){let n=0,d=0,c=0;for(const r of rows){const den=Number(r[denKey]||0);if(den>0){n+=Number(r[numKey]||0);d+=den;c++}}return {rate:d>0?n/d*10000:null,coverage:c}}
  function isSingle(){return F.years.length===1&&F.months.length===1}

  function renderCards(d){
    const rows=usablePeriods(d),single=isSingle(),base=single?(d.periods||[]).find(x=>x.has_data):null;
    const total=single?Number(base?.total_breakage_box||0):average(rows,'total_breakage_box');
    const wh=single?Number(base?.pecah_gudang_box||0):average(rows,'pecah_gudang_box');
    const del=single?Number(base?.pecah_kiriman_box||0):average(rows,'pecah_kiriman_box');
    const dr=ratioFromRows(rows,'pecah_kiriman_box','delivered_box');const wr=ratioFromRows(rows,'pecah_gudang_box','stock_exposure_box');
    const totalSum=rows.reduce((a,b)=>a+Number(b.total_breakage_box||0),0),whSum=rows.reduce((a,b)=>a+Number(b.pecah_gudang_box||0),0),delSum=rows.reduce((a,b)=>a+Number(b.pecah_kiriman_box||0),0);
    const suffix=single?'BOX':'BOX/bln';const lbl=single?'':'Rata-rata ';
    $('summaryCards').innerHTML=`
      <div class="card metric"><div class="label">Periode Data</div><div class="value">${fmt(rows.length)} <span class="small">BULAN</span></div><div class="foot">Dipilih ${fmt(d.selected_periods)} bulan · ${selectedRdcLabel()}${rows.length<Number(d.selected_periods||0)?' · data belum lengkap':''}.</div></div>
      <div class="card metric bad"><div class="label">${lbl}Total Pecah</div><div class="value">${fmt(total)} <span class="small">${suffix}</span></div><div class="foot">${single?'Gudang + Pengiriman.':`Total ${fmt(totalSum)} BOX ÷ ${fmt(rows.length)} bulan data.`}</div></div>
      <div class="card metric"><div class="label">${lbl}Pecah Gudang</div><div class="value">${fmt(wh)} <span class="small">${suffix}</span></div><div class="foot">${single?'Periode terpilih.':`Total ${fmt(whSum)} BOX.`}</div></div>
      <div class="card metric"><div class="label">${lbl}Pecah Pengiriman</div><div class="value">${fmt(del)} <span class="small">${suffix}</span></div><div class="foot">${single?'Periode terpilih.':`Total ${fmt(delSum)} BOX.`}</div></div>
      <div class="card metric"><div class="label">Rasio Pecah Pengiriman</div><div class="value">${rate(dr.rate)} <span class="small">/10.000</span></div><div class="foot">Rasio gabungan dari ${fmt(dr.coverage)} bulan yang memiliki Delivered BOX.</div></div>
      <div class="card metric"><div class="label">Rasio Pecah Gudang</div><div class="value">${rate(wr.rate)} <span class="small">/10.000</span></div><div class="foot">Rasio gabungan dari ${fmt(wr.coverage)} bulan yang memiliki Stock Exposure.</div></div>`;
  }

  function renderRdc(d){
    const multi=!isSingle();const rows=(d.by_rdc||[]).map(r=>({...r,val:multi?Number(r.avg_total_breakage_box||0):Number(r.total_breakage_box||0)}));
    const max=Math.max(...rows.map(x=>x.val),1);$('rdcQuick').innerHTML=`<div class="barlist">${rows.map(r=>`<div class="barrow"><b>${esc(r.rdc)}</b><div class="bartrack"><div class="barfill red" style="width:${Math.max(2,r.val/max*100)}%"></div></div><div style="text-align:right"><b>${fmt(r.val)}</b> ${multi?'BOX/bln':'BOX'}</div></div>`).join('')}</div>`;
  }
  function renderCause(d){
    const title=$('causeQuick')?.previousElementSibling;if(title)title.textContent=isSingle()?'Penyebab Terbanyak':'Komposisi Breakage';
    if(isSingle()){
      const sel=new Set(F.rdcs),map={};for(const r of (INCIDENTS||[])){if(!sel.has(r.rdc))continue;const k=r.cause||r.sub_category||'Belum diklasifikasi';map[k]=(map[k]||0)+Number(r.qty_box||0)}
      let rows=Object.entries(map).map(([cause,qty])=>({cause,qty})).sort((a,b)=>b.qty-a.qty).slice(0,5);if(rows.length){const max=Math.max(...rows.map(x=>x.qty),1);$('causeQuick').innerHTML=`<div class="barlist">${rows.map(r=>`<div class="barrow"><span>${esc(r.cause)}</span><div class="bartrack"><div class="barfill amber" style="width:${Math.max(2,r.qty/max*100)}%"></div></div><div style="text-align:right"><b>${fmt(r.qty)}</b></div></div>`).join('')}</div>`;return}
    }
    const rows=usablePeriods(d),wh=rows.reduce((a,b)=>a+Number(b.pecah_gudang_box||0),0),del=rows.reduce((a,b)=>a+Number(b.pecah_kiriman_box||0),0),mx=Math.max(wh,del,1);
    $('causeQuick').innerHTML=`<div class="barlist"><div class="barrow"><span>Gudang</span><div class="bartrack"><div class="barfill amber" style="width:${wh/mx*100}%"></div></div><div style="text-align:right"><b>${fmt(wh)}</b></div></div><div class="barrow"><span>Pengiriman</span><div class="bartrack"><div class="barfill amber" style="width:${del/mx*100}%"></div></div><div style="text-align:right"><b>${fmt(del)}</b></div></div></div><div class="mf-note">Penyebab detail historis tidak tersedia untuk seluruh bulan; komposisi di atas tidak mengarang penyebab.</div>`;
  }
  function renderTables(d){
    const rows=(d.periods||[]).filter(x=>x.has_data);$('rekapTabs').style.display='none';
    $('rekapSummary').innerHTML=`<div class="tablewrap"><table class="tbl"><thead><tr><th>Periode</th><th>Coverage RDC</th><th>Pecah Gudang</th><th>Pecah Pengiriman</th><th>Total BOX</th><th>Rasio Gudang</th><th>Rasio Pengiriman</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${esc(monthName(r.period))}</b></td><td>${fmt(r.rdc_with_data)}/${fmt(r.total_rdc)}</td><td>${fmt(r.pecah_gudang_box)}</td><td>${fmt(r.pecah_kiriman_box)}</td><td><b>${fmt(r.total_breakage_box)}</b></td><td>${rate(r.warehouse_rate)}</td><td>${rate(r.delivery_rate)}</td></tr>`).join('')||'<tr><td colspan="7"><div class="empty">Belum ada data.</div></td></tr>'}</tbody></table></div>`;
    $('rekapTrend').innerHTML=`<div class="section-title">Trend Periode Terpilih</div>${trendBars(rows.map(r=>({bulan:monthName(r.period),delivery_rate:r.delivery_rate,warehouse_rate:r.warehouse_rate})))}`;
    $('latestIncidents').innerHTML=`<div class="tablewrap"><table class="tbl"><thead><tr><th>Periode</th><th>Pecah Gudang</th><th>Pecah Pengiriman</th><th>Total</th><th>Coverage RDC</th></tr></thead><tbody>${rows.slice().reverse().slice(0,12).map(r=>`<tr><td>${esc(monthName(r.period))}</td><td>${fmt(r.pecah_gudang_box)} BOX</td><td>${fmt(r.pecah_kiriman_box)} BOX</td><td><b>${fmt(r.total_breakage_box)} BOX</b></td><td>${fmt(r.rdc_with_data)}/${fmt(r.total_rdc)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function renderHero(d){$('heroPeriod').textContent=filterLabel();const rows=usablePeriods(d);const partial=(d.periods||[]).some(x=>x.has_data&&Number(x.rdc_with_data)<Number(x.total_rdc));$('heroStatus').innerHTML=`<span class="pill ${partial?'p-amber':'p-blue'}">${partial?'Sebagian Data':'Data Terpilih'}</span> · ${fmt(rows.length)} bulan`}

  async function renderFilterView(){
    if(!SESSION)return;initState();
    FILTER_DATA=await safeRpc('breakage_filter_summary_v111',{p_years:F.years,p_months:F.months,p_rdcs:F.rdcs},null);if(!FILTER_DATA)return;
    renderCards(FILTER_DATA);renderRdc(FILTER_DATA);renderCause(FILTER_DATA);renderTables(FILTER_DATA);renderHero(FILTER_DATA);
  }

  loadAll=async function(){
    initState();PERIOD=latestSelectedPeriod();SCOPE=F.rdcs.length===1?F.rdcs[0]:'ALL';
    await oldLoadAll();ensureControls();updateAccess();await renderFilterView();
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureControls);else ensureControls();
  setTimeout(ensureControls,400);
})();
