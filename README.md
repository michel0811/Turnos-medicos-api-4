# TurnosMed API 4 de Integraciones Web

Daniel Oscar Michel · Versión 4.0.0 · 3 de octubre de 2026

Refactorización de la entrega API 2 (TurnosRed) con controladores asincrónicos, validación previa, manejo uniforme de errores y documentación. Conserva las rutas `/medicos` y `/turnos`, los 30 profesionales y las 22 especialidades de API 2. Agrega `/profesionales`, `/especialidades` y la bienvenida `/`.

## Inicio rápido

Requisitos: Node.js 24 LTS (24.12 o posterior de la rama 24) y npm.
Abrir una terminal en esta carpeta, junto a `package.json`:

```powershell
npm.cmd install
Copy-Item .env.example .env
npm.cmd run build
npm.cmd start
```

Consultar `http://127.0.0.1:3000/`. Detener con Ctrl+C. En macOS/Linux usar `npm` y `cp .env.example .env`.

Se conserva `pnpm-lock.yaml` de la base porque no cambiaron las dependencias. Instalación reproducible alternativa: `pnpm install --frozen-lockfile`, `pnpm run build`, `pnpm start`. Con npm, conservar el `package-lock.json` que genera la instalación.

| Comando | Resultado |
|---|---|
| `npm.cmd run dev` | Ejecuta TypeScript con recarga; no comprueba tipos. |
| `npm.cmd run build` | Comprueba tipos y genera `dist/`. |
| `npm.cmd test` | Compila y ejecuta las ocho pruebas complementarias. |
| `npm.cmd run test:postman` | Ejecuta 78 solicitudes con Newman; compilar antes. |

`test:postman` inicia su propio servidor temporal en un puerto libre, carga los JSON y lo cierra al finalizar. No depende del servidor de desarrollo. El runner genera `reports/newman-results.json`. Cada ejecución empieza desde los datos originales. La colección requiere ejecutarse una sola vez y completa desde un estado inicial; ante una interrupción, reiniciar el servidor antes de volver a correrla.

## Alcance de esta entrega

Continúa API 3 y agrega un mockup funcional en memoria con POST /pacientes y POST /pacientes/:id/turnos. El diseño completo está en [pacientes-turnos.md](pacientes-turnos.md). No se agrega una base de datos ni se exige despliegue remoto. Pacientes y turnos nuevos se pierden al reiniciar.

## Rutas

| Recurso | Métodos y ruta | Contrato |
|---|---|---|
| Bienvenida | GET `/` | 200 y mensaje Hello World. |
| Profesionales | GET/POST `/profesionales`; GET/PUT/DELETE `/profesionales/:id` | Mismos datos y campos que médicos. |
| Especialidades | GET/POST `/especialidades`; GET/PUT/DELETE `/especialidades/:id` | Catálogo editable con integridad referencial. |
| Médicos | GET/POST `/medicos`; GET/PUT/DELETE `/medicos/:id` | Compatible con API 2. |
| Turnos | GET/POST `/turnos`; GET/PUT/DELETE `/turnos/:id` | Compatible con API 2. |
| Ruta no reconocida | Cualquier ruta sin handler | 404 mediante el controlador general. |

GET y PUT: 200. POST: 201 con `Location`. DELETE: 204 sin cuerpo (no se envía JSON con 204). Validación: 400. ID bien formado inexistente: 404. Fallo inesperado: 500. Un listado sin coincidencias devuelve 200 y `[]`.

## Cuerpos y filtros

Profesional/médico: `nombre` (string), `especialidad` (nombre exacto de una especialidad activa) y `disponible` (booleano), todos obligatorios. El servidor genera `medicoId` UUID; `/profesionales` conserva ese nombre para no romper el contrato heredado. Filtros: `especialidad` y `disponible=true|false`.

```json
{"nombre":"Profesional de prueba","especialidad":"Pediatría","disponible":true}
```

