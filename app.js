const BREAKAGE_INPUT_URL='https://sls-breakage-input.vercel.app/';
const SUPABASE_URL='https://mfdckngkvjnemwgmkiiv.supabase.co';
const PUBLIC_ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZGNrbmdrdmpuZW13Z21raWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMDcxMjUsImV4cCI6MjEwMTU4MzEyNX0.mFhv9hgQvjzg6AYfmEI2GiJ71I2xSkOozC43mwFcogU';
let SESSION=null, ACCESS=null, PERIOD='2026-09', SCOPE='ALL', GRAN='monthly', TARGETS=[], KPI_SETTINGS=[], CUTOFFS=[], OVERVIEW=null, INCIDENTS=[], RDCROWS=[], TREND=[], BASELINE25=null, BASELINE26=null, EXPOSURE=null, MOVEH=[], MOVEMAP=[];
const RDC_LIST=['Jakarta','Semarang','Surabaya','Denpasar','Palembang'];
const $=id=>document.getElementById(id); const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmt=v=>v==null?'—':Number(v).toLocaleString('id-ID',{maximumFractionDigits:2}); const rate=v=>v==null?'DATA REQUIRED':Number(v).toLocaleString('id-ID',{minimumFractionDigits:2,maximumFractionDigits:2});
function logoSvg(size=58){return `<svg class="roman" width="${size}" viewBox="0 0 100 80" aria-label="ROMAN"><path d="M12 47A38 38 0 0 1 88 47" fill="none" stroke="#ef1b2d" stroke-width="12"/><path d="M23 47A27 27 0 0 1 77 47" fill="none" stroke="#ffd21d" stroke-width="8"/><path d="M17 49h66l-8 10H25z" fill="#061b3c"/><circle cx="50" cy="48" r="8" fill="#ffd21d" stroke="#061b3c" stroke-width="4"/><text x="50" y="75" text-anchor="middle" font-size="18" font-weight="900" font-style="italic" fill="#ef1b2d">ROMAN</text></svg>`}
$('loginLogo').innerHTML=logoSvg(64);$('sideLogo').innerHTML=logoSvg(58);$('modalLogo').innerHTML=logoSvg(42);
function auth(){return SESSION?.access_token||PUBLIC_ANON}
async function rpc(fn,params={}){const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`,{method:'POST',headers:{apikey:PUBLIC_ANON,Authorization:`Bearer ${auth()}`,'Content-Type':'application/json'},body:JSON.stringify(params)});if(!r.ok)throw new Error(await r.text());return r.json()}
async function signIn(username,pw){username=String(username||'').trim().toLowerCase();if(!username||!pw)throw new Error('User ID dan password wajib.');const email=await rpc('get_login_email',{input_username:username,input_password:pw});if(!email)throw new Error('User ID atau password salah.');const r=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:PUBLIC_ANON,'Content-Type':'application/json'},body:JSON.stringify({email,password:pw})});if(!r.ok)throw new Error('Login gagal. Periksa User ID dan password.');SESSION=await r.json();ACCESS=await rpc('breakage_my_access_v44',{});sessionStorage.setItem('sls_breakage_session',JSON.stringify({access_token:SESSION.access_token,refresh_token:SESSION.refresh_token,expires_at:SESSION.expires_at,token_type:SESSION.token_type,user:SESSION.user}));sessionStorage.setItem('sls_breakage_username',username);}
function monthName(p){const [y,m]=p.split('-').map(Number);return new Intl.DateTimeFormat('id-ID',{month:'long',year:'numeric'}).format(new Date(y,m-1,1))}
function initPeriods(){const s=$('period');let a=[];for(let m=1;m<=12;m++)a.push(`2026-${String(m).padStart(2,'0')}`);s.innerHTML=a.map(p=>`<option value="${p}" ${p===PERIOD?'selected':''}>${monthName(p)}</option>`).join('')}
function scopeForRpc(){return ACCESS?.is_master?SCOPE:(ACCESS?.rdc_name||SCOPE)}
async function loadAll(){try{SCOPE=scopeForRpc();$('scope').value=SCOPE;const [o,t,ks,co,inc,cmp,tr,h,b25,b26,ex,mh]=await Promise.all([
 rpc('breakage_overview',{p_period:PERIOD,p_rdc:SCOPE}),rpc('breakage_target_matrix_v45',{p_scope:SCOPE}),rpc('breakage_kpi_settings_v48',{p_scope:SCOPE}),rpc('breakage_cutoff_status_v50',{p_scope:SCOPE}),rpc('breakage_incident_list',{p_period:PERIOD,p_rdc:SCOPE}),rpc('breakage_rdc_comparison',{p_period:PERIOD}),
 rpc('breakage_trend',{p_from:monthOffset(PERIOD,-5),p_to:PERIOD,p_rdc:SCOPE}),rpc('breakage_reconciliation_history',{p_rdc:SCOPE}),
 rpc('breakage_presentation_baseline_v47',{p_year:2025,p_rdc:SCOPE}),rpc('breakage_presentation_baseline_v47',{p_year:2026,p_rdc:SCOPE}),rpc('breakage_exposure_mtd_v51',{p_period:PERIOD,p_rdc:SCOPE}),rpc('breakage_movement_history_v51',{p_rdc:SCOPE})]);OVERVIEW=o;TARGETS=t||[];KPI_SETTINGS=ks||[];CUTOFFS=co||[];INCIDENTS=inc||[];RDCROWS=cmp?.rows||[];TREND=tr?.series||[];window.RECONH=h||[];BASELINE25=b25||null;BASELINE26=b26||null;EXPOSURE=ex||null;MOVEH=mh||[];renderAll()}catch(e){console.error(e); toast('Gagal memuat data: '+cleanErr(e.message),'bad')}}
function monthOffset(p,n){let[y,m]=p.split('-').map(Number);let d=new Date(y,m-1+n,1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function cleanErr(s){try{let j=JSON.parse(s);return j.message||j.error||s}catch{return s}}
function targetRows(period=PERIOD){return TARGETS.filter(x=>x.period_key===period).sort((a,b)=>a.window_order-b.window_order)}
function managementSetting(kpi){return KPI_SETTINGS.find(x=>x.kpi_code===kpi)||null}
function cutoffReadyCount(){return CUTOFFS.filter(x=>x.status==='READY').length}
function cutoffRequired(){if(!CUTOFFS.length)return true;return CUTOFFS.some(x=>x.status!=='READY')}
function cutoffSummary(){let n=cutoffReadyCount(),total=CUTOFFS.length||(SCOPE==='ALL'?5:1);return {ready:n,total,complete:total>0&&n===total}}
function currentExposure(){if(!EXPOSURE)return null;if(SCOPE==='ALL')return EXPOSURE.national||null;return (EXPOSURE.rows||[]).find(x=>x.rdc===SCOPE)||null}
function kpiStatusPill(st){const m={FINAL:['s-good','FINAL'],PROVISIONAL:['s-blue','PROVISIONAL'],REVIEW_REQUIRED:['s-bad','REVIEW REQUIRED'],DATA_REQUIRED:['s-watch','DATA REQUIRED'],CUT_OFF_REQUIRED:['s-watch','CUT-OFF REQUIRED']};let a=m[st]||['s-watch',st||'DATA REQUIRED'];return `<span class="status-pill ${a[0]}">${a[1]}</span>`}
function lowerBetterScore(actual,target){actual=Number(actual);target=Number(target);if(!Number.isFinite(actual)||!Number.isFinite(target)||actual<=0||target<0)return null;return Math.min(100,Math.round((target/actual*100)*10)/10)}
function scoreText(v){return v==null?'DATA REQUIRED':Number(v).toLocaleString('id-ID',{minimumFractionDigits:1,maximumFractionDigits:1})}
function pct4(v){return v==null?'—':Number(v).toLocaleString('id-ID',{minimumFractionDigits:4,maximumFractionDigits:4})}
function targetFor(kpi,gran=GRAN){let rows=targetRows().filter(x=>x.kpi_code===kpi);if(!rows.length)return null;if(gran==='monthly')return rows.at(-1);let w=$('windowSel').value;return rows.find(x=>x.window_code===w)||rows[0]}
function setupWindow(){let rows=[...new Map(targetRows().map(x=>[x.window_code,x])).values()];$('windowSel').innerHTML=rows.map(x=>`<option value="${x.window_code}">${esc(x.window_label)}</option>`).join('');$('windowCtrl').classList.toggle('hidden',GRAN==='monthly'||!rows.length)}
function targetGap(actual,kpi){const t=targetFor(kpi);return actual==null||!t?null:Number(actual)-Number(t.target_value)}
function pillFor(actual,kpi){const g=targetGap(actual,kpi);if(g==null)return '<span class="status-pill s-watch">DATA REQUIRED</span>';return g<=0?'<span class="status-pill s-good">Baik</span>':g<=.25?'<span class="status-pill s-watch">Perlu Perhatian</span>':'<span class="status-pill s-bad">Perlu Tindakan</span>'}
function receivingQty(){return INCIDENTS.filter(i=>i.incident_type==='receiving').reduce((a,b)=>a+Number(b.qty_box||0),0)}
function baselineRow(year=2026){let b=year===2026?BASELINE26:BASELINE25;if(!b)return null;if(SCOPE==='ALL')return b.national||null;return (b.rows||[]).find(x=>x.rdc===SCOPE)||null}
function pctGrowth(a,b){a=Number(a||0);b=Number(b||0);if(a===0)return b===0?'—':'N/A';let v=(b-a)/a*100;return `${v>=0?'+':''}${v.toLocaleString('id-ID',{minimumFractionDigits:1,maximumFractionDigits:1})}%`}
function baselineDeliveryRate(r){if(!r)return null;if(r.delivery_rate!=null)return Number(r.delivery_rate);let d=Number(r.delivered_box||0);return d>0?Number(r.delivery_breakage_box||0)/d*10000:null}
function exactDeliveryRate(r){let d=Number(r?.delivered_box||0);return d>0?Number(r?.delivery_breakage_box||0)/d*10000:null}
function exactWarehouseRate(r){let d=Number(r?.stock_exposure_box||0);return d>0?Number(r?.warehouse_breakage_box||0)/d*10000:null}
function baselineFallback(kpi){let live=kpi==='delivery'?OVERVIEW?.delivery?.rate:OVERVIEW?.warehouse?.rate;if(live!=null)return {value:Number(live),isBaseline:false,row:null};let b=baselineRow(2026);let v=kpi==='delivery'?baselineDeliveryRate(b):(b?.warehouse_rate!=null?Number(b.warehouse_rate):null);return {value:v,isBaseline:v!=null,row:b}}

document.write('<script src="bundle2.js"><\/script><script src="bundle3.js"><\/script><script src="bundle4.js"><\/script><script src="bundle5.js"><\/script><script src="bundle6.js"><\/script>');
