/* Catedra · Datos del usuario: respaldo, restauracion, borrado y espacio */

function exportData(){
  const payload = {app:'catedra', version:STATE_VERSION, exportedAt:new Date().toISOString(), state:S};
  const b = new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const u = URL.createObjectURL(b), a = document.createElement('a');
  a.href = u; a.download = 'catedra-respaldo-'+todayStr()+'.json';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(u),2000);
  showToast('Respaldo guardado (sin audios)');
}

document.getElementById('import-backup').addEventListener('change', async e=>{
  const f = e.target.files[0]; e.target.value=''; if(!f) return;
  try{
    const payload = JSON.parse(await f.text());
    if(!payload || payload.app!=='catedra' || !payload.state) throw new Error('formato');
    if(!confirm('Esto reemplaza todos tus datos actuales por el respaldo. ¿Continuar?')) return;
    S = normalizeState(payload.state);
    await flushState();
    if(S.onboarded){ goTab('home'); } else { showView('onboard'); goStep(1); document.getElementById('tabbar').style.display='none'; }
    showToast('Respaldo restaurado');
  }catch(err){ showToast('Ese archivo no es un respaldo de Catedra'); }
});

async function wipeAll(){
  S = defaultState();
  try{ await idbOp('audio','readwrite',st=>st.clear()); }catch(e){}
  try{ localStorage.removeItem('catedra_state'); }catch(e){}
  await flushState();
  document.getElementById('tabbar').style.display='none';
  showView('onboard'); goStep(1);
  showToast('Datos eliminados');
}

async function updateStorageMeter(){
  const m = document.getElementById('storage-meter'), bar = document.getElementById('storage-bar');
  if(typeof syncAiField==='function') syncAiField();
  if(typeof syncPrivacyUI==='function') syncPrivacyUI();
  if(!m || !navigator.storage || !navigator.storage.estimate) return;
  try{
    const e = await navigator.storage.estimate();
    const used = (e.usage||0)/1048576, quota = (e.quota||0)/1048576;
    let persisted = false; try{persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false;}catch(x){}
    m.textContent = (used<0.1?'<0.1':used.toFixed(1))+' MB'+(persisted?' · protegido':'');
    bar.style.width = quota ? Math.max(1,Math.min(100,used/quota*100))+'%' : '1%';
  }catch(err){}
}

// ── Recordatorios en el calendario del teléfono (.ics): gratis, sin servidor, con alarma ──
function icsEscape(t){return String(t).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');}
function icsStamp(d){const p=n=>String(n).padStart(2,'0');return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'T'+p(d.getHours())+p(d.getMinutes())+'00';}
function buildIcs(){
  const method=getMethodology();
  const hour={manana:8,tarde:15,noche:20,madrugada:6}[S.profile.picoProductividad]||18;
  const url=location.origin+location.pathname;
  const now=new Date();
  const utcStamp=now.toISOString().replace(/[-:]/g,'').replace(/\.\d+/,'');
  const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Catedra//Recordatorios//ES','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
  const ev=(uid,start,end,title,desc,alarms,allDay)=>{
    L.push('BEGIN:VEVENT','UID:'+uid+'@catedra','DTSTAMP:'+utcStamp);
    if(allDay){L.push('DTSTART;VALUE=DATE:'+start,'DTEND;VALUE=DATE:'+end);}
    else{L.push('DTSTART:'+start,'DTEND:'+end);}
    L.push('SUMMARY:'+icsEscape(title),'DESCRIPTION:'+icsEscape(desc));
    alarms.forEach(a=>L.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+icsEscape(title),'TRIGGER:'+a,'END:VALARM'));
    L.push('END:VEVENT');
  };
  for(let i=0;i<14;i++){
    const d=new Date();d.setDate(d.getDate()+i);d.setHours(hour,0,0,0);
    if(d<now)continue;
    const e=new Date(d.getTime()+method.duration*60000);
    ev('estudio-'+localISO(d),icsStamp(d),icsStamp(e),'Estudiar · Catedra','Tu bloque de '+method.duration+' min. Abre '+url,['-PT10M']);
  }
  S.subjects.forEach((s,i)=>{
    if(!s.examDate)return;
    const dd=daysUntil(s.examDate); if(dd===null||dd<0)return;
    const d0=s.examDate.replace(/-/g,'');
    const nx=addDays(s.examDate,1).replace(/-/g,'');
    ev('examen-'+s.id+'-'+s.examDate,d0,nx,'Examen: '+s.nombre,'Llega con repaso hecho. Abre '+url,['-P3D','-P1D'],true);
  });
  L.push('END:VCALENDAR');
  return L.join('\r\n');
}
function exportIcs(){
  if(!S.subjects.length){showToast('Primero crea una materia');return;}
  const b=new Blob([buildIcs()],{type:'text/calendar'});
  const u=URL.createObjectURL(b),a=document.createElement('a');
  a.href=u;a.download='catedra-recordatorios.ics';document.body.appendChild(a);a.click();document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(u),2000);
  showToast('Ábrelo para añadirlo a tu calendario');
}
