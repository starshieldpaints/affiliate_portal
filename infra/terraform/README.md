# StarShield Affiliate Portal Infrastructure

Terraform configuration targeting AWS with the following baseline components:

- VPC with segregated public/private subnets
- ECS Fargate services for `core-api` and `worker`
- Application Load Balancer fronted by AWS WAF
- RDS PostgreSQL with automated backups and read replica
- ElastiCache Redis for sessions and BullMQ queues
- SQS queues (`commission`, `payout`, `notifications`)
- S3 buckets for static assets and payout receipts
- CloudFront CDN for Next.js frontends
- AWS Secrets Manager for runtime secrets

> These manifests are intentionally skeletal to establish project structure—add environment-specific modules within `environments/`.
