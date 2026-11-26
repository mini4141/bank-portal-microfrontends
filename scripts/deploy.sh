#!/usr/bin/env bash
# Phase 2: deploys the showcase to AWS from this PC and proves it works. GitHub Actions never holds credentials.
#   1 terraform apply  2 build MFEs  3 upload to S3 + importmap  4 invalidate CloudFront
#   5 Playwright against CloudFront  6 flip the AppConfig flag and re-run the statements test
# Run scripts/destroy.sh right after (Phase 3).
set -euo pipefail
. "$(dirname "$0")/lib.sh"

export AWS_PROFILE=bank-portal-microfrontends-deployer AWS_REGION=ap-southeast-2 AWS_DEFAULT_REGION=ap-southeast-2 AWS_PAGER=""
OUT="proof/phase2-cloud"
mkdir -p "$OUT/screenshots" "$OUT/logs" "$OUT/tests"
tf() { terraform -chdir=infra "$@"; }
out() { tf output -raw "$1"; }

log "checking AWS identity"
aws sts get-caller-identity --query Arn --output text | redact

log "[1/6] build the BFF bundle and every MFE"
VERSION="${VERSION:-$(git rev-parse --short HEAD)}"
export VERSION
SKIP_BUILD=0 "$ROOT/scripts/stage.sh"

log "[1/6] terraform: ECR first, then the legacy image, then everything else"
tf init -input=false >/dev/null
tf apply -input=false -auto-approve -target=aws_ecr_repository.legacy | tail -3
REPO="$(out ecr_repository_url)"
aws ecr get-login-password | docker login --username AWS --password-stdin "${REPO%%/*}" >/dev/null
docker build -q -t bank-legacy:1.0 -f legacy/Dockerfile . >/dev/null
docker tag bank-legacy:1.0 "$REPO:1.0"
docker push -q "$REPO:1.0" >/dev/null
tf apply -input=false -auto-approve 2>&1 | tee .local/logs/terraform-apply.log | tail -5

SITE="$(out site_url)"; BUCKET="$(out bucket)"; DIST="$(out distribution_id)"
log "site: $SITE"

log "[2-3/6] runtime config + upload to S3 (versioned MFE paths, importmap.json last)"
RUM_ID="$(out rum_app_monitor_id)" RUM_POOL="$(out rum_identity_pool_id)" RUM_ROLE="$(out rum_guest_role_arn)" node -e "
const e=process.env
require('fs').writeFileSync('.stage/config.json', JSON.stringify({ rum: { applicationId: e.RUM_ID, identityPoolId: e.RUM_POOL, guestRoleArn: e.RUM_ROLE, region: 'ap-southeast-2' } }, null, 2))
"
IMMUTABLE="public,max-age=31536000,immutable"
aws s3 cp .stage "s3://$BUCKET" --recursive --exclude "*" --include "*.js" --content-type "text/javascript; charset=utf-8" --cache-control "$IMMUTABLE" --only-show-errors
aws s3 cp .stage "s3://$BUCKET" --recursive --exclude "*" --include "*.html" --content-type "text/html; charset=utf-8" --cache-control "no-cache" --only-show-errors
aws s3 cp .stage "s3://$BUCKET" --recursive --exclude "*" --include "*.json" --exclude "importmap.json" --content-type "application/json" --cache-control "no-cache" --only-show-errors
aws s3 cp .stage/importmap.json "s3://$BUCKET/importmap.json" --content-type "application/json" --cache-control "no-cache" --only-show-errors

log "[4/6] invalidate CloudFront"
INV="$(aws cloudfront create-invalidation --distribution-id "$DIST" --paths '/*' --query Invalidation.Id --output text)"
aws cloudfront wait invalidation-completed --distribution-id "$DIST" --id "$INV"

log "waiting for the distribution, Lambda and Tomcat (ECS) to answer"
aws cloudfront wait distribution-deployed --id "$DIST"
aws ecs wait services-stable --cluster "$(out ecs_cluster)" --services "$(out ecs_service)"
wait_http "$SITE/api/flags" 120
wait_http "$SITE/legacy/healthz" 300
wait_http "$SITE/importmap.json" 60

