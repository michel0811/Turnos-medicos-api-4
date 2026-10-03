import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { app } from '../dist/app.js';
import { loadData, specialties, doctors } from '../dist/models/store.js';
import * as specialtyController from '../dist/controllers/specialty.controller.js';

test('Validación de los controladores precede a la mutación y conserva relaciones', async () => {
  await loadData();
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  async function request(path, method = 'GET', body) {
    const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, body: response.status === 204 ? null : await response.json() };
  }
  try {
    const original = JSON.stringify(specialties);
    for (const body of [null, [], {}, { nombreEspecialidad: '', activa: true }, { nombreEspecialidad: 'Prueba', activa: 'true' }, { nombreEspecialidad: 'Prueba', activa: true, extra: 1 }]) {
      assert.equal((await request('/especialidades', 'POST', body)).status, 400);
      assert.equal(JSON.stringify(specialties), original);
    }
    assert.equal((await request('/especialidades?activa=1')).status, 400);
    assert.equal((await request('/especialidades?nombre=NoExiste')).body.length, 0);
    const existing = specialties.find(s => doctors.some(d => d.especialidad === s.nombreEspecialidad));
    for (const method of ['PUT', 'DELETE']) {
      const result = await request(`/especialidades/${existing.especialidadId}`, method, method === 'PUT' ? { nombreEspecialidad: existing.nombreEspecialidad, activa: false } : undefined);
      assert.equal(result.status, 400);
      assert.equal(result.body.code, 'SPECIALTY_IN_USE');
      assert.equal(JSON.stringify(specialties), original);
    }
    const created = await request('/especialidades', 'POST', { nombreEspecialidad: 'Temporal', activa: true });
    assert.equal(created.status, 201);
    const id = created.body.especialidadId;
    assert.equal((await request(`/especialidades/${id}`, 'PUT', { nombreEspecialidad: 'Temporal', activa: false })).status, 200);
    assert.equal((await request('/profesionales', 'POST', { nombre: 'Prueba', especialidad: 'Temporal', disponible: true })).status, 400);
    assert.equal((await request(`/especialidades/${id}`, 'DELETE')).status, 204);
    assert.equal((await request(`/especialidades/${id}`, 'DELETE')).status, 404);
    assert.equal((await request('/')).status, 200);
    assert.equal((await request('/no-existe')).body.code, 'ROUTE_NOT_FOUND');
    assert.deepEqual((await request('/profesionales')).body, (await request('/medicos')).body);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('Fallo inesperado dentro del controlador responde 500 una sola vez', async () => {
  let responses = 0;
  let status;
  let payload;
  const req = { get query() { throw new Error('información interna que no debe salir'); } };
  const res = { status(value) { status = value; return this; }, json(value) { responses++; payload = value; return this; } };
  const returned = await specialtyController.list(req, res);
  assert.equal(returned, res);
  assert.equal(responses, 1);
  assert.equal(status, 500);
  assert.deepEqual(payload, { status: 500, message: 'Error interno del servidor', code: 'INTERNAL_ERROR', details: [] });
});
