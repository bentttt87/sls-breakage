// SLS Breakage Monitoring v74 — canonical roles + logistics menu + dedicated SAP upload button.
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

  function ensureSapUploadButton(){
    const toolbar=document.querySelector('.toolbar'),refresh=$('refreshBtn');
    if(!toolbar||!refresh)return;
    let b=$('sapUploadBtnV74');
    if(!b){
      b=document.createElement('button');
      b.id='sapUploadBtnV74';
      b.className='secondary';
      b.textContent='⇧ Upload SAP';
      b.title='Buka menu upload SAP Movement / rekonsiliasi';
      b.onclick=()=>{
        if(typeof showPage==='function')showPage('sap');
        setTimeout(()=>{
          const box=document.querySelector('#page-sap .uploadbox');
          if(box){box.scrollIntoView({behavior:'smooth',block:'center'});box.style.boxShadow='0 0 0 3px rgba(22,117,209,.16)';setTimeout(()=>box.style.boxShadow='',1400);}
        },80);
      };
      refresh.insertAdjacentElement('beforebegin',b);
    }
    b.style.display=(isSpv()||isMaster())?'':'none';
    const navSap=document.querySelector('[data-page="sap"]');
    if(navSap)navSap.textContent='⇧ Upload & Rekonsiliasi SAP';
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
    ensureSapUploadButton();
  };

  if($('username'))$('username').placeholder='SPV.JKT / MGR.SLS / MASTER.SLS';
  const recOpt=document.querySelector('#filterType option[value="receiving"]');if(recOpt)recOpt.textContent='Penerimaan (Legacy)';
  setTimeout(()=>{ensureLogisticsMenu();ensureSapUploadButton();},300);
  setTimeout(()=>{ensureLogisticsMenu();ensureSapUploadButton();},1200);
})();
