# AWS AppConfig feature flags (the AWS equivalent of Firebase Remote Config), read by the BFF.
resource "aws_appconfig_application" "flags" {
  name = "${local.name}-flags"
}

resource "aws_appconfig_environment" "flags" {
  name           = "live"
  application_id = aws_appconfig_application.flags.id
}

resource "aws_appconfig_configuration_profile" "flags" {
  application_id = aws_appconfig_application.flags.id
  name           = "feature-flags"
  location_uri   = "hosted"
  type           = "AWS.AppConfig.FeatureFlags"
}

resource "aws_appconfig_hosted_configuration_version" "initial" {
  application_id           = aws_appconfig_application.flags.id
  configuration_profile_id = aws_appconfig_configuration_profile.flags.configuration_profile_id
  content_type             = "application/json"
  description              = "statements.v2 off"
  content                  = file("${path.module}/../bff/data/flags.json")
}

resource "aws_appconfig_deployment" "initial" {
  application_id           = aws_appconfig_application.flags.id
  environment_id           = aws_appconfig_environment.flags.environment_id
  configuration_profile_id = aws_appconfig_configuration_profile.flags.configuration_profile_id
  configuration_version    = aws_appconfig_hosted_configuration_version.initial.version_number
  deployment_strategy_id   = "AppConfig.AllAtOnce"
}
