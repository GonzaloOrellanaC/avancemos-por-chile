# Análisis: Sistema de Recepción de Proyectos de Ley

Fecha: 2026-05-12

Resumen
-------
Este documento presenta un análisis y recomendación para diseñar e implementar un sistema seguro y automatizado de recepción de proyectos de ley para la web existente. Prioridades: seguridad, resiliencia frente a cargas masivas, control de acceso a usuarios enrolados, filtrado y automatización del flujo de entrada, trazabilidad y facilidad de integración con la plataforma actual (Node/TypeScript).

Requisitos funcionales (resumidos)
- Recepción de propuestas (texto + adjuntos) desde usuarios enrolados.
- Flujo de enrolamiento verificado (registro, verificación por email, aprobación/roles).
- Interfaz administrativa para moderación y descarga de propuestas.
- Notificaciones (email/webhooks) y audit trail completo.

Requisitos no funcionales y de seguridad
- Autenticación y autorización robustas (MFA opcional, RBAC).
- Prevención de abuso: tasa por usuario, por IP, por origen.
- Manejo asíncrono de cargas y procesamiento de adjuntos.
- Escaneo de virus y validación de tipos/tamaños de archivos.
- Registro, monitoreo y alertas (integridad frente a picos).

Opciones de arquitectura evaluadas

1) Integración monolítica en el servidor actual
- Descripción: Añadir rutas en el servidor Node/Express existente, usar Redis/Bull para colas internas.
- Pros: Integración sencilla, reutiliza infra actual, menor latencia interna.
- Contras: Riesgo de afectar la aplicación principal si no se segrega correctamente; necesita medidas fuertes de throttling y aislamiento.

2) Microservicio de recepción (recomendado)
- Descripción: Servicio independiente (Node/TS) o serverless para intake, con cola (SQS/RabbitMQ/Redis) y workers separados para procesamiento.
- Pros: Aislado (fallos no afectan frontend), escalado independiente, más fácil de aplicar límites y protección perimetral.
- Contras: Mayor complejidad operacional, despliegue extra.

3) Solución SaaS/tercera parte (formularios gestionados)
- Descripción: Usar herramientas como Typeform/Forms + webhook a backend.
- Pros: Rápido de lanzar, escalado y DDoS mitigado por proveedor.
- Contras: Menos control, costes, restricciones legales sobre datos sensibles.

Recomendación
-------------
Adoptar la opción 2: un microservicio de recepción con las siguientes características:
- Endpoint de ingestión autenticado (solo usuarios enrolados).
- Cola asíncrona (Redis + BullMQ o SQS + Lambdas) para procesar entradas y adjuntos.
- Workers separados que realizan: validación, escaneo antivirus, conversión/preview, persistencia en almacenamiento protegido (S3 compatible) y notificación.
- Gateway / WAF y rate-limiting en el perímetro (Cloudflare/Azure Front Door) + límite adicional en aplicación.

Detalle de componentes y flujo
-----------------------------
1. Enrolamiento de usuarios
- Proceso: Registro → verificación por email → aprobación automática/administrativa según criterios → rol `enrolled`.
- Guardar metadata de dispositivo/IP y límites por usuario.

2. Ingestión (API)
- Endpoint protegido por JWT (short-lived) y refresh tokens; validar scopes.
- Validaciones: JSON schema, adjuntos permitidos (tipos y tamaño), fields obligatorios.
- Rechazo temprano con códigos claros (413/422/429).

3. Filtrado y anti-abuso
- Throttling: token-bucket por usuario y por IP (ej. 10 envíos/día por defecto). Implementar burst limitado.
- Circuit breaker: si se detecta ráfaga anómala, reducir velocidad global y activar challenge (MFA/2FA) o bloqueo temporal.
- CAPTCHA adaptativo o challenge para comportamientos sospechosos.
- Lista negra y reputación de IP, geo-fencing si aplica.

4. Cola y procesamiento asíncrono
- Ingesta pone mensaje mínimo en la cola (metadatos + referencia a archivo temporal).
- Worker realiza: escaneo antivirus (clamav o servicio comercial), extracción de texto, análisis de metadatos, generación de previews, guardar en S3 con URLs firmadas y marcar estado.

