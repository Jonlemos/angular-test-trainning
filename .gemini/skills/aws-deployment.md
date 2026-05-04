# AWS Deployment Architecture

## Overview

This skill defines the AWS infrastructure and deployment strategy for the Itaú PJ Dashboard, using S3, CloudFront, API Gateway, Lambda/ECS, and supporting services [web:121][web:127].

## Architecture Diagram

            ┌─────────────────────┐
            │ Route 53 (DNS)      │
            │ pj.itau.com.br      │
            └──────────┬──────────┘
                       │
            ┌──────────▼──────────┐
            │ CloudFront CDN      │
            │ (Global Edge)       │
            └──────────┬──────────┘
                       │
       ┌───────────────┼───────────────┐
       │               │               │

┌──────▼──────────┐ ┌─▼─────────┐ ┌──▼───────────┐
│ S3 (Angular) │ │ S3 (React)│ │ API Gateway │
│ /dashboard │ │ /login │ │ /api │
└─────────────────┘ └───────────┘ └────┬─────────┘
│
┌────────────┼────────────┐
│ │ │
┌───▼────────┐ ┌─▼──────┐ ┌───▼─────┐
│ Lambda/ │ │Lambda/ │ │ Lambda/ │
│ ECS │ │ ECS │ │ ECS │
│ Auth Svc │ │Charge │ │ Renego │
└──────┬─────┘ └───┬────┘ └────┬────┘
│ │ │
┌──────▼───────────▼───────────▼────┐
│ DynamoDB / RDS │
│ (Production Database) │
└───────────────────────────────────┘

## Infrastructure as Code (Terraform)

### Main Configuration

```hcl
# infrastructure/main.tf
terraform {
  required_version = ">= 1.5.0"

  backend "s3" {
    bucket         = "itau-pj-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Angular Test Trainning"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Team        = "Growth"
    }
  }
}

# Variables
variable "aws_region" {
  default = "us-east-1"
}

variable "environment" {
  description = "Environment (staging/production)"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
}
```

### S3 Buckets for Static Assets

```hcl
# infrastructure/s3.tf
resource "aws_s3_bucket" "angular_host" {
  bucket = "itau-pj-${var.environment}-angular"

  tags = {
    Name = "Angular Host App"
  }
}

resource "aws_s3_bucket" "react_login" {
  bucket = "itau-pj-${var.environment}-react-login"

  tags = {
    Name = "React Login Remote"
  }
}

# Enable versioning for rollback capability
resource "aws_s3_bucket_versioning" "angular_versioning" {
  bucket = aws_s3_bucket.angular_host.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "react_versioning" {
  bucket = aws_s3_bucket.react_login.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "angular_encryption" {
  bucket = aws_s3_bucket.angular_host.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block public access (CloudFront will access via OAI)
resource "aws_s3_bucket_public_access_block" "angular_public_access" {
  bucket = aws_s3_bucket.angular_host.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Bucket policy for CloudFront access
resource "aws_s3_bucket_policy" "angular_policy" {
  bucket = aws_s3_bucket.angular_host.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOAI"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.oai.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.angular_host.arn}/*"
      }
    ]
  })
}
```

### CloudFront Distribution

```hcl
# infrastructure/cloudfront.tf
resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for Itau PJ Dashboard"
}

resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Itau PJ Dashboard - ${var.environment}"
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  aliases = [var.domain_name]

  # Angular Host Origin
  origin {
    domain_name = aws_s3_bucket.angular_host.bucket_regional_domain_name
    origin_id   = "S3-Angular"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  # React Login Remote Origin
  origin {
    domain_name = aws_s3_bucket.react_login.bucket_regional_domain_name
    origin_id   = "S3-React"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  # API Gateway Origin
  origin {
    domain_name = aws_api_gateway_rest_api.main.id
    origin_id   = "API-Gateway"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Default cache behavior (Angular)
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-Angular"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }

  # React login route
  ordered_cache_behavior {
    path_pattern     = "/login/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-React"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }

  # API routes
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "API-Gateway"

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "X-Request-ID"]
      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "https-only"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  # Custom error responses
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = ["BR"]  # Only Brazil
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Name = "Itau PJ CloudFront"
  }
}
```

