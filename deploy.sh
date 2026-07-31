#!/usr/bin/env bash
#
# Actualización rápida en servidor Ubuntu (producción).
#
# Uso:
#   bash deploy.sh        (o ./deploy.sh si tiene permiso de ejecución)
#   npm run deploy        (equivalente vía npm)
#
# Nota: `pm2 logs` queda en modo seguimiento; presiona Ctrl+C para volver al shell.

set -e

# Ir a la carpeta del proyecto (donde vive este script).
cd "$(dirname "$0")"

echo "==> [1/4] git pull"
git pull

echo "==> [2/4] npm run build"
npm run build

echo "==> [3/4] pm2 restart avancemos-por-chile"
pm2 restart avancemos-por-chile

echo "==> [4/4] pm2 logs avancemos-por-chile (Ctrl+C para salir)"
pm2 logs avancemos-por-chile
