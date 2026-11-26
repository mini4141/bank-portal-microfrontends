# CloudWatch RUM (the AWS equivalent of Google/Firebase Analytics) with a guest identity pool owned by Terraform,
# so everything is destroyed with the stack.
resource "aws_cognito_identity_pool" "rum" {
  identity_pool_name               = "${local.name}-rum"
  allow_unauthenticated_identities = true
  allow_classic_flow               = true # aws-rum-web uses the basic (classic) Cognito flow
}

data "aws_iam_policy_document" "rum_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = ["cognito-identity.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "cognito-identity.amazonaws.com:aud"
      values   = [aws_cognito_identity_pool.rum.id]
    }
    condition {
      test     = "ForAnyValue:StringLike"
      variable = "cognito-identity.amazonaws.com:amr"
      values   = ["unauthenticated"]
    }
  }
}

resource "aws_iam_role" "rum_guest" {
  name               = "${local.name}-rum-guest"
  assume_role_policy = data.aws_iam_policy_document.rum_assume.json
}

resource "aws_iam_role_policy" "rum_guest" {
  name = "put-rum-events"
  role = aws_iam_role.rum_guest.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "rum:PutRumEvents"
      Resource = "arn:aws:rum:${var.region}:${data.aws_caller_identity.current.account_id}:appmonitor/${local.name}"
    }]
  })
}

resource "aws_cognito_identity_pool_roles_attachment" "rum" {
  identity_pool_id = aws_cognito_identity_pool.rum.id
  roles            = { unauthenticated = aws_iam_role.rum_guest.arn }
}

resource "aws_rum_app_monitor" "site" {
  name           = local.name
  domain         = aws_cloudfront_distribution.site.domain_name
  cw_log_enabled = false

  app_monitor_configuration {
    allow_cookies       = true
    enable_xray         = false
    session_sample_rate = 1
    telemetries         = ["errors", "performance", "http"]
    identity_pool_id    = aws_cognito_identity_pool.rum.id
    guest_role_arn      = aws_iam_role.rum_guest.arn
  }

  depends_on = [aws_cognito_identity_pool_roles_attachment.rum]
}
