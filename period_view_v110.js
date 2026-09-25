// SLS Breakage Monitoring v115 — terminology + mobile filter close hotfix.
// The v111 multi-filter core is preserved separately; this loader applies display-only terminology.
// Backend incident_type values remain delivery/warehouse for compatibility.
(function(){
  'use strict';
  const core=document.createElement('script');
  core.src='/period_view_core_v111.js?v=20260925-v115';
  core.async=false;

  function installTerminology(){
    const canonicalType=v=>{
      const s=String(v??'').trim().toLowerCase();
      if(['delivery','kiriman','pengiriman','pecah kiriman','pecah pengiriman','pecah kirim'].includes(s)) return 'Pecah Kirim';
      if(['warehouse','gudang','pecah gudang','pecah pallet','pecah dalam pallet'].includes(s)) return 'Pecah Pallet';
      if(s==='receiving'||s==='penerimaan') return 'Penerimaan';
      return String(v??'');
    };
    try{ window.typeLabel=canonicalType; typeLabel=canonicalType; }catch(_){ window.typeLabel=canonicalType; }

    const exact=new Map([
      ['Kiriman','Pecah Kirim'],['Pengiriman','Pecah Kirim'],['Gudang','Pecah Pallet'],
      ['Pecah Kiriman','Pecah Kirim'],['Pecah Pengiriman','Pecah Kirim'],['Pecah Gudang','Pecah Pallet'],
      ['Pecah dalam Pallet','Pecah Pallet'],['Rasio Pengiriman','Rasio Pecah Kirim'],['Rasio Gudang','Rasio Pecah Pallet'],
      ['Rasio Pecah Kiriman','Rasio Pecah Kirim'],['Rasio Pecah Pengiriman','Rasio Pecah Kirim'],['Rasio Pecah Gudang','Rasio Pecah Pallet'],
      ['Kejadian Gudang','Kejadian Pecah Pallet']
    ]);
    const phrases=[
      ['Gudang + Pengiriman.','Pecah Pallet + Pecah Kirim.'],['Pecah Pallet/Gudang','Pecah Pallet'],
      ['Rasio Pecah Pengiriman','Rasio Pecah Kirim'],['Rasio Pecah Kiriman','Rasio Pecah Kirim'],['Rasio Pecah Gudang','Rasio Pecah Pallet'],
      ['Pecah Pengiriman','Pecah Kirim'],['Pecah Kiriman','Pecah Kirim'],['Pecah Gudang','Pecah Pallet'],['Pecah dalam Pallet','Pecah Pallet']
    ];
    function normalizeText(text){
      const lead=(text.match(/^\s*/)||[''])[0],trail=(text.match(/\s*$/)||[''])[0],raw=text.trim();
      if(!raw)return text;if(exact.has(raw))return lead+exact.get(raw)+trail;
      let out=raw;for(const [from,to] of phrases)out=out.split(from).join(to);return lead+out+trail;
    }
    function apply(root=document.body){
      if(!root)return;
      if(root.nodeType===Node.TEXT_NODE){const n=normalizeText(root.nodeValue||'');if(n!==root.nodeValue)root.nodeValue=n;return;}
      const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){const p=node.parentElement;if(!p||['SCRIPT','STYLE','NOSCRIPT','TEXTAREA'].includes(p.tagName))return NodeFilter.FILTER_REJECT;return NodeFilter.FILTER_ACCEPT;}});
      const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(n=>{const v=normalizeText(n.nodeValue||'');if(v!==n.nodeValue)n.nodeValue=v;});
      document.querySelectorAll('option').forEach(o=>{const v=canonicalType(o.textContent);if(v!==o.textContent&&['Pecah Kirim','Pecah Pallet','Penerimaan'].includes(v))o.textContent=v;});
    }
    apply();
    const observer=new MutationObserver(muts=>muts.forEach(m=>{if(m.type==='characterData')apply(m.target);m.addedNodes.forEach(n=>apply(n));}));
    observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
    window.slsBreakageTypeLabel=canonicalType;window.slsBreakageTerminologyApply=apply;
    [100,400,1000,2500].forEach(ms=>setTimeout(apply,ms));
  }

  function installFilterClose(){
    const add=()=>document.querySelectorAll('.mf-menu').forEach(menu=>{
      if(menu.querySelector('[data-act="done"]'))return;
      const wrap=document.createElement('div');wrap.className='mf-done-wrap';
      wrap.style.cssText='position:sticky;bottom:-10px;background:#fff;padding:10px 0 0;margin-top:8px;border-top:1px solid #dbe4ef;z-index:3';
      const btn=document.createElement('button');btn.type='button';btn.dataset.act='done';btn.textContent='✓ Selesai';
      btn.style.cssText='width:100%;min-height:44px;border:0;border-radius:9px;background:linear-gradient(90deg,#08458d,#0b66be);color:#fff;font-weight:900;font-size:14px';
      btn.onclick=e=>{e.preventDefault();e.stopPropagation();menu.closest('details.mf')?.removeAttribute('open');};
      wrap.appendChild(btn);menu.appendChild(wrap);
    });
    add();
    const obs=new MutationObserver(()=>add());obs.observe(document.body,{subtree:true,childList:true});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.mf[open]').forEach(x=>x.removeAttribute('open'));});
    document.addEventListener('click',e=>{document.querySelectorAll('.mf[open]').forEach(d=>{if(!d.contains(e.target))d.removeAttribute('open');});});
    [100,400,1000].forEach(ms=>setTimeout(add,ms));
  }

  core.onload=()=>{
    installTerminology();installFilterClose();
    setTimeout(()=>{try{if(typeof SESSION!=='undefined'&&SESSION&&typeof loadAll==='function')loadAll();}catch(_){ }},150);
  };
  core.onerror=()=>console.error('Breakage Monitoring core v111 gagal dimuat.');
  document.head.appendChild(core);
})();
