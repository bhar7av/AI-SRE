# Memory Pressure Runbook

## Symptom
A service experiences unusually high memory utilization.

## Possible Causes
- Memory leak
- Increased workload
- Large in-memory objects
- Insufficient resource allocation
- Unbounded caching

## Investigation
1. Confirm memory utilization.
2. Check recent memory telemetry.
3. Inspect logs for out-of-memory events.
4. Check whether workload increased.
5. Determine whether memory usage is sustained.

## Remediation
- Investigate possible memory leaks.
- Reduce excessive memory usage.
- Restart a service only when approved and appropriate.
- Increase available resources when necessary.
- Verify memory utilization after remediation.

## Safety
Restarting services or changing production resources requires human approval.
