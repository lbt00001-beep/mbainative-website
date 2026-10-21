#!/usr/bin/env bash
# Publica (o actualiza) Pupitre en Cloud Run desde Google Cloud Shell.
#
#   git clone --depth 1 https://github.com/lbt00001-beep/mbainative-website ~/mbainative-website
#   bash ~/mbainative-website/pupitre/cloudshell-desplegar.sh
#
# Para actualizar después:  cd ~/mbainative-website && git pull && bash pupitre/cloudshell-desplegar.sh
#
# Sin servicios externos: los datos viven en SQLite dentro de la app y se copian en un bucket de
# Cloud Storage del propio proyecto (se restauran solos tras cada reinicio). Una sola instancia.
set -euo pipefail

PROJECT="${PROJECT:-mbai-native-detector-2026}"
REGION="${REGION:-europe-west1}"
SERVICE="${SERVICE:-pupitre}"
BUCKET="${BUCKET:-${PROJECT}-pupitre-datos}"
SRC="$(cd "$(dirname "$0")" && pwd)"

echo "== Proyecto $PROJECT · región $REGION · servicio $SERVICE"
gcloud config set project "$PROJECT" >/dev/null
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  storage.googleapis.com --quiet

echo "== Bucket de datos gs://$BUCKET"
if ! gcloud storage buckets describe "gs://$BUCKET" >/dev/null 2>&1; then
  gcloud storage buckets create "gs://$BUCKET" --location="$REGION" --uniform-bucket-level-access
fi
NUM="$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')"
SA="${NUM}-compute@developer.gserviceaccount.com"
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" \
  --member="serviceAccount:$SA" --role="roles/storage.objectAdmin" >/dev/null

FLAGS=(--source "$SRC" --region "$REGION" --allow-unauthenticated --min-instances 0 --max-instances 1
       --memory 1Gi --cpu 1 --timeout 900 --quiet)
if gcloud run services describe "$SERVICE" --region "$REGION" >/dev/null 2>&1; then
  echo "== Actualizando el servicio (conserva su configuración y sus secretos)"
  gcloud run deploy "$SERVICE" "${FLAGS[@]}"
else
  echo "== Primera publicación: genero los secretos (no cambian en las actualizaciones)"
  SIGNUP="${SIGNUP_CODE:-pupitre-$(shuf -i 1000-9999 -n 1)}"
  ENV="GCS_BUCKET=$BUCKET,SECRET_KEY=$(openssl rand -hex 32),CRON_TOKEN=$(openssl rand -hex 24)"
  ENV="$ENV,SIGNUP_CODE=$SIGNUP,PRIVACY_CONTACT=info@mbainative.com"
  gcloud run deploy "$SERVICE" "${FLAGS[@]}" --set-env-vars "$ENV"
fi

URL="$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')"
gcloud run services update "$SERVICE" --region "$REGION" --update-env-vars "APP_URL=$URL" --quiet >/dev/null
CODE="$(gcloud run services describe "$SERVICE" --region "$REGION" --format=json \
  | python3 -c "import json,sys;e=json.load(sys.stdin)['spec']['template']['spec']['containers'][0].get('env',[]);print(next((x['value'] for x in e if x['name']=='SIGNUP_CODE'),''))")"

echo
echo "=============================================="
echo " Pupitre publicado: $URL"
echo " Código de invitación: $CODE"
echo "=============================================="
