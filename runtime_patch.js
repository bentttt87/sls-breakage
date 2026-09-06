// SLS Breakage Monitoring runtime hardening v53
(function(){
  const PATCH_VERSION='v53-auth-workflow-ui-20260906';
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  function saveSession(){
    if(SESSION) sessionStorage.setItem('sls_breakage_session',JSON.stringify(SESSION));
  }
  function jwtExp(token){
    try{const p=JSON.parse(atob(String(token).split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));return Number(p.exp||0)}catch(_e){return 0}
  }
  function expiresSoon(){
    const exp=Number(SESSION?.expires_at||jwtExp(SESSION?.access_token));
    return !exp||exp-Math.floor(Date.now()/1000)<120;
  }
  async function refreshSession(force=false){
    if(!SESSION?.refresh_token)return false;
    if(!force&&!expiresSoon())return true;
    const r=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,{
      method:'POST',cache:'no-store',signal:AbortSignal.timeout(20000),
      headers:{apikey:PUBLIC_ANON,'Content-Type':'application/json'},
      body:JSON.stringify({refresh_token:SESSION.refresh_token})
    });
    if(!r.ok){
      const t=await r.text().catch(()=>String(r.status));
      if(force)throw new Error('Sesi login perlu diperbarui: '+cleanErr(t));
      return false;
    }
    const n=await r.json();SESSION={...SESSION,...n};
    if(!SESSION.expires_at&&n.expires_in)SESSION.expires_at=Math.floor(Date.now()/1000)+Number(n.expires_in);
    saveSession();return true;
  }
  window.slsRefreshBreakageMonitoringSession=refreshSession;

  rpc=async function(fn,params={}){
    await refreshSession(false).catch(()=>false);
    let lastErr,refreshed=false;
    for(let attempt=0;attempt<3;attempt++){
      try{
        const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`,{
          method:'POST',cache:'no-store',signal:AbortSignal.timeout(25000),
          headers:{apikey:PUBLIC_ANON,Authorization:`Bearer ${auth()}`,'Content-Type':'application/json'},
          body:JSON.stringify(params)
        });
        if((r.status===401||r.status===403)&&SESSION?.refresh_token&&!refreshed){
          const body=await r.clone().text().catch(()=> '');
          if(r.status===401||/jwt|token|unauthori|accessdenied/i.test(body)){
            refreshed=true;
            if(await refreshSession(true).catch(()=>false))continue;
          }
        }
        if(!r.ok)throw new Error(await r.text());
        return r.json();
      }catch(e){
        lastErr=e;
        if(attempt===2||!/failed to fetch|networkerror|load failed|timeout/i.test(String(e?.message||e)))break;
        await sleep(500*(attempt+1));
      }
    }
    throw lastErr;
  };

  window.openBreakageInput=function(){window.open(BREAKAGE_INPUT_URL,'_blank','noopener')};

  function alignWorkflowUi(){
    const hs=document.querySelector('.head-sub');
    if(hs&&hs.children[0]) hs.children[0].textContent='↔ Incident diinput Admin RDC → direview/approve SPV RDC → direview/final Master.';
    const inputBtn=$('inputBtn');
    if(inputBtn){
      inputBtn.textContent='↗ Buka Breakage Input';
      inputBtn.onclick=window.openBreakageInput;
      inputBtn.classList.remove('hidden');
    }
    // Legacy embedded incident input is retained in source only for backward compatibility;
    // operational input must go to the separate Breakage Input app.
    const modal=$('incidentModal');if(modal)modal.setAttribute('data-legacy-input','disabled');
    if(ACCESS){
      const master=!!ACCESS.is_master;
      if($('navTarget'))$('navTarget').classList.toggle('hidden',!master);
      if($('targetBtn'))$('targetBtn').classList.toggle('hidden',!master);
    }
  }

  // renderAll() was defined before this patch is loaded. Wrap it so role-based controls
  // stay correct after login, period/scope changes, and every loadAll refresh.
  if(typeof renderAll==='function'){
    const baseRenderAll=renderAll;
    renderAll=function(){const out=baseRenderAll.apply(this,arguments);alignWorkflowUi();return out};
  }

  // Fresh login receives ACCESS inside signIn(); align immediately after that too.
  if(typeof signIn==='function'){
    const baseSignIn=signIn;
    signIn=async function(){const out=await baseSignIn.apply(this,arguments);alignWorkflowUi();return out};
  }

  setTimeout(alignWorkflowUi,0);
  setTimeout(alignWorkflowUi,500);
  window.__SLS_BREAKAGE_MONITORING_PATCH=PATCH_VERSION;
})();
