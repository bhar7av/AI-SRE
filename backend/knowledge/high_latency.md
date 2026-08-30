# High Service Latency Runbook

## Symptom
Service latency exceeds the configured latency threshold.

## Possible Causes
- Increased request volume
- Slow downstream dependency
- Database latency
- Resource saturation
- Network degradation
- Inefficient application processing

## Investigation
1. Confirm current latency.
2. Compare latency with the configured threshold.
3. Inspect recent telemetry.
4. Inspect service logs.
5. Identify correlated resource or dependency issues.

## Remediation
- Investigate the slow dependency.
- Reduce excessive workload where possible.
- Scale the affected service when appropriate.
- Optimize slow operations.
- Verify latency after remediation.

## Safety
Production changes require human approval.
