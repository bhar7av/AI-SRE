# High Error Rate Runbook

## Symptom
Application error rate exceeds the configured threshold.

## Possible Causes
- Application failure
- Dependency failure
- Invalid requests
- Database errors
- Recent deployment issue
- Resource exhaustion

## Investigation
1. Confirm the current error rate.
2. Compare it with the configured threshold.
3. Inspect recent application logs.
4. Identify recurring error messages.
5. Check correlated telemetry.

## Remediation
- Identify the failing component.
- Roll back a known bad deployment when supported.
- Restore failed dependencies.
- Reduce load if necessary.
- Verify error rate after remediation.

## Safety
Rollback and production changes require human approval.
