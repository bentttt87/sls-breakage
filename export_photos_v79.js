// SLS Breakage Monitoring v79 — Excel export with embedded evidence photos.
(function(){
  'use strict';

  const EXCELJS_SRC='https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';
  function loadScript(src){return new Promise((resolve,reject)=>{if(window.ExcelJS)return resolve();const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('Library ExcelJS gagal dimuat'));document.head.appendChild(s);});}
  function safe(v){if(v===null||v===undefined)return '';if(Array.isArray(v))return v.join(' | ');if(typeof v==='object')return JSON.stringify(v);return v;}
  async function blobToBase64(blob){const ab=await blob.arrayBuffer();let binary='';const bytes=new Uint8Array(ab);const chunk=0x8000;for(let i=0;i<bytes.length;i+=chunk){binary+=String.fromCharCode.apply(null,bytes.subarray(i,Math.min(i+chunk,bytes.length)));}return btoa(binary);}
  function extFrom(blob,path){const t=(blob.type||'').toLowerCase();if(t.includes('png'))return 'png';if(t.includes('jpeg')||t.includes('jpg'))return 'jpeg';const p=String(path||'').toLowerCase();if(p.endsWith('.png'))return 'png';return 'jpeg';}
  async function fetchEvidence(path){const url=`${SUPABASE_URL}/storage/v1/object/authenticated/breakage-evidence/${String(path).split('/').map(encodeURIComponent).join('/')}`;const rr=await fetch(url,{headers:{apikey:PUBLIC_ANON,Authorization:`Bearer ${auth()}`}});if(!rr.ok)throw new Error('Foto evidence tidak dapat diunduh');return rr.blob();}
  function styleHeader(row){row.font={bold:true,color:{argb:'FFFFFFFF'}};row.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0B4F94'}};row.alignment={vertical:'middle',horizontal:'center'};row.height=24;}
  function addJsonSheet(wb,name,rows){const ws=wb.addWorksheet(name);const arr=Array.isArray(rows)?rows:[];const keys=[...new Set(arr.flatMap(r=>Object.keys(r||{})))];if(!keys.length){ws.addRow(['Tidak ada data']);return ws;}ws.addRow(keys);styleHeader(ws.getRow(1));for(const r of arr){ws.addRow(keys.map(k=>safe(r?.[k])));}ws.views=[{state:'frozen',ySplit:1}];keys.forEach((k,i)=>{ws.getColumn(i+1).width=Math.min(35,Math.max(12,String(k).length+3));});}

  async function exportExcelWithPhotos(){
    const btn=document.getElementById('exportBtn');const old=btn?.textContent;
    try{
      if(btn){btn.disabled=true;btn.textContent='Menyiapkan Excel + Foto…';}
      await loadScript(EXCELJS_SRC);
      const wb=new ExcelJS.Workbook();wb.creator='SLS Breakage Monitoring';wb.created=new Date();

      addJsonSheet(wb,'Rekap RDC',typeof incidentRdcRows==='function'?incidentRdcRows():[]);
      addJsonSheet(wb,'Eksposur Gudang',EXPOSURE?.rows||[]);
      addJsonSheet(wb,'Upload SAP',MOVEH||[]);

      const ws=wb.addWorksheet('Insiden');
      const incidents=Array.isArray(INCIDENTS)?INCIDENTS:[];
      const excluded=new Set(['photo_paths']);
      const keys=[...new Set(incidents.flatMap(r=>Object.keys(r||{})).filter(k=>!excluded.has(k)))];
      const photoCols=['Foto 1','Foto 2','Foto 3','Foto 4','Foto 5'];
      ws.addRow([...keys,...photoCols]);styleHeader(ws.getRow(1));
      ws.views=[{state:'frozen',ySplit:1}];
      keys.forEach((k,i)=>{ws.getColumn(i+1).width=Math.min(28,Math.max(12,String(k).length+3));});
      for(let i=0;i<5;i++)ws.getColumn(keys.length+1+i).width=18;

      for(let ri=0;ri<incidents.length;ri++){
        const r=incidents[ri]||{};const excelRow=ri+2;
        ws.addRow([...keys.map(k=>safe(r[k])),'','','','','']);
        const paths=Array.isArray(r.photo_paths)?r.photo_paths.slice(0,5):[];
        if(paths.length){ws.getRow(excelRow).height=62;}
        for(let pi=0;pi<paths.length;pi++){
          try{
            const blob=await fetchEvidence(paths[pi]);const base64=await blobToBase64(blob);const ext=extFrom(blob,paths[pi]);
            const imageId=wb.addImage({base64:`data:image/${ext};base64,${base64}`,extension:ext});
            const col=keys.length+pi;
            ws.addImage(imageId,{tl:{col:col,row:excelRow-1},ext:{width:105,height:78},editAs:'oneCell'});
          }catch(e){ws.getCell(excelRow,keys.length+1+pi).value='Foto gagal dimuat';}
        }
      }
      ws.autoFilter={from:{row:1,column:1},to:{row:1,column:keys.length+5}};

      const buffer=await wb.xlsx.writeBuffer();const blob=new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});const a=document.createElement('a');const u=URL.createObjectURL(blob);a.href=u;a.download=`SLS_Breakage_Rekap_${PERIOD}_${SCOPE}_dengan_foto.xlsx`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500);
    }catch(e){alert('Export gagal: '+(e?.message||e));}
    finally{if(btn){btn.disabled=false;btn.textContent=old||'Download Excel';}}
  }

  function hook(){const btn=document.getElementById('exportBtn');if(!btn)return;btn.onclick=exportExcelWithPhotos;btn.title='Download Excel termasuk foto evidence pada sisi kanan setiap baris insiden';}
  hook();setTimeout(hook,300);setTimeout(hook,1200);
})();