Especialidad: `nombreEspecialidad` (string no vacío) y `activa` (booleano), ambos obligatorios. El servidor genera `especialidadId` UUID. Filtros: `nombre` y `activa=true|false`.

```json
{"nombreEspecialidad":"Especialidad de prueba","activa":true}
```

No se duplican nombres de especialidades aunque cambien mayúsculas o tildes. No se permite borrar, renombrar ni desactivar una especialidad vinculada a profesionales o turnos. Primero deben resolverse sus relaciones. Los PUT son reemplazos completos; se rechazan campos extra, IDs inválidos, valores de tipo incorrecto y parámetros de consulta repetidos. Los filtros por nombre toleran mayúsculas/minúsculas y ausencia de tildes.

Turno: `paciente`, `documento`, `medicoId`, `especialidad`, `fecha` y `hora`, todos strings obligatorios. `documento` conserva letras, puntos y ceros iniciales. Fecha acepta `AAAA-MM-DD` o `DD/MM/AAAA` y se devuelve `AAAA-MM-DD`. Hora: `HH:MM`. Filtros: `especialidad`, `fecha`, `medicoId`; se combinan con AND. Agenda de lunes a viernes, de 07:00 a 12:30 cada 30 minutos, hasta el 30 de diciembre del año de ejecución. Se permiten fechas pasadas como en API 2. No se permite superponer un médico o paciente en la misma fecha/hora, reservar con un médico no disponible o con una especialidad distinta.

## Arquitectura

```text
Solicitud HTTP
  -> rutas (asocian método y controlador)
  -> controlador async (valida, espera servicio, decide estado y responde)
  -> servicio (reglas de negocio)
  -> arrays en memoria (cargados de src/data/*.json)

Error de validación o negocio -> catch del controlador -> JSON uniforme
JSON mal formado o cuerpo >100 KB -> middleware de errores -> JSON uniforme
Ruta desconocida -> general.controller.notFound -> 404
```

Cada método exportado de `src/controllers/` es `async`, contiene `try/catch`, usa una variable local `status` y termina cada respuesta con `return res.status(status)...`. Las validaciones se ejecutan antes de consultas o mutaciones. `parse` lanza `new AppError(...)`, una subclase de `Error`; los servicios también lanzan errores de dominio. El catch transforma esos errores en la respuesta pactada. Los errores inesperados generan 500 y ocultan los detalles internos al cliente. Se usa `await` al invocar los servicios para aceptar luego implementaciones asincrónicas; hoy los servicios trabajan con arrays y no simulan una base de datos.

La separación implementa la etapa de controladores que pide la actividad. No se afirma que sea una Clean Architecture completa: servicios todavía dependen del almacén concreto. `documentation/arquitectura.md` describe el alcance y la evolución posible.

```json
{"status":404,"message":"Ruta no encontrada","code":"ROUTE_NOT_FOUND","details":[]}
```

## Postman y evidencias

Importar `turnos-med.postman_collection.json` y `turnos-med.postman_environment.json`. Elegir **TurnosMed API4 Local**, comprobar `baseUrl=http://127.0.0.1:3000` y ejecutar la colección en orden con Collection Runner. Los IDs se capturan automáticamente. Autorización: No Auth; no se requiere token.

## Documentación incluida

- `documentation/openapi.json`: contrato OpenAPI 3.0.3 de las rutas.
- `documentation/arquitectura.md`: flujo, límites y diagrama Mermaid.
- `documentation/ADR-001-controladores.md`: decisión y consecuencias.
- `CHANGELOG.md`: cambios respecto de API 2.
- `documentation/contrato-heredado-api2.md`: referencia histórica, no guía principal de esta versión.
- `turnos-red.postman_collection.json`: colección API 2 conservada para regresión.

## Entorno y datos

PORT=3000 y HOST=127.0.0.1 por defecto. Solo escucha local. Los cambios duran mientras vive el proceso; al reiniciar se restauran los JSON y se vacían los turnos. Conservar `src/data/` junto a `dist/`. No incluye base de datos ni autenticación. Los datos son ficticios. No subir `.env`, `node_modules/` o credenciales a GitHub.


