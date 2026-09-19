#!/usr/bin/env bash
# Sonda del entorno de xavi-habits-webapp. Responde de una vez lo que un agente
# necesita saber antes de tocar el navegador. No arranca ni para nada.
set -u
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
API_URL="$(grep -E '^VITE_API_URL=' "$ROOT/.env" 2>/dev/null | cut -d= -f2)"
API_URL="${API_URL:-$(grep -E '^VITE_API_URL=' "$ROOT/.env.example" | cut -d= -f2)}"

check() { # nombre url  → distingue apagado (7) de ocupado compilando (28)
  local name="$1" url="$2" code rc
  code=$(curl -sS -o /dev/null -m 8 -w '%{http_code}' "$url" 2>/dev/null); rc=$?
  case $rc in
    0)  printf '  %-28s ARRIBA   HTTP %s  %s\n' "$name" "$code" "$url" ;;
    7)  printf '  %-28s APAGADO  (nadie escucha)  %s\n' "$name" "$url" ;;
    28) printf '  %-28s OCUPADO  (escucha pero no responde: compilando o dormido)  %s\n' "$name" "$url" ;;
    *)  printf '  %-28s ERROR    curl rc=%s  %s\n' "$name" "$rc" "$url" ;;
  esac
}

echo "== Servicios =="
check "web (dev, del usuario)"  "http://localhost:5173/"
check "web (puerto alterno)"    "http://localhost:5174/"
check "API auth (401 = arriba)"  "$API_URL/api/auth/profile"
check "API /graphql (400 = arriba)" "$API_URL/graphql"
echo "  (la API no tiene /health; 401 y 400 sin sesión significan que responde)"

echo "== Repositorio =="
echo "  rama: $(git -C "$ROOT" rev-parse --abbrev-ref HEAD) @ $(git -C "$ROOT" rev-parse --short HEAD)"
echo "  cambios sin commitear: $(git -C "$ROOT" status --porcelain | wc -l | tr -d ' ') archivos"
if [ -f "$ROOT/graphify-out/graph.json" ]; then
  echo "  grafo: sí ($(stat -c %y "$ROOT/graphify-out/graph.json" 2>/dev/null | cut -d. -f1)) — refleja el último 'graphify update .', no el working tree"
else
  echo "  grafo: no"
fi

echo "== Línea base (no se ejecuta aquí; tarda) =="
echo "  pnpm typecheck  → limpio"
echo "  pnpm lint       → 14 errores / 0 warnings (preexistentes)"
echo "  pnpm test       → 2 fallos de 409 (SearchSelect ×2, preexistentes)"
echo "  pnpm build      → chunk inicial 816 kB + app-icons 620 kB (perezoso)"
