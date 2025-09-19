// --- Clasificación ---
function norm(v){ if(v==null) return ""; let s=String(v).trim(); if(/^[0-9]+$/.test(s)&&s.length===1) s="0"+s; return s; }
function listFromStr(s){ s = (s??'').trim(); if(!s) return []; return s.split(',').map(x=>norm(x)); }
function matches(value, allowed){ if(!allowed || allowed.length===0) return true; const v=norm(value); return allowed.includes(v); }
function classifyOne(input, rules){
  for(const r of rules.sort((a,b)=>(a.order??999)-(b.order??999))){
    if(matches(input.banca,r.banca)&&matches(input.identificacion,r.identificacion)&&matches(input.categoria,r.categoria)&&matches(input.segmento,r.segmento)){
      return r.name;
    }
  }
  return "Sin coincidencias";
}

// --- Estado ---
let RULES = [];

// --- UI helpers ---
function renderTable(){
  const tbody = document.getElementById('rulesBody');
  tbody.innerHTML = "";
  RULES.sort((a,b)=>(a.order??999)-(b.order??999)).forEach((r, idx)=>{
    const tr = document.createElement('tr');
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
    // Wire inputs
    const inputs = tr.querySelectorAll('input');
    inputs[0].addEventListener('change', e=>{ r.order = Number(e.target.value||idx+1); });
    inputs[1].addEventListener('input', e=>{ r.name = e.target.value; });
    inputs[2].addEventListener('input', e=>{ r.banca = listFromStr(e.target.value); });
    inputs[3].addEventListener('input', e=>{ r.identificacion = listFromStr(e.target.value); });
    inputs[4].addEventListener('input', e=>{ r.categoria = listFromStr(e.target.value); });
    inputs[5].addEventListener('input', e=>{ r.segmento = listFromStr(e.target.value); });

    // Actions
    tr.querySelector('[data-act="up"]').addEventListener('click', ()=>{
      if(idx===0) return;
      const tmp = RULES[idx-1].order;
      RULES[idx-1].order = r.order;
      r.order = tmp ?? (idx);
      renderTable();
    });
    tr.querySelector('[data-act="down"]').addEventListener('click', ()=>{
      if(idx===RULES.length-1) return;
      const tmp = RULES[idx+1].order;
      RULES[idx+1].order = r.order;
      r.order = tmp ?? (idx+2);
      renderTable();
    });
    tr.querySelector('[data-act="del"]').addEventListener('click', ()=>{
      RULES.splice(idx,1);
      renderTable();
    });

    tbody.appendChild(tr);
  });
}

async function loadRules(){
  // Intenta leer desde función. Si no existe blob, la función retorna semilla por defecto.
  const res = await fetch('/.netlify/functions/rules');
  const data = await res.json();
  RULES = Array.isArray(data.rules) ? data.rules : [];
  renderTable();
}

async function saveRules(){
  const body = JSON.stringify({rules: RULES}, null, 2);
  const res = await fetch('/.netlify/functions/rules', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body
  });
  if(!res.ok){
    const txt = await res.text();
    alert('Error guardando reglas: ' + txt);
    return;
  }
  alert('¡Reglas guardadas! Se usarán de inmediato.');
}

document.addEventListener('DOMContentLoaded', ()=>{
  loadRules().catch(err=>{
    console.error(err);
    alert('No se pudieron cargar las reglas.');
  });

  document.getElementById('addRule').addEventListener('click', ()=>{
    const next = (RULES.length ? Math.max(...RULES.map(r=>r.order||0))+1 : 1);
    RULES.push({ order: next, name: 'Nueva regla', banca: [], identificacion: [], categoria: [], segmento: [] });
    renderTable();
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