## Contrato detallado de cada endpoint

Content-Type: application/json para POST y PUT. No se requiere autenticación. Los parámetros no indicados no forman parte del contrato. POST y PUT rechazan campos extra. No enviar Body en GET o DELETE. Las estructuras nombradas se definen completas más abajo.

### GET /

Bienvenida. 

Params: ninguno

Query Params: ninguno

Body JSON: ninguno.

- **200**: Bienvenida Estructura: `Welcome`.
- **500**: Error interno, sin detalles privados. Estructura: `Error`.

### GET /medicos

Listar medicos. Filtros textuales toleran mayúsculas y ausencia de tildes. Sin resultados: 200 y []. Parámetros desconocidos o repetidos: 400.

Params: ninguno

Query Params: `especialidad` (string, opcional): No repetir este parámetro. Los filtros se combinan con AND.; `disponible` (string, opcional): No repetir este parámetro. Los filtros se combinan con AND.

Body JSON: ninguno.

- **200**: Listado Estructura: `array de Doctor`.
- **400**: Validación, duplicado o relación de negocio inválida. Estructura: `Error`.
- **500**: Error interno, sin detalles privados. Estructura: `Error`.

### POST /medicos

Crear medicos. 

Params: ninguno

Query Params: ninguno

Body JSON: `DoctorInput`, obligatorio.

- **201**: Recurso creado Estructura: `Doctor`.
- **400**: Validación, duplicado o relación de negocio inválida. Estructura: `Error`.
- **500**: Error interno, sin detalles privados. Estructura: `Error`.

### GET /medicos/{id}

Consultar por UUID. 

Params: `id` (string, obligatorio): UUID; formato inválido produce 400, UUID inexistente produce 404.

Query Params: ninguno

Body JSON: ninguno.

- **200**: Recurso Estructura: `Doctor`.
- **400**: Validación, duplicado o relación de negocio inválida. Estructura: `Error`.
- **404**: Recurso inexistente. Estructura: `Error`.
- **500**: Error interno, sin detalles privados. Estructura: `Error`.

### PUT /medicos/{id}

Reemplazar todos los campos editables. 

Params: `id` (string, obligatorio): UUID; formato inválido produce 400, UUID inexistente produce 404.

Query Params: ninguno

Body JSON: `DoctorInput`, obligatorio.

- **200**: Recurso actualizado Estructura: `Doctor`.
- **400**: Validación, duplicado o relación de negocio inválida. Estructura: `Error`.
- **404**: Recurso inexistente. Estructura: `Error`.
- **500**: Error interno, sin detalles privados. Estructura: `Error`.

### DELETE /medicos/{id}

Eliminar recurso. No permite borrar un médico con turnos ni una especialidad vinculada.

Params: `id` (string, obligatorio): UUID; formato inválido produce 400, UUID inexistente produce 404.

Query Params: ninguno

Body JSON: ninguno.

- **204**: Eliminado; sin cuerpo. Estructura: `sin cuerpo`.
- **400**: Validación, duplicado o relación de negocio inválida. Estructura: `Error`.
- **404**: Recurso inexistente. Estructura: `Error`.
- **500**: Error interno, sin detalles privados. Estructura: `Error`.

### GET /profesionales

Listar profesionales. Filtros textuales toleran mayúsculas y ausencia de tildes. Sin resultados: 200 y []. Parámetros desconocidos o repetidos: 400.

Params: ninguno

Query Params: `especialidad` (string, opcional): No repetir este parámetro. Los filtros se combinan con AND.; `disponible` (string, opcional): No repetir este parámetro. Los filtros se combinan con AND.

Body JSON: ninguno.

- **200**: Listado Estructura: `array de Doctor`.
- **400**: Validación, duplicado o relación de negocio inválida. Estructura: `Error`.
- **500**: Error interno, sin detalles privados. Estructura: `Error`.

### POST /profesionales

Crear profesionales. 

Params: ninguno

