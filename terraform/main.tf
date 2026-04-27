locals {
  name_prefix = "${var.deployment_env}-smart-visits"
  is_prod     = var.deployment_env == "prod"
}

resource "aws_dynamodb_table" "visits" {
  name                        = "${local.name_prefix}-Visits"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "visitId"
  deletion_protection_enabled = local.is_prod

  attribute {
    name = "visitId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = local.is_prod
  }

  tags = var.tags
}

resource "aws_dynamodb_table" "users" {
  name                        = "${local.name_prefix}-Users"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "userId"
  deletion_protection_enabled = local.is_prod

  attribute {
    name = "userId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = local.is_prod
  }

  tags = var.tags
}

resource "aws_dynamodb_table" "signups" {
  name                        = "${local.name_prefix}-Signups"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "visitId"
  range_key                   = "userId"
  deletion_protection_enabled = local.is_prod

  attribute {
    name = "visitId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = local.is_prod
  }

  tags = var.tags
}

resource "aws_dynamodb_table" "feedback" {
  name                        = "${local.name_prefix}-Feedback"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "visitId"
  range_key                   = "userId"
  deletion_protection_enabled = local.is_prod

  attribute {
    name = "visitId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = local.is_prod
  }

  tags = var.tags
}

resource "aws_dynamodb_table" "customers" {
  name                        = "${local.name_prefix}-Customers"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "customerId"
  deletion_protection_enabled = local.is_prod

  attribute {
    name = "customerId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = local.is_prod
  }

  tags = var.tags
}

resource "aws_dynamodb_table" "audit_log" {
  name                        = "${local.name_prefix}-AuditLog"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "entityId"
  range_key                   = "timestamp"
  deletion_protection_enabled = local.is_prod

  attribute {
    name = "entityId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  point_in_time_recovery {
    enabled = local.is_prod
  }

  tags = var.tags
}