### API Gateway

```hcl
# infrastructure/api-gateway.tf
resource "aws_api_gateway_rest_api" "main" {
  name        = "itau-pj-api-${var.environment}"
  description = "API Gateway for Itau PJ Dashboard microservices"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# Auth Service Integration
resource "aws_api_gateway_resource" "auth" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "auth"
}

resource "aws_api_gateway_method" "auth_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.auth.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.auth.id
  http_method = aws_api_gateway_method.auth_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.auth_service.invoke_arn
}

# Deploy API
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.auth.id,
      aws_api_gateway_method.auth_post.id,
      aws_api_gateway_integration.auth_lambda.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "prod" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.environment

  xray_tracing_enabled = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gw.arn
    format         = "$context.requestId"
  }
}
```

### Lambda Functions (Example: Auth Service)

```hcl
# infrastructure/lambda.tf
resource "aws_lambda_function" "auth_service" {
  filename      = "../apps/backend/auth-service/dist/auth-service.zip"
  function_name = "itau-pj-auth-${var.environment}"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 30
  memory_size   = 512

  environment {
    variables = {
      NODE_ENV    = var.environment
      JWT_SECRET  = var.jwt_secret
      DB_ENDPOINT = aws_dynamodb_table.users.name
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = {
    Name = "Auth Service Lambda"
  }
}

resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}
```

## Deployment Scripts

```python
# diagrams/aws_diagram.py
from diagrams import Diagram, Cluster
from diagrams.aws.compute import Lambda, ECS
from diagrams.aws.database import Dynamodb
from diagrams.aws.network import APIGateway, CloudFront, Route53
from diagrams.aws.security import Cognito, IAM
from diagrams.aws.storage import S3
from diagrams.aws.management import Cloudformation, Cloudwatch
from diagrams.onprem.client import Client

with Diagram("Itaú PJ Dashboard - AWS Architecture", show=False, direction="TB"):
    users = Client("PJ Users")

    with Cluster("DNS & CDN"):
        dns = Route53("pj.itau.com.br")
        cdn = CloudFront("Global CDN")

    with Cluster("Frontend (Static Assets)"):
        angular_s3 = S3("Angular Host")
        react_s3 = S3("React Login")

    with Cluster("API Layer"):
        api_gw = APIGateway("API Gateway")

        with Cluster("Microservices"):
            auth_lambda = Lambda("Auth Service")
            charge_lambda = Lambda("Charge Service")
            renego_lambda = Lambda("Renegotiation")

    with Cluster("Data Layer"):
        db = Dynamodb("User Data")

    with Cluster("Security & Monitoring"):
        iam = IAM("IAM Roles")
        logs = Cloudwatch("Logs & Metrics")

    users >> dns >> cdn
    cdn >> angular_s3
    cdn >> react_s3
    cdn >> api_gw

    api_gw >> auth_lambda >> db
    api_gw >> charge_lambda >> db
    api_gw >> renego_lambda >> db

    [auth_lambda, charge_lambda, renego_lambda] >> logs
```

## Monitoring & Alerts

```hcl
# infrastructure/monitoring.tf
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "itau-pj-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/CloudFront", "Requests", { stat = "Sum" }],
            [".", "BytesDownloaded", { stat = "Sum" }],
            [".", "4xxErrorRate", { stat = "Average" }],
            [".", "5xxErrorRate", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "CloudFront Metrics"
        }
      }
    ]
  })
}

resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "itau-pj-high-error-rate-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Average"
  threshold           = 5
  alarm_description   = "Alert when API error rate exceeds 5%"

  alarm_actions = [aws_sns_topic.alerts.arn]
}
```

---

_Use this AWS architecture to deploy a scalable, secure, and highly available PJ dashboard._
