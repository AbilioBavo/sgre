#!/usr/bin/env bash
#
# Prepara dados para o serviço OSRM (motor de rotas).
#
# Uso:
#   ./scripts/prepare-osrm.sh                # default: maputo (Mozambique)
#   CITY_NAME=luanda REGION=angola ./scripts/prepare-osrm.sh
#
# Variáveis suportadas:
#   CITY_NAME  Nome usado para os ficheiros .osm.pbf e .osrm (default: maputo)
#   REGION     Região do Geofabrik (africa/<region>) (default: mozambique)
#

set -euo pipefail

CITY_NAME=${CITY_NAME:-maputo}
REGION=${REGION:-mozambique}
DATA_DIR=${DATA_DIR:-$(pwd)/osrm/data}
PROFILE=${PROFILE:-/opt/car.lua}

mkdir -p "$DATA_DIR"

PBF_NAME="${REGION}-latest.osm.pbf"
PBF_URL="https://download.geofabrik.de/africa/${PBF_NAME}"
PBF_PATH="${DATA_DIR}/${CITY_NAME}.osm.pbf"

if [ ! -f "$PBF_PATH" ]; then
  echo "==> A baixar ${PBF_URL}"
  curl -fL --progress-bar -o "$PBF_PATH" "$PBF_URL"
else
  echo "==> ${PBF_PATH} já existe (skip download)"
fi

echo "==> osrm-extract"
docker run --rm -v "${DATA_DIR}:/data" osrm/osrm-backend \
  osrm-extract -p "$PROFILE" "/data/${CITY_NAME}.osm.pbf"

echo "==> osrm-partition"
docker run --rm -v "${DATA_DIR}:/data" osrm/osrm-backend \
  osrm-partition "/data/${CITY_NAME}.osrm"

echo "==> osrm-customize"
docker run --rm -v "${DATA_DIR}:/data" osrm/osrm-backend \
  osrm-customize "/data/${CITY_NAME}.osrm"

echo ""
echo "✅ OSRM preparado para '${CITY_NAME}'."
echo "   Para iniciar:  CITY_NAME=${CITY_NAME} docker compose --profile routing up -d osrm"
