# BFF: the Fastify app as one Lambda behind a function URL; CloudFront routes /api/* to it.
data "archive_file" "bff" {
  type        = "zip"
  source_file = "${path.module}/../bff/dist/lambda/index.mjs"
  output_path = "${path.module}/.build/bff.zip"
}

resource "random_password" "session" {
  length  = 40
  special = false
}

resource "aws_cloudwatch_log_group" "bff" {
  name              = "/aws/lambda/${local.name}-bff"
  retention_in_days = 1
}

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "bff" {
  name               = "${local.name}-bff"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

data "aws_iam_policy_document" "bff" {
  statement {
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.bff.arn}:*"]
  }
  statement {
    actions   = ["appconfig:StartConfigurationSession", "appconfig:GetLatestConfiguration"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "bff" {
  name   = "bff"
  role   = aws_iam_role.bff.id
  policy = data.aws_iam_policy_document.bff.json
}

resource "aws_lambda_function" "bff" {
  function_name    = "${local.name}-bff"
  role             = aws_iam_role.bff.arn
  runtime          = "nodejs22.x"
  handler          = "index.handler"
  filename         = data.archive_file.bff.output_path
  source_code_hash = data.archive_file.bff.output_base64sha256
  memory_size      = 256
  timeout          = 10

  environment {
    variables = {
      NODE_ENV              = "production"
      SESSION_SECRET        = random_password.session.result
      APPCONFIG_APPLICATION = aws_appconfig_application.flags.id
      APPCONFIG_ENVIRONMENT = aws_appconfig_environment.flags.environment_id
      APPCONFIG_PROFILE     = aws_appconfig_configuration_profile.flags.configuration_profile_id
    }
  }

  depends_on = [aws_cloudwatch_log_group.bff]
}

resource "aws_lambda_function_url" "bff" {
  function_name      = aws_lambda_function.bff.function_name
  authorization_type = "NONE"
}

# Public function URL: both permissions are required for NONE auth on current accounts.
resource "aws_lambda_permission" "url" {
  statement_id           = "AllowPublicFunctionUrl"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.bff.function_name
  principal              = "*"
  function_url_auth_type = "NONE"
}

resource "aws_lambda_permission" "invoke" {
  statement_id             = "AllowInvokeViaFunctionUrl"
  action                   = "lambda:InvokeFunction"
  function_name            = aws_lambda_function.bff.function_name
  principal                = "*"
  invoked_via_function_url = true
}
