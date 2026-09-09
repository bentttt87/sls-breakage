// SLS Breakage Monitoring v72 — canonical login roles + national Manager scope.
(function(){
  'use strict';
  const national=()=>!!ACCESS?.is_national||!!ACCESS?.is_master;
  const isManager=()=>!!ACCESS?.is_manager;
  const ALL_OPTS='<option value="ALL">Nasional</option><option>Jakarta</option><option>Semarang</option><option>Surabaya</option><option>Denpasar</option><option>Palembang</option>';

  const oldRpcScope=rpcScope;
  rpcScope=function(){return national()?(SCOPE||'ALL'):oldRpcScope();};

  const oldLoadAll=loadAll;
  loadAll=async function(){if(national()&&!SCOPE)SCOPE='ALL';return oldLoadAll();};

  const oldRenderAll=renderAll;
  renderAll=function(){
    oldRenderAll();
    if(national()){
      $('scope').innerHTML=ALL_OPTS;$('scope').disabled=false;$('scope').value=SCOPE||'ALL';
      $('who').textContent=`${isManager()?'MGR':String(ACCESS?.breakage_role||ACCESS?.role||'').toUpperCase()} · Nasional`;
    }
    if(isManager()){
      // Manager is national review/control, not Master finalization/delete tier.
      if($('monthEndBtn')){$('monthEndBtn').disabled=true;$('monthEndBtn').title='Rekonsiliasi final/publish dilakukan Master';}
      const up=$('sapFile');if(up)up.disabled=true;
      const input=$('inputBtn');if(input)input.textContent='Buka Breakage Input (Read Only)';
    }
  };

  if($('username'))$('username').placeholder='SPV.JKT / MGR.SLS / MASTER.SLS';
  // Receiving is retained only as historical/legacy data; no new receiving input exists in Breakage Input.
  const recOpt=document.querySelector('#filterType option[value="receiving"]');if(recOpt)recOpt.textContent='Penerimaan (Legacy)';
})();
