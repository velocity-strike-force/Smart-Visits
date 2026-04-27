output "table_names" {
  description = "Physical DynamoDB table names."
  value = {
    visits             = aws_dynamodb_table.visits.name
    users              = aws_dynamodb_table.users.name
    signups            = aws_dynamodb_table.signups.name
    feedback           = aws_dynamodb_table.feedback.name
    customers          = aws_dynamodb_table.customers.name
    audit_log          = aws_dynamodb_table.audit_log.name
    roles              = aws_dynamodb_table.roles.name
    product_lines      = aws_dynamodb_table.product_lines.name
    user_product_lines = aws_dynamodb_table.user_product_lines.name
  }
}

output "table_arns" {
  description = "DynamoDB table ARNs."
  value = {
    visits             = aws_dynamodb_table.visits.arn
    users              = aws_dynamodb_table.users.arn
    signups            = aws_dynamodb_table.signups.arn
    feedback           = aws_dynamodb_table.feedback.arn
    customers          = aws_dynamodb_table.customers.arn
    audit_log          = aws_dynamodb_table.audit_log.arn
    roles              = aws_dynamodb_table.roles.arn
    product_lines      = aws_dynamodb_table.product_lines.arn
    user_product_lines = aws_dynamodb_table.user_product_lines.arn
  }
}
