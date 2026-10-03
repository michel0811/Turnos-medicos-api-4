# Propuesta del módulo de pacientes y turnos

Daniel Oscar Michel · Integraciones Web · Actividad 4

## Propósito y alcance

El frontend necesita registrar a un paciente y asignarle un turno sin volver a escribir sus datos personales en cada reserva. Se propone separar la identidad del paciente de los datos de agenda. Se entrega un mockup funcional REST en memoria con dos operaciones nuevas. Continúa la arquitectura de API3; no representa un sistema clínico listo para producción.

Los requisitos de datos son decisiones de diseño para este ejercicio, basadas en la consigna. No se presentan como exigencias legales o médicas. Todos los ejemplos son ficticios.

## Modelo de paciente

| Campo | Tipo | Obligatorio | Decisión de diseño |
|---|---|---|---|
| pacienteId | string UUID | Generado | Identificador interno independiente del DNI |
| documento | string | Sí | DNI argentino simplificado de 7 u 8 dígitos sin puntos; conserva ceros iniciales |
| nombre | string | Sí | Texto no vacío de hasta 150 caracteres |
| apellido | string | Sí | Texto no vacío de hasta 150 caracteres |
| fechaNacimiento | string | Sí | Fecha real AAAA-MM-DD, no futura |
| email | string | Condicional | Formato email y hasta 254 caracteres |
| telefono | string | Condicional | Entre 7 y 25 caracteres; dígitos, espacios, paréntesis, guiones y + inicial |

Debe existir al menos un contacto: email o teléfono; se admiten ambos. El DNI es único en este mockup. El formato telefónico es una validación básica, no verifica la existencia de una línea. No se piden domicilio, diagnóstico ni historia clínica porque no son indispensables para demostrar el registro y la reserva. La cobertura médica podría agregarse cuando exista un requerimiento explícito.

```typescript
interface Patient {
  pacienteId: string;
  documento: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  email?: string;
  telefono?: string;
}

interface BookingInput {
  medicoId: string;
  especialidad: string;
  fecha: string;
  hora: string;
}

interface BookingResult extends BookingInput {
  turnoId: string;
  pacienteId: string;
  paciente: string;
  documento: string;
}
```

## Modelo de turno y relaciones

Un paciente puede reservar varios turnos. Cada reserva corresponde a un médico existente y a una especialidad del catálogo. Para reservar se necesitan el pacienteId en la URL y medicoId, especialidad, fecha y hora en el body. El turnoId se genera en el servidor; el nombre completo y documento se toman del paciente registrado. El frontend no puede enviar datos personales contradictorios en el cuerpo de esta operación.

Se reutilizan las reglas de agenda existentes: médico disponible, especialidad coincidente, días de lunes a viernes, horarios entre 07:00 y 12:30 cada 30 minutos y fecha hasta el 30 de diciembre del año de ejecución. Se admiten fechas pasadas como en API2 y API3. Se impide que el mismo paciente (por documento) o médico tenga dos turnos en la misma fecha y hora. Las fechas aceptan AAAA-MM-DD o DD/MM/AAAA y se normalizan a AAAA-MM-DD.

Compatibilidad: el almacén heredado conserva los campos paciente y documento. El endpoint nuevo devuelve también pacienteId, pero GET /turnos/:id mantiene la respuesta heredada sin pacienteId. Es una adaptación del mockup, no una relación persistente en base de datos. La evolución propuesta es almacenar pacienteId como clave foránea y consultar los datos del paciente mediante un repositorio. No se modifica el contrato anterior ni se duplica POST /turnos.

## Endpoint uno Registrar paciente

**POST /pacientes**. Content-Type application/json. Sin Params ni Query Params. Sin autenticación en este ejercicio.

```json
{
  "documento": "12345678",
  "nombre": "Ana",
  "apellido": "Pérez",
  "fechaNacimiento": "1995-06-15",
  "email": "ana@example.com",
  "telefono": "+54 11 5555 0101"
}
```

Respuesta ilustrativa 201 Created:

