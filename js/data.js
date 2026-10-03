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
  if(!m || !navigator.storage || !navigator.storage.estimate) return;
  try{
    const e = await navigator.storage.estimate();
    const used = (e.usage||0)/1048576, quota = (e.quota||0)/1048576;
    let persisted = false; try{persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false;}catch(x){}
    m.textContent = (used<0.1?'<0.1':used.toFixed(1))+' MB'+(persisted?' · protegido':'');
    bar.style.width = quota ? Math.max(1,Math.min(100,used/quota*100))+'%' : '1%';
  }catch(err){}
}