Query Params: ninguno

Body JSON: `DoctorInput`, obligatorio.

- **201**: Recurso creado Estructura: `Doctor`.
- **400**: Validación, duplicado o relación de negocio inválida. Estructura: `Error`.
- **500**: Error interno, sin detalles privados. Estructura: `Error`.

### GET /profesionales/{id}

Consultar por UUID. 

Params: `id` (string, obligatorio): UUID; formato inválido produce 400, UUID inexistente produce 404.

Query Params: ninguno

Body JSON: ninguno.

- **200**: Recurso Estructura: `Doctor`.
- **400**: Validación, duplicado o relación de negocio inválida. Estructura: `Error`.
- **404**: Recurso inexistente. Estructura: `Error`.
- **500**: Error interno, sin detalles privados. Estructura: `Error`.

### PUT /profesionales/{id}

Reemplazar todos los campos editables. 

Params: `id` (string, obligatorio): UUID; formato inválido produce 400, UUID inexistente produce 404.

Query Params: ninguno

Body JSON: `DoctorInput`, obligatorio.

- **200**: Recurso actualizado Estructura: `Doctor`.
- **400**: Validación, duplicado o relación de negocio inválida. Estructura: `Error`.
- **404**: Recurso inexistente. Estructura: `Error`.
- **500**: Error interno, sin detalles privados. Estructura: `Error`.

### DELETE /profesionales/{id}

Eliminar recurso. No permite borrar un médico con turnos ni una especialidad vinculada.

Params: `id` (string, obligatorio): UUID; formato inválido produce 400, UUID inexistente produce 404.

Query Params: ninguno

Body JSON: ninguno.

- **204**: Eliminado; sin cuerpo. Estructura: `sin cuerpo`.
- **400**: Validación, duplicado o relación de negocio inválida. Estructura: `Error`.
- **404**: Recurso inexistente. Estructura: `Error`.
- **500**: Error interno, sin detalles privados. Estructura: `Error`.

### GET /especialidades

Listar especialidades. Filtros textuales toleran mayúsculas y ausencia de tildes. Sin resultados: 200 y []. Parámetros desconocidos o repetidos: 400.

Params: ninguno

Query Params: `nombre` (string, opcional): No repetir este parámetro. Los filtros se combinan con AND.; `activa` (string, opcional): No repetir este parámetro. Los filtros se combinan con AND.

Body JSON: ninguno.

- **200**: Listado Estructura: `array de Specialty`.
- **400**: Validación, duplicado o relación de negocio inválida. Estructura: `Error`.
- **500**: Error interno, sin detalles privados. Estructura: `Error`.

### POST /especialidades

Crear especialidades. 

Params: ninguno

Query Params: ninguno

Body JSON: `SpecialtyInput`, obligatorio.

- **201**: Recurso creado Estructura: `Specialty`.
- **400**: Validación, duplicado o relación de negocio inválida. Estructura: `Error`.
- **500**: Error interno, sin detalles privados. Estructura: `Error`.

### GET /especialidades/{id}

Consultar por UUID. 

Params: `id` (string, obligatorio): UUID; formato inválido produce 400, UUID inexistente produce 404.

Query Params: ninguno

Body JSON: ninguno.

- **200**: Recurso Estructura: `Specialty`.
- **400**: Validación, duplicado o relación de negocio inválida. Estructura: `Error`.
- **404**: Recurso inexistente. Estructura: `Error`.
- **500**: Error interno, sin detalles privados. Estructura: `Error`.

### PUT /especialidades/{id}

Reemplazar todos los campos editables. 

Params: `id` (string, obligatorio): UUID; formato inválido produce 400, UUID inexistente produce 404.

Query Params: ninguno

Body JSON: `SpecialtyInput`, obligatorio.

- **200**: Recurso actualizado Estructura: `Specialty`.
- **400**: Validación, duplicado o relación de negocio inválida. Estructura: `Error`.
- **404**: Recurso inexistente. Estructura: `Error`.
- **500**: Error interno, sin detalles privados. Estructura: `Error`.

