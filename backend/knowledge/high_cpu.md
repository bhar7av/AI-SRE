# High CPU Utilization Runbook

## Symptom
CPU utilization remains above the configured threshold, commonly 90% or higher.

## Possible Causes
- Excessive application workload
- Traffic spike
- CPU-intensive background processing
- Inefficient application code
- Resource limits that are too low
- Runaway process

## Investigation
1. Confirm current CPU utilization.
2. Compare CPU utilization with the configured threshold.
3. Check recent telemetry for sustained CPU pressure.
4. Inspect application logs for errors or abnormal processing.
5. Check whether the affected service recently experienced increased workload.

## Remediation
For sustained high CPU utilization:
- Investigate the workload first.
- Scale the service if capacity is insufficient.
- Optimize CPU-intensive operations.
- Verify service health after remediation.

## Safety
Scaling or modifying production resources requires human approval.
Never execute destructive remediation automatically.
