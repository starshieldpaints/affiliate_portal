# Deployment Runbook

1. **Pre-flight**
   - Confirm CI pipeline is passing on the target branch.
   - Ensure database migrations are reviewed and backwards-compatible.
   - Validate environment secrets in AWS Secrets Manager.

2. **Execute**
   - Trigger the `deploy-production` workflow in GitHub Actions with the git SHA to release.
   - Monitor the build logs; artifacts include Next.js standalone output and NestJS compiled bundle.
   - Terraform apply runs in automation to roll out infrastructure deltas.

3. **Verify**
   - Check ECS service events for `core-api` and `worker` tasks.
   - Validate health endpoints: `/health` (API), `/api/status` (frontends).
   - Review Grafana dashboards for error rates and latency spikes.
   - Confirm payout queue depth and commission ledger counts look normal.

4. **Rollback Plan**
   - Trigger `deploy-rollback` workflow referencing previous successful release SHA.
   - Restore previous Terraform state if infrastructure change caused regressions.
   - If database migrations are irreversible, use point-in-time recovery snapshot.
