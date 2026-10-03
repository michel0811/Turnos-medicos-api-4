import { app } from './app.ts';
import { loadData } from './models/store.ts';
const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT debe ser un entero entre 1 y 65535');
await loadData();
app.listen(port,process.env.HOST ?? '127.0.0.1',() => console.log(`TurnosRed disponible en http://${process.env.HOST ?? '127.0.0.1'}:${port}`));
