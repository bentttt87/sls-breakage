// SLS Breakage Monitoring v73 — canonical login roles + national Manager scope + logistics menu.
(function(){
  'use strict';
  const national=()=>!!ACCESS?.is_national||!!ACCESS?.is_master;
  const isManager=()=>!!ACCESS?.is_manager;
  const isSpv=()=>String(ACCESS?.breakage_role||ACCESS?.role||'').toLowerCase()==='spv'||String(ACCESS?.role||'').toLowerCase()==='supervisor';
  const isMaster=()=>!!ACCESS?.is_master;
  const ALL_OPTS='<option value="ALL">Nasional</option><option>Jakarta</option><option>Semarang</option><option>Surabaya</option><option>Denpasar</option><option>Palembang</option>';
  const LOGISTICS_URL='https://sls-breakage-input.vercel.app/logistics.html';

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

  const oldRenderAll=renderAll;
  renderAll=function(){
    oldRenderAll();
    if(national()){
      $('scope').innerHTML=ALL_OPTS;$('scope').disabled=false;$('scope').value=SCOPE||'ALL';
      $('who').textContent=`${isManager()?'MGR':String(ACCESS?.breakage_role||ACCESS?.role||'').toUpperCase()} · Nasional`;
    }
    if(isManager()){
      if($('monthEndBtn')){$('monthEndBtn').disabled=true;$('monthEndBtn').title='Rekonsiliasi final/publish dilakukan Master';}
      const up=$('sapFile');if(up)up.disabled=true;
      const input=$('inputBtn');if(input)input.textContent='Buka Breakage Input (Read Only)';
    }
    ensureLogisticsMenu();
  };

  if($('username'))$('username').placeholder='SPV.JKT / MGR.SLS / MASTER.SLS';
  const recOpt=document.querySelector('#filterType option[value="receiving"]');if(recOpt)recOpt.textContent='Penerimaan (Legacy)';
  setTimeout(ensureLogisticsMenu,300);
  setTimeout(ensureLogisticsMenu,1200);
})();
