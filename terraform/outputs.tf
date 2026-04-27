output "table_names" {
  description = "Physical DynamoDB table names."
  value = {
    visits    = aws_dynamodb_table.visits.name
    users     = aws_dynamodb_table.users.name
    signups   = aws_dynamodb_table.signups.name
    feedback  = aws_dynamodb_table.feedback.name
    customers = aws_dynamodb_table.customers.name
    audit_log = aws_dynamodb_table.audit_log.name
  }
}

output "table_arns" {
  description = "DynamoDB table ARNs."
  value = {
    visits    = aws_dynamodb_table.visits.arn
    users     = aws_dynamodb_table.users.arn
    signups   = aws_dynamodb_table.signups.arn
    feedback  = aws_dynamodb_table.feedback.arn
    customers = aws_dynamodb_table.customers.arn
    audit_log = aws_dynamodb_table.audit_log.arn
  }
}
