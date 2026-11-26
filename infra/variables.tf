variable "region" {
  type    = string
  default = "ap-southeast-2"
}

variable "aws_profile" {
  type    = string
  default = "bank-portal-microfrontends-deployer"
}

variable "legacy_image_tag" {
  description = "Tag of the Tomcat image pushed to ECR by scripts/deploy.sh"
  type        = string
  default     = "1.0"
}
