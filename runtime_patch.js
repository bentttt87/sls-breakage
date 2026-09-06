// SLS Breakage Monitoring runtime hardening v57
(function(){
  const PATCH_VERSION='v57-production-readiness-20260906';
  const BUILD_LABEL='BUILD v57';
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  function ensureBuildBadge(){
    let el=document.getElementById('slsMonBuildBadge');
    if(el){el.textContent=BUILD_LABEL;return}
    const bar=document.querySelector('.topbar');if(!bar)return;
    el=document.createElement('span');el.id='slsMonBuildBadge';el.textContent=BUILD_LABEL;
    el.style.cssText='font-size:9px;font-weight:800;letter-spacing:.4px;padding:4px 7px;border:1px solid #ccd7e7;border-radius:999px;color:#52617a;background:#fff;white-space:nowrap';
    const ct=$('ctBtn');bar.insertBefore(el,ct||null);
  }

  function saveSession(){if(SESSION)sessionStorage.setItem('sls_breakage_session',JSON.stringify(SESSION))}
  function jwtExp(token){try{let s=String(token||'').split('.')[1].replace(/-/g,'+').replace(/_/g,'/');s+='='.repeat((4-s.length%4)%4);return Number(JSON.parse(atob(s)).exp||0)}catch(_e){return 0}}
  function expiresSoon(){const exp=Number(SESSION?.expires_at||jwtExp(SESSION?.access_token));return !exp||exp-Math.floor(Date.now()/1000)<120}
  async function refreshSession(force=false){
    if(!SESSION?.refresh_token)return false;
    if(!force&&!expiresSoon())return true;
    const r=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,{method:'POST',cache:'no-store',signal:AbortSignal.timeout(20000),headers:{apikey:PUBLIC_ANON,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:SESSION.refresh_token})});
    if(!r.ok){const t=await r.text().catch(()=>String(r.status));if(force)throw new Error('Sesi login perlu diperbarui: '+cleanErr(t));return false}
    const n=await r.json();SESSION={...SESSION,...n};if(!SESSION.expires_at&&n.expires_in)SESSION.expires_at=Math.floor(Date.now()/1000)+Number(n.expires_in);saveSession();return true;
  }
  window.slsRefreshBreakageMonitoringSession=refreshSession;

  rpc=async function(fn,params={}){
    await refreshSession(false).catch(()=>false);let lastErr,refreshed=false;
    for(let attempt=0;attempt<3;attempt++){
      try{
        const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`,{method:'POST',cache:'no-store',signal:AbortSignal.timeout(25000),headers:{apikey:PUBLIC_ANON,Authorization:`Bearer ${auth()}`,'Content-Type':'application/json'},body:JSON.stringify(params)});
        if((r.status===401||r.status===403)&&SESSION?.refresh_token&&!refreshed){const body=await r.clone().text().catch(()=> '');if(r.status===401||/jwt|token|unauthori|accessdenied/i.test(body)){refreshed=true;if(await refreshSession(true).catch(()=>false))continue}}
        if(!r.ok)throw new Error(await r.text());return r.json();
      }catch(e){lastErr=e;if(attempt===2||!/failed to fetch|networkerror|load failed|timeout/i.test(String(e?.message||e)))break;await sleep(500*(attempt+1))}
    }
    throw lastErr;
  };

  window.openBreakageInput=function(){window.open(BREAKAGE_INPUT_URL,'_blank','noopener')};

  function statusChip(label,value,state){
    const cfg=state==='ok'?['#e8f7ef','#067647','#b7e2ca']:state==='warn'?['#fff3df','#9a5b00','#f2d394']:['#edf4ff','#175cd3','#c9dcf4'];
    return `<div style="border:1px solid ${cfg[2]};background:${cfg[0]};border-radius:8px;padding:8px 10px;min-width:145px"><div style="font-size:9.5px;font-weight:800;color:#6f7b91;text-transform:uppercase;letter-spacing:.3px">${label}</div><div style="font-size:12px;font-weight:850;color:${cfg[1]};margin-top:2px">${value}</div></div>`;
  }

  function ensureReadinessBanner(){
    const content=document.querySelector('.content'),head=document.querySelector('.head');if(!content||!head)return;
    let box=document.getElementById('goLiveReadiness');
    if(!box){box=document.createElement('div');box.id='goLiveReadiness';box.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 16px;padding:10px;background:#fff;border:1px solid #dfe5ee;border-radius:10px';head.insertAdjacentElement('afterend',box)}
    const cutoffRows=Array.isArray(CUTOFFS)?CUTOFFS:[],cutReady=cutoffRows.filter(x=>x.status==='READY').length,cutTotal=cutoffRows.length||(SCOPE==='ALL'?5:1);
    const ex=SCOPE==='ALL'?EXPOSURE?.national:(EXPOSURE?.rows||[]).find(x=>x.rdc===SCOPE);
    const sapReady=!!ex?.data_through_date;
    const deliveryDen=Number(OVERVIEW?.delivery?.delivered||0);
    const deliveryReady=deliveryDen>0;
    const prodInc=Array.isArray(INCIDENTS)?INCIDENTS.length:0;
    box.innerHTML=`${statusChip('SYSTEM','PRODUCTION MODE','ok')}${statusChip('CUT-OFF STOCK',`${cutReady}/${cutTotal} READY`,cutReady===cutTotal?'ok':'warn')}${statusChip('SAP MOVEMENT',sapReady?`DATA s.d. ${ex.data_through_date}`:'DATA REQUIRED',sapReady?'ok':'warn')}${statusChip('DELIVERY DENOMINATOR',deliveryReady?`${deliveryDen.toLocaleString('id-ID')} BOX`:'DATA REQUIRED',deliveryReady?'ok':'warn')}${statusChip('INCIDENT PRODUKSI',`${prodInc} CASE`,prodInc>0?'info':'info')}`;
    const allReady=cutReady===cutTotal&&sapReady&&deliveryReady;
    box.title=allReady?'KPI operasional memiliki denominator utama untuk periode terpilih.':'Aplikasi sudah production-ready; KPI yang denominatornya belum tersedia tetap ditampilkan sebagai DATA REQUIRED/CUT-OFF REQUIRED tanpa fabrikasi data.';
  }

  function alignWorkflowUi(){
    ensureBuildBadge();ensureReadinessBanner();
    const hs=document.querySelector('.head-sub');if(hs&&hs.children[0])hs.children[0].textContent='↔ Incident diinput Admin RDC → direview/approve SPV RDC → direview/final Master.';
    const inputBtn=$('inputBtn');if(inputBtn){inputBtn.textContent='↗ Buka Breakage Input';inputBtn.onclick=window.openBreakageInput;inputBtn.classList.remove('hidden')}
    const modal=$('incidentModal');if(modal)modal.setAttribute('data-legacy-input','disabled');
    if(ACCESS){const master=!!ACCESS.is_master;if($('navTarget'))$('navTarget').classList.toggle('hidden',!master);if($('targetBtn'))$('targetBtn').classList.toggle('hidden',!master)}
  }

  if(typeof renderAll==='function'){const baseRenderAll=renderAll;renderAll=function(){const out=baseRenderAll.apply(this,arguments);alignWorkflowUi();return out}}
  if(typeof signIn==='function'){const baseSignIn=signIn;signIn=async function(){const out=await baseSignIn.apply(this,arguments);alignWorkflowUi();return out}}

  setTimeout(alignWorkflowUi,0);setTimeout(alignWorkflowUi,500);window.__SLS_BREAKAGE_MONITORING_PATCH=PATCH_VERSION;
})();
