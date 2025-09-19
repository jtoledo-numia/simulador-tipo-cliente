// --- Utils ---
function norm(v){ if(v==null) return ''; let s=String(v).trim(); if(/^[0-9]+$/.test(s) && s.length===1) s='0'+s; return s; }
function listFromStr(s){ s=(s??'').trim(); if(!s) return []; return s.split(',').map(x=>norm(x)); }
function chips(list){ if(!list || list.length===0) return '<span class="muted">—</span>'; return '<div class="chips">'+list.map(x=>`<span class="chip">${x}</span>`).join('')+'</div>'; }
function matches(value, allowed){ if(!allowed||allowed.length===0) return true; const v=norm(value); return allowed.includes(v); }
function classifyOne(input, rules){ for(const r of rules.sort((a,b)=>(a.order??999)-(b.order??999))){ if(matches(input.banca,r.banca)&&matches(input.identificacion,r.identificacion)&&matches(input.categoria,r.categoria)&&matches(input.segmento,r.segmento)){ return r.name; } } return 'Sin coincidencias'; }

let RULES=[], EDIT_MODE=false, SNAPSHOT=null;

function render(){
  const tbody=document.getElementById('rulesBody');
  const thAcc=document.getElementById('thAcciones');
  tbody.innerHTML='';

  // header buttons
  document.getElementById('toggleEdit').hidden = EDIT_MODE;
  document.getElementById('addRule').hidden = !EDIT_MODE;
  document.getElementById('cancelEdit').hidden = !EDIT_MODE;
  document.getElementById('saveRules').hidden = !EDIT_MODE;
  thAcc.classList.toggle('hidden', !EDIT_MODE);

  const sorted=[...RULES].sort((a,b)=>(a.order??999)-(b.order??999));
  sorted.forEach((r,idx)=>{
    const tr=document.createElement('tr');
    if(!EDIT_MODE){
      tr.innerHTML = `
        <td>${r.order??idx+1}</td>
        <td>${r.name??''}</td>
        <td>${chips(r.banca)}</td>
        <td>${chips(r.identificacion)}</td>
        <td>${chips(r.categoria)}</td>
        <td>${chips(r.segmento)}</td>
        <td class="hidden"></td>`;
    }else{
      tr.innerHTML = `
        <td><input class="cell-input small" type="number" min="1" value="${r.order??(idx+1)}"></td>
        <td><input class="cell-input" value="${r.name??''}"></td>
        <td><input class="cell-input" placeholder="Ej: 02,03" value="${(r.banca||[]).join(', ')}"></td>
        <td><input class="cell-input" placeholder="Ej: 01" value="${(r.identificacion||[]).join(', ')}"></td>
        <td><input class="cell-input" placeholder="Ej: 03,10" value="${(r.categoria||[]).join(', ')}"></td>
        <td><input class="cell-input" placeholder="Ej: 06" value="${(r.segmento||[]).join(', ')}"></td>
        <td class="cell-actions">
          <button class="btn small" data-act="up">↑</button>
          <button class="btn small" data-act="down">↓</button>
          <button class="btn small" data-act="del">🗑</button>
        </td>`;
      const inputs=tr.querySelectorAll('input');
      inputs[0].addEventListener('change',e=>{ r.order=Number(e.target.value||idx+1); });
      inputs[1].addEventListener('input',e=>{ r.name=e.target.value; });
      inputs[2].addEventListener('input',e=>{ r.banca=listFromStr(e.target.value); });
      inputs[3].addEventListener('input',e=>{ r.identificacion=listFromStr(e.target.value); });
      inputs[4].addEventListener('input',e=>{ r.categoria=listFromStr(e.target.value); });
      inputs[5].addEventListener('input',e=>{ r.segmento=listFromStr(e.target.value); });
      tr.querySelector('[data-act="up"]').addEventListener('click',()=>{ if(idx===0)return; const tmp=sorted[idx-1].order; sorted[idx-1].order=r.order; r.order=tmp??idx; render(); });
      tr.querySelector('[data-act="down"]').addEventListener('click',()=>{ if(idx===sorted.length-1)return; const tmp=sorted[idx+1].order; sorted[idx+1].order=r.order; r.order=tmp??(idx+2); render(); });
      tr.querySelector('[data-act="del"]').addEventListener('click',()=>{ RULES = RULES.filter(x=>x!==r); render(); });
    }
    tbody.appendChild(tr);
  });
}

async function loadRules(){
  const res = await fetch('/.netlify/functions/rules');
  const data = await res.json();
  RULES = Array.isArray(data.rules) ? data.rules : [];
  render();
}

async function saveRules(){
  const res = await fetch('/.netlify/functions/rules', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rules: RULES }, null, 2)
  });
  if(!res.ok){
    const t = await res.text();
    alert('Error guardando reglas: ' + t);
    return;
  }
  EDIT_MODE=false;
  SNAPSHOT=null;
  await loadRules();
  alert('¡Reglas guardadas!');
}

document.addEventListener('DOMContentLoaded', ()=>{
  loadRules().catch(e=>{ console.error(e); alert('No se pudieron cargar las reglas.'); });

  document.getElementById('toggleEdit').addEventListener('click', ()=>{
    EDIT_MODE = true;
    SNAPSHOT = JSON.parse(JSON.stringify(RULES)); // copia para cancelar
    render();
  });

  document.getElementById('cancelEdit').addEventListener('click', ()=>{
    if(SNAPSHOT) RULES = SNAPSHOT;
    EDIT_MODE = false;
    SNAPSHOT = null;
    render();
  });

  document.getElementById('addRule').addEventListener('click', ()=>{
    const next=(RULES.length?Math.max(...RULES.map(r=>r.order||0))+1:1);
    RULES.push({order:next,name:'Nueva regla',banca:[],identificacion:[],categoria:[],segmento:[]});
    render();
  });

  document.getElementById('saveRules').addEventListener('click', saveRules);

  // Simulador
  document.getElementById('simForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const input = {
      banca: document.getElementById('banca').value,
      identificacion: document.getElementById('identificacion').value,
      categoria: document.getElementById('categoria').value,
      segmento: document.getElementById('segmento').value,
    };
    const tipo = classifyOne(input, RULES);
    const out = document.getElementById('result');
    out.hidden = false;
    out.className = 'result ' + (tipo === 'Sin coincidencias' ? 'err' : 'ok');
    out.textContent = tipo;
  });
});