### DELETE /especialidades/{id}

Eliminar recurso. No permite borrar un médico con turnos ni una especialidad vinculada.

Params: `id` (string, obligatorio): UUID; formato inválido produce 400, UUID inexistente produce 404.

Query Params: ninguno

Body JSON: ninguno.

- **204**: Eliminado; sin cuerpo. Estructura: `sin cuerpo`.
- **400**: Validación, duplicado o relación de negocio inválida. Estructura: `Error`.
- **404**: Recurso inexistente. Estructura: `Error`.
- **500**: Error interno, sin detalles privados. Estructura: `Error`.

### GET /turnos

Listar turnos. Filtros textuales toleran mayúsculas y ausencia de tildes. Sin resultados: 200 y []. Parámetros desconocidos o repetidos: 400.

Params: ninguno

Query Params: `especialidad` (string, opcional): No repetir este parámetro. Los filtros se combinan con AND.; `fecha` (string, opcional): No repetir este parámetro. Los filtros se combinan con AND.; `medicoId` (string, opcional): No repetir este parámetro. Los filtros se combinan con AND.

Body JSON: ninguno.

- **200**: Listado Estructura: `array de Appointment`.
- **400**: Validación, duplicado o relación de negocio inválida. Estructura: `Error`.
- **500**: Error interno, sin detalles privados. Estructura: `Error`.

### POST /turnos

Crear turnos. 

Params: ninguno

Query Params: ninguno

Body JSON: `AppointmentInput`, obligatorio.

- **201**: Recurso creado Estructura: `Appointment`.
- **400**: Validación, duplicado o relación de negocio inválida. Estructura: `Error`.
- **500**: Error interno, sin detalles privados. Estructura: `Error`.

- **404**: médico inexistente. Estructura: `Error`.

### GET /turnos/{id}

Consultar por UUID. 

Params: `id` (string, obligatorio): UUID; formato inválido produce 400, UUID inexistente produce 404.

Query Params: ninguno

Body JSON: ninguno.

- **200**: Recurso Estructura: `Appointment`.
- **400**: Validación, duplicado o relación de negocio inválida. Estructura: `Error`.
- **404**: Recurso inexistente. Estructura: `Error`.
- **500**: Error interno, sin detalles privados. Estructura: `Error`.

### PUT /turnos/{id}

Reemplazar todos los campos editables. 

Params: `id` (string, obligatorio): UUID; formato inválido produce 400, UUID inexistente produce 404.

Query Params: ninguno

Body JSON: `AppointmentInput`, obligatorio.

- **200**: Recurso actualizado Estructura: `Appointment`.
- **400**: Validación, duplicado o relación de negocio inválida. Estructura: `Error`.
- **404**: Recurso inexistente. Estructura: `Error`.
- **500**: Error interno, sin detalles privados. Estructura: `Error`.

### DELETE /turnos/{id}

Eliminar recurso. No permite borrar un médico con turnos ni una especialidad vinculada.

Params: `id` (string, obligatorio): UUID; formato inválido produce 400, UUID inexistente produce 404.

Query Params: ninguno

Body JSON: ninguno.

- **204**: Eliminado; sin cuerpo. Estructura: `sin cuerpo`.
- **400**: Validación, duplicado o relación de negocio inválida. Estructura: `Error`.
- **404**: Recurso inexistente. Estructura: `Error`.
- **500**: Error interno, sin detalles privados. Estructura: `Error`.

### POST /pacientes

Registrar paciente. 

Params: ninguno

Query Params: ninguno

Body JSON: `PatientInput`, obligatorio.

- **201**: Creado Estructura: `Patient`.
- **400**: Error controlado Estructura: `Error`.
- **409**: Error controlado Estructura: `Error`.
- **500**: Error interno Estructura: `Error`.

### POST /pacientes/{id}/turnos

Asignar turno a paciente registrado. 

Params: `id` (string, obligatorio): UUID del paciente.

