const { getStore } = require('@netlify/blobs');
const KEY = 'rules.json';
const seed = {
  rules: [
    { order:1, name:'Selecta Privado (id 5)', banca:[], identificacion:[], categoria:['03','10'], segmento:[] },
    { order:2, name:'NYP Selecta (id 7)', banca:[], identificacion:[], categoria:['01','09','22','29'], segmento:['06'] },
    { order:3, name:'Selecta (id 2)', banca:[], identificacion:[], categoria:['01','09','22'], segmento:[] },
    { order:4, name:'Empresas (id 3)', banca:['02','03','04'], identificacion:[], categoria:[], segmento:['03','05','06','07','08','09','10','11','12','13','14','15','16','34'] },
    { order:5, name:'Preferencial (id 9)', banca:[], identificacion:['01'], categoria:['07','21','26'], segmento:[] },
    { order:6, name:'Jubilados (id 4)', banca:[], identificacion:[], categoria:[], segmento:['02'] },
    { order:7, name:'Individuos (id 1)', banca:[], identificacion:['01'], categoria:[], segmento:['01','03','04','05','10','19'] },
    { order:8, name:'Empresa No cliente (id 8)', banca:['02','03','04'], identificacion:[], categoria:[], segmento:[] },
    { order:9, name:'No cliente (id 6)', banca:[], identificacion:[], categoria:[], segmento:[] }
  ]
};
function makeStore(){ const siteID = process.env.SITE_ID; const token = process.env.NETLIFY_API_TOKEN; return getStore({ name:'simulador-rules', siteID, token }); }
exports.handler = async (event) => {
  const store = makeStore();
  if (event.httpMethod === 'GET') {
    const json = await store.get(KEY, { type: 'json' });
    const data = json ?? seed;
    return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) };
  }
  if (event.httpMethod === 'PUT') {
    let body; try { body = JSON.parse(event.body || '{}'); } catch(e){ return { statusCode: 400, body: 'Invalid JSON' }; }
    if (!body || !Array.isArray(body.rules)) return { statusCode: 400, body: 'Invalid JSON: expected { rules: [...] }' };
    await store.set(KEY, JSON.stringify({ rules: body.rules }, null, 2));
    return { statusCode: 200, body: 'OK' };
  }
  return { statusCode: 405, body: 'Method not allowed' };
};