log "[5/6] Playwright against CloudFront (flag off: legacy statements)"
(cd e2e && BASE_URL="$SITE" FLAG_MODE=external PW_OUT="$ROOT/$OUT/tests/playwright-cloud" \
  npx playwright test 1-demo) 2>&1 | tee "$OUT/logs/playwright-cloud-flag-off.log"
CLOUD_MODE=cloud-legacy "$ROOT/scripts/capture-proof.sh" phase2-cloud

log "[6/6] flip statements.v2 through AppConfig (hosted configuration version + deployment)"
APP="$(out appconfig_application_id)"; ENV="$(out appconfig_environment_id)"; PROFILE="$(out appconfig_profile_id)"
node -e "
const f=JSON.parse(require('fs').readFileSync('bff/data/flags.json','utf8'));
f.values['statements.v2'].enabled=true; f.version='2';
process.stdout.write(JSON.stringify(f))" > .local/flags-on.json
{
  echo "# AppConfig: enable statements.v2 ($(date -u +%FT%TZ))"
  VER="$(aws appconfig create-hosted-configuration-version --application-id "$APP" --configuration-profile-id "$PROFILE" \
    --content-type application/json --content fileb://.local/flags-on.json .local/flags-version.out \
    --query VersionNumber --output text)"
  echo "hosted configuration version: $VER"
  DEP="$(aws appconfig start-deployment --application-id "$APP" --environment-id "$ENV" --configuration-profile-id "$PROFILE" \
    --configuration-version "$VER" --deployment-strategy-id AppConfig.AllAtOnce --query DeploymentNumber --output text)"
  echo "deployment number: $DEP"
  for _ in $(seq 60); do
    STATE="$(aws appconfig get-deployment --application-id "$APP" --environment-id "$ENV" --deployment-number "$DEP" --query State --output text)"
    echo "deployment state: $STATE"
    [ "$STATE" = "COMPLETE" ] && break
    sleep 5
  done
  echo "waiting for the BFF to pick up the new configuration"
  for _ in $(seq 40); do
    FLAGS="$(curl -fsS "$SITE/api/flags")"; echo "GET /api/flags -> $FLAGS"
    echo "$FLAGS" | grep -q '"statements.v2":true' && break
    sleep 5
  done
} 2>&1 | redact | tee "$OUT/logs/appconfig-deploy.log"

(cd e2e && BASE_URL="$SITE" FLAG_MODE=external PW_OUT="$ROOT/$OUT/tests/playwright-cloud-v2" \
  npx playwright test 2-statements-v2) 2>&1 | tee "$OUT/logs/playwright-cloud-flag-on.log"
CLOUD_MODE=cloud-v2 "$ROOT/scripts/capture-proof.sh" phase2-cloud

log "collecting proof: headers, RUM events, resources"
curl -sI "$SITE/" | redact > "$OUT/logs/curl-headers-csp.txt"
curl -sI "$SITE/mfe/utility/$VERSION/bank-utility.js" | redact >> "$OUT/logs/curl-headers-csp.txt"
sleep 90
NOW_MS=$(( $(date +%s) * 1000 )); FROM_MS=$(( NOW_MS - 3 * 3600 * 1000 ))
aws rum get-app-monitor-data --name "$(out rum_app_monitor_name)" --time-range "After=$FROM_MS,Before=$NOW_MS" --max-results 100 \
  2>&1 | redact > "$OUT/logs/rum-events.json" || true
{
  echo "# Deployed resources ($(date -u +%FT%TZ))"
  tf output | redact
  echo
  aws resourcegroupstaggingapi get-resources --tag-filters Key=Project,Values=bank-portal-microfrontends \
    --query 'ResourceTagMappingList[].ResourceARN' --output text | tr '\t' '\n' | sort | redact
  echo
  aws cloudfront get-distribution-config --id "$DIST" \
    --query 'DistributionConfig.CacheBehaviors.Items[].[PathPattern,TargetOriginId]' --output text | redact
} > "$OUT/resources.txt"
log "deploy finished: $SITE (destroy now with scripts/destroy.sh)"
