#!/usr/bin/env bash
# Phase 3: tears the whole showcase down. Idempotent and safe to re-run.
# Clears what would block terraform (S3 objects, non-Terraform AppConfig versions), then terraform destroy.
# CloudFront disable + delete can take ~15 minutes.
set -uo pipefail
. "$(dirname "$0")/lib.sh"

export AWS_PROFILE=bank-portal-microfrontends-deployer AWS_REGION=ap-southeast-2 AWS_DEFAULT_REGION=ap-southeast-2 AWS_PAGER=""
tf() { terraform -chdir=infra "$@"; }
out() { tf output -raw "$1" 2>/dev/null; }

aws sts get-caller-identity --query Arn --output text >/dev/null || { log "no AWS access"; exit 1; }

if [ -f infra/terraform.tfstate ] && [ -n "$(tf state list 2>/dev/null)" ]; then
  BUCKET="$(out bucket || true)"
  if [ -n "$BUCKET" ]; then
    log "emptying s3://$BUCKET"
    aws s3 rm "s3://$BUCKET" --recursive --only-show-errors || true
  fi

  APP="$(out appconfig_application_id || true)"; PROFILE="$(out appconfig_profile_id || true)"
  if [ -n "$APP" ] && [ -n "$PROFILE" ]; then
    log "removing hosted AppConfig versions created outside Terraform"
    for v in $(aws appconfig list-hosted-configuration-versions --application-id "$APP" --configuration-profile-id "$PROFILE" \
      --query 'Items[].VersionNumber' --output text 2>/dev/null); do
      aws appconfig delete-hosted-configuration-version --application-id "$APP" --configuration-profile-id "$PROFILE" \
        --version-number "$v" >/dev/null 2>&1 || true
    done
  fi

  log "terraform destroy (CloudFront can take ~15 minutes)"
  for attempt in 1 2 3; do
    tf destroy -input=false -auto-approve && break
    log "destroy attempt $attempt failed; retrying after a pause"
    sleep 30
  done
else
  log "no Terraform state: nothing to destroy"
fi

docker rmi -f bank-legacy:1.0 >/dev/null 2>&1 || true
log "destroy finished; run scripts/verify-destroyed.sh"