Query Params: ninguno

Body JSON: `BookingInput`, obligatorio.

- **201**: Creado Estructura: `Booking`.
- **400**: Error controlado Estructura: `Error`.
- **404**: Error controlado Estructura: `Error`.
- **500**: Error interno Estructura: `Error`.

## Estructuras JSON del contrato

Los esquemas siguientes especifican campos, tipos y obligatoriedad. En ejemplos, los UUID deben sustituirse por identificadores reales de la ejecución.

### DoctorInput

```json
{
  "type": "object",
  "required": [
    "nombre",
    "especialidad",
    "disponible"
  ],
  "additionalProperties": false,
  "properties": {
    "nombre": {
      "type": "string",
      "minLength": 1,
      "maxLength": 150
    },
    "especialidad": {
      "type": "string",
      "minLength": 1,
      "maxLength": 150,
      "description": "Nombre exacto de una especialidad activa del catálogo."
    },
    "disponible": {
      "type": "boolean"
    }
  }
}
```

### SpecialtyInput

```json
{
  "type": "object",
  "required": [
    "nombreEspecialidad",
    "activa"
  ],
  "additionalProperties": false,
  "properties": {
    "nombreEspecialidad": {
      "type": "string",
      "minLength": 1,
      "maxLength": 150
    },
    "activa": {
      "type": "boolean"
    }
  }
}
```

### AppointmentInput

```json
{
  "type": "object",
  "required": [
    "paciente",
    "documento",
    "medicoId",
    "especialidad",
    "fecha",
    "hora"
  ],
  "additionalProperties": false,
  "properties": {
    "paciente": {
      "type": "string",
      "minLength": 1,
      "maxLength": 150
    },
    "documento": {
      "type": "string",
      "minLength": 1,
      "maxLength": 150
    },
    "medicoId": {
      "type": "string",
      "format": "uuid"
    },
    "especialidad": {
      "type": "string",
      "minLength": 1,
      "maxLength": 150,
      "description": "Debe coincidir con la especialidad del médico disponible."
    },
    "fecha": {
      "type": "string",
      "pattern": "^(\\d{4}-\\d{2}-\\d{2}|\\d{2}/\\d{2}/\\d{4})$",
      "description": "Fecha válida AAAA-MM-DD o DD/MM/AAAA; agenda de lunes a viernes hasta 30/12 del año actual."
    },
    "hora": {
      "type": "string",
      "pattern": "^(0[7-9]|1[0-2]):(00|30)$",
      "description": "Agenda de 07:00 a 12:30, cada 30 minutos."
    }
  }
}
```

### Doctor

```json
{
  "type": "object",
  "required": [
    "medicoId",
    "nombre",
    "especialidad",
    "disponible"
  ],
  "additionalProperties": false,
  "properties": {
    "medicoId": {
      "type": "string",
      "format": "uuid"
    },
    "nombre": {
      "type": "string",
      "minLength": 1,
      "maxLength": 150
    },
    "especialidad": {
      "type": "string",
      "minLength": 1,
      "maxLength": 150,
      "description": "Nombre exacto de una especialidad activa del catálogo."
    },
    "disponible": {
      "type": "boolean"
    }
  }
}
```

### Specialty

```json
{
  "type": "object",
  "required": [
    "especialidadId",
    "nombreEspecialidad",
    "activa"
  ],
  "additionalProperties": false,
  "properties": {
    "especialidadId": {
      "type": "string",
      "format": "uuid"
    },
    "nombreEspecialidad": {
      "type": "string",
      "minLength": 1,
      "maxLength": 150
    },
    "activa": {
      "type": "boolean"
    }
  }
}
```

### Appointment

