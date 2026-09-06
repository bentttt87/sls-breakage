// SLS Breakage Monitoring v58 — evidence policy marker only.
// Workflow UI ownership stays in workflow.js. Do not override Master actions here.
// Backend is authoritative: minimum 1 and maximum 5 evidence photos per incident.
(function(){
  const BUILD_LABEL='BUILD v58';
  const RULE=Object.freeze({minPhotos:1,maxPhotos:5,scope:'PER_INCIDENT'});

  function setBuild(){
    const el=document.getElementById('slsMonBuildBadge');
    if(el)el.textContent=BUILD_LABEL;
  }

  setBuild();
  setTimeout(setBuild,400);
  setTimeout(setBuild,1200);

  window.__SLS_BREAKAGE_EVIDENCE_RULE=RULE;
  window.__SLS_BREAKAGE_MONITORING_EVIDENCE_GUARD='v58';
})();