5. Almacenamiento
- Archivos en bucket privado (S3/Azure Blob) con cifrado at-rest y acceso mediante URLs firmadas.

6. Panel administrativo
- Moderación: listar, filtrar por riesgo, ver versiones, descargar original.
- Acciones: aprobar, rechazar, pedir más info, marcar como spam.

Medidas de seguridad concretas
- Perímetro: WAF, CDN, rate-limits globales y por ruta.
- App: `helmet`, CSP, `csurf` (si hay cookies), sanitización de input, validación estricta de schema.
- Auth: OAuth2/OpenID Connect o JWT con firma RS256; rotación de claves y revocación.
- Archivo: límites de tamaño, escaneo antivirus, sandboxing de conversión de documentos.
- Logging y trazabilidad: request-id, correlation-id, logs inmutables (retención configurable).
- Monitoreo: métricas (rate, latencia, errores), alertas en umbrales, dashboards (Prometheus/Grafana, Cloud provider tools).

Estrategias anti-carga masiva y filtrado
- Defensa en profundidad: WAF + rate-limits per-IP + per-user + per-endpoint.
- Colas bufferizadas: picos absorbidos por SQS/Redis; workers escalables por demanda.
- Rejection-first: validar y rechazar tramas maliciosas en el edge.
- Quotas adaptativas: si uso excesivo, bajar quota programáticamente y notificar.
- Back-pressure visible: el API debe devolver estado de procesamiento (accepted + jobId), no esperar sync para trabajo pesado.

Integración con la plataforma actual
- Mantener APIs REST/GraphQL compatibles; el microservicio puede exponer eventos (webhooks) o publicar en bus (Kafka/RabbitMQ) al backend principal.
- Reutilizar sistema de usuarios existente para enrolamiento y roles; si no existe, integrar con Identity Provider.

Stack tecnológico sugerido (ejemplos)
- Intake API: Node.js + TypeScript + Fastify/Express
- Queue: Redis + BullMQ o AWS SQS + Lambda
- Storage: AWS S3 / Azure Blob
- Auth: OpenID Connect / JWT (Auth0/Azure AD B2C si se requiere)
- Antivirus: ClamAV interno o servicio (VirusTotal/third-party)
- WAF/CDN: Cloudflare / Azure Front Door

Hoja de ruta de implementación (fases)
1) Fase 0 — Diseño (1 semana): definir endpoints, datos obligatorios, roles y límites.
2) Fase 1 — MVP Intake (2-3 semanas): endpoint autenticado, persistencia mínima, cola y worker simple que guarde a S3.
3) Fase 2 — Seguridad y anti-abuso (2 semanas): WAF, rate-limits, CAPTCHA adaptativo, escaneo antivirus.
4) Fase 3 — Panel admin y workflows (2 semanas): interfaz para moderación, notificaciones y auditoría.
5) Fase 4 — Escalado y pruebas (2 semanas): pruebas de carga, chaos testing, puesta en producción progresiva.

Pruebas y validación
- Tests unitarios y de integración para validaciones de schema.
- Pruebas de carga (locust, k6) simulando envíos masivos y comprobar back-pressure y throttling.
- Seguridad: pentest enfocado en endpoints y subida de archivos.

Operación y monitoreo
- Alertas por tasa de errores y por velocidad de cola.
- Rotación de claves y revisiones periódicas de dependencias.

Costes y trade-offs
- Microservicio: mayor coste operativo pero menor riesgo para la plataforma principal.
- Serverless: buen escalado para picos, coste variable.

Conclusión (resumen ejecutivo)
-----------------------------
La opción más segura y escalable es implementar un microservicio de recepción que reciba sólo usuarios enrolados, ponga trabajos en cola y deje el procesamiento pesado a workers aislados. Complementar con WAF, rate-limiting per-user/IP, escaneo de adjuntos y almacenamiento cifrado reduce significativamente la superficie de ataque y permite absorber cargas masivas sin colapsar la plataforma principal.

Anexos: Endpoints sugeridos
- POST /intake/projects — crear envío (auth required) -> 202 Accepted { jobId }
- GET /intake/projects/{id} — estado del envío (auth)
- GET /admin/intake — panel administrativo (RBAC)

Contacto
- Si desean, puedo generar: esquema de base de datos, diagrama de despliegue, y el scaffold inicial del microservicio para esta repo.
