// SLS Breakage Monitoring v65 — suppress misleading rate/score until denominator data is authoritative.
(function(){
  const BUILD='BUILD v65';
  if(typeof currentExposure==='function'){
    const baseCurrentExposureV65=currentExposure;
    currentExposure=function(){
      const ex=baseCurrentExposureV65();
      if(!ex)return ex;
      const st=String(ex.status||'DATA_REQUIRED').toUpperCase();
      if(!['PROVISIONAL','FINAL'].includes(st)){
        return {...ex,rate_per_10000:null,score:null};
      }
      return ex;
    };
    window.currentExposure=currentExposure;
  }
  // Re-render after the guard is installed so Overview cannot show 0.00 / Score 100
  // when Opening Stock exists but SAP movement data is still DATA_REQUIRED.
  try{ if(typeof renderAll==='function' && window.ACCESS) setTimeout(()=>renderAll(),0); }catch(_e){}
  window.__SLS_BREAKAGE_DATA_GUARD='v65';
})();
