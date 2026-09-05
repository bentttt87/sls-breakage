function renderAll(){setupWindow();renderKpis();renderTargetWindow();renderBaselinePanel();renderScorecard();renderTrend();renderActions();renderRekapPage();renderIncidentPage();renderReconPage();renderTargetPage();$('who').textContent=`${String(ACCESS.role||'').toUpperCase()} · ${ACCESS.is_master?'Nasional':ACCESS.rdc_name}`;$('pageTitle').textContent=`Monitoring Breakage ${SCOPE==='ALL'?'Nasional':SCOPE}`;$('targetBtn').classList.toggle('hidden',!ACCESS.is_master);$('inputBtn').classList.remove('hidden');$('sapMoveBtn').classList.toggle('hidden',!['master','rdc_manager','supervisor'].includes(ACCESS?.role));if(!ACCESS.is_master){$('scope').innerHTML=`<option>${esc(ACCESS.rdc_name)}</option>`;$('scopeCtrl').querySelector('select').disabled=true}}
function showPage(p){document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id==='page-'+p));document.querySelectorAll('[data-page]').forEach(x=>x.classList.toggle('active',x.dataset.page===p))}
window.showPage=showPage;
document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
$('gran').querySelectorAll('button').forEach(b=>b.onclick=()=>{GRAN=b.dataset.g;$('gran').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));setupWindow();renderKpis();renderScorecard();renderRekapPage()});
$('period').onchange=async e=>{PERIOD=e.target.value;await loadAll()};
$('scope').onchange=async e=>{SCOPE=e.target.value;await loadAll()};
$('windowSel').onchange=()=>{renderKpis();renderScorecard()};
$('ctBtn').onclick=()=>window.open('https://sls-supply-chain-control-tower.vercel.app/','_blank');
$('logoutBtn').onclick=async()=>{try{if(SESSION?.access_token)await fetch(`${SUPABASE_URL}/auth/v1/logout`,{method:'POST',headers:{apikey:PUBLIC_ANON,Authorization:`Bearer ${SESSION.access_token}`}})}catch(_){}sessionStorage.removeItem('sls_breakage_session');sessionStorage.removeItem('sls_breakage_username');location.reload()};
$('loginBtn').onclick=login;
['username','pw'].forEach(id=>$(id).onkeydown=e=>{if(e.key==='Enter')login()});
async function login(){let username=$('username').value.trim(),pw=$('pw').value;$('loginMsg').textContent='';if(!username||!pw){$('loginMsg').textContent='User ID dan password wajib.';return}try{await signIn(username,pw);PERIOD='2026-09';SCOPE=ACCESS.is_master?'ALL':ACCESS.rdc_name;initPeriods();$('login').style.display='none';$('app').style.display=window.innerWidth<=760?'block':'grid';await loadAll()}catch(e){$('loginMsg').textContent=cleanErr(e.message)}}
async function restoreSession(){initPeriods();$('username').value=sessionStorage.getItem('sls_breakage_username')||'';let raw=sessionStorage.getItem('sls_breakage_session');if(!raw)return;try{SESSION=JSON.parse(raw);if(!SESSION?.access_token)throw new Error('invalid session');ACCESS=await rpc('breakage_my_access_v44',{});PERIOD='2026-09';SCOPE=ACCESS.is_master?'ALL':ACCESS.rdc_name;$('login').style.display='none';$('app').style.display=window.innerWidth<=760?'block':'grid';await loadAll()}catch(e){sessionStorage.removeItem('sls_breakage_session')}}
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).classList.remove('show'));
$('inputBtn').onclick=openBreakageInput;
$('targetBtn').onclick=()=>openKpiSetting();
$('sapMoveBtn').onclick=()=>openSapMove();
