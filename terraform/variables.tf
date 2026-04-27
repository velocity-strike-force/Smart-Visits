variable "deployment_env" {
  description = "Prefix for DynamoDB table names (e.g. dev, staging, prod). Tables: {deployment_env}-smart-visits-*"
  type        = string
}

variable "aws_region" {
  description = "AWS region for DynamoDB tables."
  type        = string
  default     = "us-east-1"
}

variable "tags" {
  description = "Tags applied to each DynamoDB table."
  type        = map(string)
  default     = {}
}
