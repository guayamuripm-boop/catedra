# Checklist de privacidad y etica - Catedra

## Datos y minimizacion

- [ ] Recoger solo datos necesarios para el servicio
- [ ] No enviar nombre, email ni identificadores a proveedores LLM
- [ ] Material subido es privado por usuario, nunca compartido
- [ ] Borrado completo bajo demanda (cuenta + contenido + eventos)
- [ ] Retencion limitada de archivos y eventos
- [ ] Sin publicidad conductual
- [ ] Sin venta de datos
- [ ] Sin perfilado comercial

## Menores de edad (15-17)

- [ ] Preguntar rango de edad solo si necesario
- [ ] Explicar privacidad en lenguaje comprensible para adolescentes
- [ ] Separar consentimiento de terminos, marketing y analisis
- [ ] No usar datos de menores para entrenar modelos sin consentimiento
- [ ] No recolectar ubicacion, contactos, microfono, camara, biometria
- [ ] No inferir salud mental, inteligencia o "riesgo academico"
- [ ] No comparaciones publicas entre menores
- [ ] Consentimiento del adulto responsable segun normativa local

## Seguridad

- [ ] RLS auditado en todas las tablas
- [ ] Sin claves de API en el cliente
- [ ] Rate limiting en funciones
- [ ] Validacion de entradas (Zod)
- [ ] HTTPS obligatorio
- [ ] Cifrado en transito
- [ ] Secretos solo en servidor

## Derechos de autor

- [ ] Contenido subido para uso privado del estudiante
- [ ] No hacerlo publicamente buscable ni compartible por defecto
- [ ] No generar biblioteca publica con fragmentos de libros protegidos
- [ ] Limites de archivo y proceso de retiro ante reclamaciones
- [ ] Declarar que el usuario debe tener derecho sobre el material que sube

## Etica de personalizacion

- [ ] No etiquetar permanentemente al estudiante
- [ ] Explicar por que se recomienda algo
- [ ] Permitir corregir datos y desactivar recomendaciones
- [ ] Separar dificultad actual de capacidad intelectual
- [ ] No convertir predicciones en decisiones irreversibles
- [ ] No castigar, avergonzar o presionar con datos de uso
- [ ] Evaluar sesgos por conectividad, dispositivo, idioma, contexto
- [ ] Consentimiento para experimentos A/B que afecten aprendizaje
- [ ] Alternativa no-IA siempre disponible

## Documentos legales necesarios

- [ ] Politica de privacidad (incluye menores)
- [ ] Terminos de servicio
- [ ] Aviso de cookies / almacenamiento local
- [ ] Politica de uso aceptable del material
- [ ] Procedimiento de incidentes de seguridad

## Si se vende a instituciones (Fase 3+)

- [ ] Acuerdo de procesamiento de datos
- [ ] Lista de subprocesadores
- [ ] Politicas de retencion y eliminacion
- [ ] Exportacion de datos
- [ ] Control de acceso por institucion
- [ ] Auditoria de roles
- [ ] Prohibicion de usar datos institucionales para entrenar modelos