```json
{
  "type": "object",
  "required": [
    "turnoId",
    "paciente",
    "documento",
    "medicoId",
    "especialidad",
    "fecha",
    "hora"
  ],
  "additionalProperties": false,
  "properties": {
    "turnoId": {
      "type": "string",
      "format": "uuid"
    },
    "paciente": {
      "type": "string",
      "minLength": 1,
      "maxLength": 150
    },
    "documento": {
      "type": "string",
      "minLength": 1,
      "maxLength": 150
    },
    "medicoId": {
      "type": "string",
      "format": "uuid"
    },
    "especialidad": {
      "type": "string",
      "minLength": 1,
      "maxLength": 150,
      "description": "Debe coincidir con la especialidad del médico disponible."
    },
    "fecha": {
      "type": "string",
      "format": "date",
      "description": "Siempre AAAA-MM-DD en la respuesta."
    },
    "hora": {
      "type": "string",
      "pattern": "^(0[7-9]|1[0-2]):(00|30)$",
      "description": "Agenda de 07:00 a 12:30, cada 30 minutos."
    }
  }
}
```

### Error

```json
{
  "type": "object",
  "required": [
    "status",
    "message",
    "code",
    "details"
  ],
  "additionalProperties": false,
  "properties": {
    "status": {
      "type": "integer"
    },
    "message": {
      "type": "string"
    },
    "code": {
      "type": "string"
    },
    "details": {
      "type": "array",
      "items": {
        "type": "object"
      }
    }
  }
}
```

### Welcome

```json
{
  "type": "object",
  "required": [
    "message",
    "version"
  ],
  "additionalProperties": false,
  "properties": {
    "message": {
      "type": "string"
    },
    "version": {
      "type": "string"
    }
  }
}
```

### PatientInput

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": [
    "documento",
    "nombre",
    "apellido",
    "fechaNacimiento"
  ],
  "anyOf": [
    {
      "required": [
        "email"
      ]
    },
    {
      "required": [
        "telefono"
      ]
    }
  ],
  "properties": {
    "documento": {
      "type": "string",
      "pattern": "^[0-9]{7,8}$"
    },
    "nombre": {
      "type": "string",
      "minLength": 1,
      "maxLength": 150
    },
    "apellido": {
      "type": "string",
      "minLength": 1,
      "maxLength": 150
    },
    "fechaNacimiento": {
      "type": "string",
      "format": "date",
      "description": "Fecha real no futura"
    },
    "email": {
      "type": "string",
      "format": "email",
      "maxLength": 254
    },
    "telefono": {
      "type": "string",
      "pattern": "^\\+?[0-9 ()-]{7,25}$"
    }
  }
}
```

### Patient

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": [
    "documento",
    "nombre",
    "apellido",
    "fechaNacimiento",
    "pacienteId"
  ],
  "anyOf": [
    {
      "required": [
        "email"
      ]
    },
    {
      "required": [
        "telefono"
      ]
    }
  ],
  "properties": {
    "documento": {
      "type": "string",
      "pattern": "^[0-9]{7,8}$"
    },
    "nombre": {
      "type": "string",
      "minLength": 1,
      "maxLength": 150
    },
    "apellido": {
      "type": "string",
      "minLength": 1,
      "maxLength": 150
    },
    "fechaNacimiento": {
      "type": "string",
      "format": "date",
      "description": "Fecha real no futura"
    },
    "email": {
      "type": "string",
      "format": "email",
      "maxLength": 254
    },
    "telefono": {
      "type": "string",
      "pattern": "^\\+?[0-9 ()-]{7,25}$"
    },
    "pacienteId": {
      "type": "string",
      "format": "uuid"
    }
  }
}
```