```json
{
  "pacienteId": "123e4567-e89b-42d3-a456-426614174000",
  "documento": "12345678",
  "nombre": "Ana",
  "apellido": "Pérez",
  "fechaNacimiento": "1995-06-15",
  "email": "ana@example.com",
  "telefono": "+54 11 5555 0101"
}
```

400 VALIDATION_ERROR: datos inválidos, contacto ausente, fecha imposible/futura o campos extra. 409 PATIENT_CONFLICT: DNI ya registrado. 500 INTERNAL_ERROR: fallo inesperado sin detalles internos. Se devuelve el objeto creado directamente; este alcance no incluye GET /pacientes/:id ni CRUD completo de pacientes.

## Endpoint dos Asignar turno a un paciente

**POST /pacientes/:id/turnos**. `id` obligatorio, UUID obtenido al registrar el paciente. Sin Query Params. Content-Type application/json.

```json
{
  "medicoId": "123e4567-e89b-42d3-a456-426614174001",
  "especialidad": "Pediatría",
  "fecha": "2026-10-05",
  "hora": "08:00"
}
```

Usar un medicoId real devuelto por la API, no copiar el UUID ilustrativo. La fecha del ejemplo es válida para una ejecución en 2026; la colección calcula otra fecha de prueba dentro del año automáticamente.

Respuesta ilustrativa 201 Created, con Location: /turnos/123e4567-e89b-42d3-a456-426614174002:

```json
{
  "pacienteId": "123e4567-e89b-42d3-a456-426614174000",
  "turnoId": "123e4567-e89b-42d3-a456-426614174002",
  "paciente": "Ana Pérez",
  "documento": "12345678",
  "medicoId": "123e4567-e89b-42d3-a456-426614174001",
  "especialidad": "Pediatría",
  "fecha": "2026-10-05",
  "hora": "08:00"
}
```

400: validación de formato o agenda (VALIDATION_ERROR, INVALID_SCHEDULE, SCHEDULE_CONFLICT, DOCTOR_UNAVAILABLE, SPECIALTY_MISMATCH). 404: paciente o médico inexistente (PATIENT_NOT_FOUND o DOCTOR_NOT_FOUND). 500: error interno. Los conflictos de agenda conservan 400 por compatibilidad con API3; no se confunden con el 409 por DNI duplicado.

Formato común de error:

```json
{
  "status": 409,
  "message": "Ya existe un paciente con ese DNI",
  "code": "PATIENT_CONFLICT",
  "details": []
}
```

En errores Zod, details incluye los campos y mensajes de validación.

## Separación de responsabilidades

```text
HTTP -> patient.routes.ts -> patient.controller.ts
     -> patient.schema.ts para validar entrada
     -> patient.service.ts para registrar o reservar
     -> patient.store.ts para pacientes temporales
     -> appointment.service.ts para reglas de agenda y turnos
```

Las rutas solo conectan HTTP con controladores. Los controladores async validan antes de modificar datos, invocan servicios y responden con return. Los servicios concentran reglas de negocio. Los almacenes mantienen arrays en memoria. La separación facilita evolucionar hacia Clean Architecture, pero no se afirma independencia completa: los servicios todavía importan almacenes concretos. Una versión posterior debería inyectar interfaces de repositorio y separar los casos de uso de Express y la persistencia.

## Límites y relación con el módulo cuatro

El módulo teórico aporta el manejo uniforme de errores, validación y pruebas. Esta consigna no pide login, JWT, Nginx ni despliegue remoto. El mockup no tiene autenticación y escucha en localhost; debe usarse con datos ficticios. Antes de cualquier uso real se requerirían persistencia, autenticación, autorización, protección de datos y una estrategia de operación. Reiniciar elimina todos los pacientes y turnos del ejercicio.

## Verificación y evidencias

Las solicitudes 66 a 78 de TurnosMed API cubren el flujo nuevo y sus errores. Las anteriores verifican regresión. Para el PDF de evidencias se debe mostrar este documento renderizado, la variable baseUrl y peticiones exitosas en Postman, README renderizado en GitHub y estructura del repositorio con exclusiones de .gitignore. Seguir el tutorial incluido en la entrega.
