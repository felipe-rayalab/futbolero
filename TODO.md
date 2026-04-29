# El Futbolero — Pendientes

## Features por construir

### Datos
- [x] 48 equipos cargados (grupos A–L, migrations 004+005+006)
- [x] 72 partidos de fase de grupos cargados (Jun 12 – Jul 2, 2026)

### Scoring
- [x] Función DB `calculate_and_save_scores(match_id)` (migration 007)
- [x] API route `POST /api/admin/match` — marca live/finished y calcula scores
- [x] `.env.example` documentado

### Perfil
- [x] Página /profile — editar display_name
- [x] Mostrar stats y últimas predicciones con resultados

### UX
- [x] Página de detalle de partido /play/[id] — predicción editable + scores de todos al finalizar
- [x] Empty states informativos en /play y /leaderboard

## Próximos pasos sugeridos

- [ ] Variables de entorno en Vercel (SUPABASE_SERVICE_ROLE_KEY, ADMIN_SECRET)
- [ ] Fase eliminatoria — agregar partidos de Round of 32 a Final una vez clasificados
- [ ] Notificaciones — avisar al usuario cuando recibe un desafío (push o email)
- [ ] Avatar upload — subir foto de perfil propia (Supabase Storage)

## Hecho

- [x] Schema inicial + RLS fixes (001–003)
- [x] Setup Supabase CLI + link al proyecto
- [x] Fixture oficial: 48 equipos, 72 partidos (migrations 004–006)
- [x] Scoring: función DB + API admin (007–008)
- [x] Tema dark unificado + Header compartido con active nav
- [x] Challenges: flujo completo (crear, aceptar/rechazar, resolver, historial)
- [x] Ligas: crear, unirse, ranking interno, copiar código
- [x] Perfil: editar nombre, stats, historial de predicciones
- [x] UX: aria-labels, focus-visible, empty states, detalle de partido
- [x] Performance: índices DB, fix N+1 en leagues/[id]