### BookingInput

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": [
    "medicoId",
    "especialidad",
    "fecha",
    "hora"
  ],
  "properties": {
    "medicoId": {
      "type": "string",
      "format": "uuid"
    },
    "especialidad": {
      "type": "string",
      "minLength": 1,
      "maxLength": 150,
      "description": "Debe coincidir con la especialidad del médico disponible."
    },
    "fecha": {
      "type": "string",
      "pattern": "^(\\d{4}-\\d{2}-\\d{2}|\\d{2}/\\d{2}/\\d{4})$",
      "description": "Fecha válida AAAA-MM-DD o DD/MM/AAAA; agenda de lunes a viernes hasta 30/12 del año actual."
    },
    "hora": {
      "type": "string",
      "pattern": "^(0[7-9]|1[0-2]):(00|30)$",
      "description": "Agenda de 07:00 a 12:30, cada 30 minutos."
    }
  }
}
```

### Booking

```json
{
  "type": "object",
  "properties": {
    "paciente": {
      "type": "string",
      "minLength": 1,
      "maxLength": 150
    },
    "documento": {
      "type": "string",
      "minLength": 1,
      "maxLength": 150
    },
    "medicoId": {
      "type": "string",
      "format": "uuid"
    },
    "especialidad": {
      "type": "string",
      "minLength": 1,
      "maxLength": 150,
      "description": "Debe coincidir con la especialidad del médico disponible."
    },
    "fecha": {
      "type": "string",
      "pattern": "^(\\d{4}-\\d{2}-\\d{2}|\\d{2}/\\d{2}/\\d{4})$",
      "description": "Fecha válida AAAA-MM-DD o DD/MM/AAAA; agenda de lunes a viernes hasta 30/12 del año actual."
    },
    "hora": {
      "type": "string",
      "pattern": "^(0[7-9]|1[0-2]):(00|30)$",
      "description": "Agenda de 07:00 a 12:30, cada 30 minutos."
    },
    "turnoId": {
      "type": "string",
      "format": "uuid"
    },
    "pacienteId": {
      "type": "string",
      "format": "uuid"
    }
  },
  "required": [
    "paciente",
    "documento",
    "medicoId",
    "especialidad",
    "fecha",
    "hora",
    "turnoId",
    "pacienteId"
  ]
}
```

## Variables de entorno y Postman

| Variable | Valor o uso |
|---|---|
| PORT | 3000 por defecto |
| HOST | 127.0.0.1 por defecto |
| baseUrl | http://127.0.0.1:3000 en TurnosMed API4 Local |
| pacienteId medicoApi4 turnoApi4 | IDs capturados por los tests de API4 |
| fecha fechaLocal y otros IDs | Variables dinámicas heredadas para pruebas |

La colección principal tiene todas sus peticiones con `{{baseUrl}}`. Seleccionar el entorno antes de enviar. La prioridad del entorno puede sobreescribir una variable de colección del mismo nombre. No configurar dos valores diferentes. Autorización No Auth. No hay credenciales en la entrega.

## Carpetas y archivos

```text
src/routes       métodos HTTP y rutas
src/controllers  adaptación HTTP y respuestas async
src/services     reglas de negocio
src/schemas      validación Zod
src/models       almacenes en memoria y errores
src/data         JSON ficticios iniciales
tests            pruebas complementarias
scripts          ejecución de colección con Newman
documentation    contrato OpenAPI y documentación heredada
reports          evidencia técnica de pruebas
pacientes-turnos.md  diseño del nuevo módulo
```

## Ejemplos de uso del módulo nuevo

Registro: `POST {{baseUrl}}/pacientes`

```json
{"documento":"12345678","nombre":"Ana","apellido":"Pérez","fechaNacimiento":"1995-06-15","email":"ana@example.com"}
```

Respuesta 201: mismos campos más `pacienteId` generado. Guardar ese UUID.

Reserva: `POST {{baseUrl}}/pacientes/{{pacienteId}}/turnos`

```json
{"medicoId":"{{medicoApi4}}","especialidad":"Pediatría","fecha":"{{fecha}}","hora":"08:00"}
```

En Postman, los scripts de la colección establecen los valores entre llaves. Fuera de Postman deben sustituirse por el UUID real del médico y una fecha válida. La respuesta 201 incluye turnoId, pacienteId, paciente, documento, medicoId, especialidad, fecha y hora; Location permite consultar `/turnos/:id`.

Ejemplos completos y decisiones del modelo: [pacientes-turnos.md](pacientes-turnos.md). Resultados de la ejecución: [reports/resultado-api4.md](reports/resultado-api4.md).
