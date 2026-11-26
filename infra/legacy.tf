# Legacy JSP on Tomcat 10: ECS Fargate (0.25 vCPU / 0.5 GB x 1) behind one ALB, default VPC public subnets, no NAT.
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
  filter {
    name   = "default-for-az"
    values = ["true"]
  }
}

resource "aws_ecr_repository" "legacy" {
  name         = "${local.name}-legacy"
  force_delete = true
}

resource "aws_cloudwatch_log_group" "legacy" {
  name              = "/ecs/${local.name}-legacy"
  retention_in_days = 1
}

resource "aws_security_group" "alb" {
  name        = "${local.name}-alb"
  description = "Public HTTP into the ALB (CloudFront origin)"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "tomcat" {
  name        = "${local.name}-tomcat"
  description = "Tomcat admits only the ALB"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "From ALB"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  egress {
    description = "Image pull and logs"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_lb" "legacy" {
  name               = "${local.name}-alb"
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = data.aws_subnets.default.ids
}

resource "aws_lb_target_group" "legacy" {
  name        = "${local.name}-tg"
  port        = 8080
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = data.aws_vpc.default.id

  deregistration_delay = 5

  health_check {
    path                = "/legacy/healthz"
    healthy_threshold   = 2
    unhealthy_threshold = 5
    interval            = 15
    timeout             = 5
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.legacy.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.legacy.arn
  }
}

resource "aws_ecs_cluster" "legacy" {
  name = "${local.name}-cluster"
}

data "aws_iam_policy_document" "ecs_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "task_execution" {
  name               = "${local.name}-task-exec"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

resource "aws_iam_role_policy_attachment" "task_execution" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_ecs_task_definition" "legacy" {
  family                   = "${local.name}-legacy"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.task_execution.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

  container_definitions = jsonencode([{
    name         = "tomcat"
    image        = "${aws_ecr_repository.legacy.repository_url}:${var.legacy_image_tag}"
    essential    = true
    portMappings = [{ containerPort = 8080, protocol = "tcp" }]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.legacy.name
        awslogs-region        = var.region
        awslogs-stream-prefix = "tomcat"
      }
    }
  }])
}

resource "aws_ecs_service" "legacy" {
  name            = "${local.name}-legacy"
  cluster         = aws_ecs_cluster.legacy.id
  task_definition = aws_ecs_task_definition.legacy.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.aws_subnets.default.ids
    security_groups  = [aws_security_group.tomcat.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.legacy.arn
    container_name   = "tomcat"
    container_port   = 8080
  }

  depends_on = [aws_lb_listener.http]
}
