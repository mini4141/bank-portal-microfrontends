output "site_url" {
  value = "https://${aws_cloudfront_distribution.site.domain_name}"
}

output "distribution_id" {
  value = aws_cloudfront_distribution.site.id
}

output "bucket" {
  value = aws_s3_bucket.site.bucket
}

output "ecr_repository_url" {
  value = aws_ecr_repository.legacy.repository_url
}

output "ecs_cluster" {
  value = aws_ecs_cluster.legacy.name
}

output "ecs_service" {
  value = aws_ecs_service.legacy.name
}

output "alb_dns" {
  value = aws_lb.legacy.dns_name
}

output "lambda_name" {
  value = aws_lambda_function.bff.function_name
}

output "appconfig_application_id" {
  value = aws_appconfig_application.flags.id
}

output "appconfig_environment_id" {
  value = aws_appconfig_environment.flags.environment_id
}

output "appconfig_profile_id" {
  value = aws_appconfig_configuration_profile.flags.configuration_profile_id
}

output "rum_app_monitor_name" {
  value = aws_rum_app_monitor.site.name
}

output "rum_app_monitor_id" {
  value = aws_rum_app_monitor.site.app_monitor_id
}

output "rum_identity_pool_id" {
  value = aws_cognito_identity_pool.rum.id
}

output "rum_guest_role_arn" {
  value = aws_iam_role.rum_guest.arn
}
