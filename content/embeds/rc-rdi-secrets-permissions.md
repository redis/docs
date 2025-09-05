```json
{
    "Version" : "2012-10-17",
    "Statement" : [ {
        "Sid" : "RedisDataIntegrationRoleAccess",
        "Effect" : "Allow",
        "Principal" : "*",
        "Action" : [ "secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret" ],
        "Resource" : "*",
        "Condition" : {
            "StringLike" : {
                "aws:PrincipalArn" : "arn:aws:iam::<AWS ACCOUNT ID>:role/redis-data-pipeline-secrets-role"
            }
        }
    } ]
}
```