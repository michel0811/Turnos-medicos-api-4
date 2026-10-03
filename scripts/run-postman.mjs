import newman from 'newman';
import { readFile, mkdir } from 'node:fs/promises';
import { once } from 'node:events';
import { app } from '../dist/app.js';
import { loadData } from '../dist/models/store.js';
await loadData();
const server=app.listen(0,'127.0.0.1');
await once(server,'listening');
const collection=JSON.parse(await readFile(new URL('../turnos-med.postman_collection.json',import.meta.url)));
const environment=JSON.parse(await readFile(new URL('../turnos-med.postman_environment.json',import.meta.url)));
environment.values.find(v=>v.key==='baseUrl').value=`http://127.0.0.1:${server.address().port}`;
await mkdir('reports',{recursive:true});
try {
 await new Promise((resolve,reject)=>newman.run({collection,environment,reporters:['cli','json'],reporter:{json:{export:'reports/newman-results.json'}}},(error,summary)=>error?reject(error):summary.run.failures.length?reject(new Error(`${summary.run.failures.length} pruebas fallidas`)):resolve()));
} finally { server.close(); }
