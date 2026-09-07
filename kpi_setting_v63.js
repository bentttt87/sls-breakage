// SLS Breakage Monitoring v63 — Simple KPI Setting + official ROMAN logo
(function(){
  const BUILD='BUILD v63';
  const OFFICIAL_LOGO='data:image/png;base64,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';
  const DENOMS={
    delivery:{method:'DELIVERED_BOX',label:'Delivered Box'},
    warehouse:{method:'OPENING_PLUS_IN_PLUS_OUT',label:'Stock Awal + Stock In + Stock Out'},
    receiving:{method:'QTY_ONLY',label:'Qty Receiving Breakage - termasuk barang dikembalikan / dicoret dari SJ'}
  };

  function logoImg(width=90){return `<img src="${OFFICIAL_LOGO}" alt="ROMAN" style="width:${width}px;height:auto;display:block;object-fit:contain">`}
  window.logoSvg=function(size=58){return logoImg(Math.round(size*1.55))};
  function applyOfficialLogo(){
    if($('loginLogo'))$('loginLogo').innerHTML=logoImg(96);
    if($('sideLogo'))$('sideLogo').innerHTML=logoImg(76);
    if($('modalLogo'))$('modalLogo').innerHTML=logoImg(52);
    const badge=document.getElementById('slsMonBuildBadge');if(badge)badge.textContent=BUILD;
  }

  function settingFor(k,s){
    return (KPI_SETTINGS||[]).find(x=>x.kpi_code===k&&x.scope_rdc===s) ||
      (KPI_SETTINGS||[]).find(x=>x.kpi_code===k&&x.scope_rdc==='ALL') || null;
  }
  function pctFromRate(v){const n=Number(v);return Number.isFinite(n)?(n/100).toFixed(4):''}
  function syncSimpleKpiForm(){
    const k=$('mKpi')?.value||'delivery',s=$('mScope')?.value||'ALL',m=settingFor(k,s),d=DENOMS[k];
    if(!$('mDenom')||!d)return;
    $('mDenom').innerHTML=`<option value="${d.method}">${d.label}</option>`;
    $('mDenom').value=d.method;$('mDenom').disabled=true;
    const denLabel=$('mDenom').closest('.field')?.querySelector('label');if(denLabel)denLabel.textContent='Denominator (otomatis)';
    const pctLabel=$('mPct')?.closest('.field')?.querySelector('label');if(pctLabel)pctLabel.textContent='Persentase (otomatis)';
    const rateLabel=$('mRate')?.closest('.field')?.querySelector('label');if(rateLabel)rateLabel.textContent='Target Rate / 10.000 *';
    if(k==='receiving'){
      $('mRate').value='';$('mRate').disabled=true;$('mRate').placeholder='Qty only — belum ada target rate';
      $('mPct').value='';$('mPct').disabled=true;$('mPct').placeholder='—';
      $('mFormulaNote').innerHTML='<b>Receiving:</b> mulai Go-Live semua pecah penerimaan wajib direkap sebagai Qty, termasuk barang yang langsung dikembalikan dan dicoret dari Surat Jalan. Rate belum ditetapkan sampai denominator authoritative tersedia.';
    } else {
      $('mRate').disabled=false;$('mRate').placeholder=k==='delivery'?'Contoh 4.27':'Contoh 5.35';
      $('mRate').value=m?.target_rate_per_10000??'';
      $('mPct').disabled=true;$('mPct').value=m?.target_rate_per_10000!=null?pctFromRate(m.target_rate_per_10000):'';
      $('mFormulaNote').innerHTML=k==='delivery'
        ? '<b>Delivery:</b> Qty Pecah Kiriman ÷ Delivered Box × 10.000. Isi <b>rate saja</b>; persentase dihitung otomatis.'
        : '<b>Warehouse:</b> Qty Pecah Gudang ÷ (Stock Awal + Stock In + Stock Out) × 10.000. Isi <b>rate saja</b>; persentase dihitung otomatis.';
    }
    if($('mReason'))$('mReason').placeholder='Tuliskan alasan perubahan target / setting.';
  }

  openKpiSetting=async function(){
    if(!ACCESS?.is_master){alert('Hanya Master dapat mengubah Setting Target KPI.');return}
    $('kpiSettingModal').classList.add('show');
    $('mScope').value=SCOPE==='ALL'?'ALL':SCOPE;
    syncSimpleKpiForm();
    $('mReason').value='';
    try{await loadMgmtHistory()}catch(_e){}
    applyOfficialLogo();
  };
  window.openKpiSetting=openKpiSetting;
  $('mKpi').onchange=syncSimpleKpiForm;
  $('mScope').onchange=async()=>{syncSimpleKpiForm();try{await loadMgmtHistory()}catch(_e){}};
  $('mRate').oninput=()=>{if(!$('mRate').disabled)$('mPct').value=pctFromRate($('mRate').value)};
  $('mPct').oninput=null;

  $('saveKpiSetting').onclick=async()=>{
    const k=$('mKpi').value,rateValue=$('mRate').value,reason=$('mReason').value.trim(),msg=$('mSettingMsg');
    msg.classList.remove('hidden');
    if(!reason){msg.style.color='#c42d26';msg.textContent='Alasan revisi wajib diisi.';return}
    if(k!=='receiving'&&(rateValue===''||!Number.isFinite(Number(rateValue))||Number(rateValue)<0)){msg.style.color='#c42d26';msg.textContent='Target Rate / 10.000 wajib diisi.';return}
    const btn=$('saveKpiSetting');btn.disabled=true;msg.style.color='#6f7b91';msg.textContent='Menyimpan setting…';
    try{
      const r=await rpc('breakage_kpi_setting_save_v63',{p_payload:{kpi_code:k,scope_rdc:$('mScope').value,target_rate_per_10000:k==='receiving'?null:Number(rateValue),revision_reason:reason}});
      msg.style.color='#079455';
      msg.textContent=k==='receiving'
        ? `✓ Receiving diset sebagai Qty Only · Revision ${r.revision_no}`
        : `✓ Target ${k} tersimpan: ≤ ${Number(r.target_rate_per_10000).toLocaleString('id-ID',{minimumFractionDigits:2,maximumFractionDigits:2})} /10.000 (${Number(r.target_pct).toLocaleString('id-ID',{minimumFractionDigits:4,maximumFractionDigits:4})}%) · Revision ${r.revision_no}`;
      KPI_SETTINGS=await rpc('breakage_kpi_settings_v48',{p_scope:SCOPE});
      syncSimpleKpiForm();await loadMgmtHistory();renderAll();applyOfficialLogo();
    }catch(e){msg.style.color='#c42d26';msg.textContent='Gagal: '+cleanErr(e?.message||String(e))}
    finally{btn.disabled=false}
  };

  if(typeof renderAll==='function'){
    const base=renderAll;renderAll=function(){const out=base.apply(this,arguments);applyOfficialLogo();setTimeout(()=>{
      document.querySelectorAll('.card.kpi').forEach(card=>{
        if(card.querySelector('.label')?.textContent.includes('Receiving Breakage')){
          const f=card.querySelector('.foot');if(f)f.textContent='Mulai Go-Live wajib direkap sebagai Qty, termasuk barang yang langsung dikembalikan dan dicoret dari SJ. Belum ada rate authoritative.';
        }
      });
    },0);return out};
  }
  setTimeout(()=>{applyOfficialLogo();syncSimpleKpiForm()},0);
  setTimeout(applyOfficialLogo,600);
  window.__SLS_KPI_SIMPLE_V63=true;
})();
