#!/usr/bin/env bash
# Confirms nothing billable remains. Exits non-zero if any resource of the project is still there.
# Every check is a direct describe/list call (the tagging API lags a few minutes behind deletes).
set -uo pipefail
. "$(dirname "$0")/lib.sh"

export AWS_PROFILE=bank-portal-microfrontends-deployer AWS_PAGER=""
R=ap-southeast-2
OUT="proof/phase3-destroy/verify-destroyed.txt"
mkdir -p "$(dirname "$OUT")"
FOUND=0

check() { # check <label> <command that prints matches>
  local label="$1"; shift
  local hits; hits="$("$@" 2>&1 | redact | grep -v '^None$' | sed '/^$/d')"
  if [ -n "$hits" ]; then echo "FOUND   $label: $hits"; FOUND=1; else echo "ok      $label: none"; fi
}

{
  echo "verify-destroyed $(date -u +%FT%TZ)"
  echo "identity: $(aws sts get-caller-identity --query Arn --output text | redact)"

  check "CloudFront distributions (comment bank-portal)" aws cloudfront list-distributions \
    --query "DistributionList.Items[?contains(Comment, 'bank-portal')].Id" --output text
  check "CloudFront functions" aws cloudfront list-functions --query "FunctionList.Items[?contains(Name, 'bank-portal')].Name" --output text
  check "CloudFront response header policies" aws cloudfront list-response-headers-policies --type custom \
    --query "ResponseHeadersPolicyList.Items[?contains(ResponseHeadersPolicy.ResponseHeadersPolicyConfig.Name, 'bank-portal')].ResponseHeadersPolicy.Id" --output text
  check "S3 buckets" aws s3api list-buckets --query "Buckets[?contains(Name, 'bank-portal')].Name" --output text
  check "Lambda functions" aws lambda list-functions --region $R --query "Functions[?contains(FunctionName, 'bank-portal')].FunctionName" --output text
  check "ECS clusters" aws ecs list-clusters --region $R --query "clusterArns[?contains(@, 'bank-portal')]" --output text
  check "Load balancers" aws elbv2 describe-load-balancers --region $R --query "LoadBalancers[?contains(LoadBalancerName, 'bank-portal')].LoadBalancerArn" --output text
  check "Target groups" aws elbv2 describe-target-groups --region $R --query "TargetGroups[?contains(TargetGroupName, 'bank-portal')].TargetGroupArn" --output text
  check "ECR repositories" aws ecr describe-repositories --region $R --query "repositories[?contains(repositoryName, 'bank-portal')].repositoryName" --output text
  check "RUM app monitors" aws rum list-app-monitors --region $R --query "AppMonitorSummaries[?contains(Name, 'bank-portal')].Name" --output text
  check "AppConfig applications" aws appconfig list-applications --region $R --query "Items[?contains(Name, 'bank-portal')].Id" --output text
  check "Cognito identity pools" aws cognito-identity list-identity-pools --max-results 60 --region $R \
    --query "IdentityPools[?contains(IdentityPoolName, 'bank-portal')].IdentityPoolId" --output text
  check "IAM roles" aws iam list-roles --query "Roles[?contains(RoleName, 'bank-portal')].RoleName" --output text
  check "Log groups" aws logs describe-log-groups --region $R --query "logGroups[?contains(logGroupName, 'bank-portal')].logGroupName" --output text
  check "Security groups" aws ec2 describe-security-groups --region $R --filters Name=group-name,Values='bank-portal-*' \
    --query "SecurityGroups[].GroupId" --output text
  for region in $R us-east-1; do
    check "Tagged resources Project=bank-portal-microfrontends ($region)" aws resourcegroupstaggingapi get-resources --region $region \
      --tag-filters Key=Project,Values=bank-portal-microfrontends --query "ResourceTagMappingList[].ResourceARN" --output text
  done
  echo
  if [ "$FOUND" = "0" ]; then echo "RESULT: nothing billable remains"; else echo "RESULT: resources remain"; fi
} | tee "$OUT"

[ "$FOUND" = "0" ]
