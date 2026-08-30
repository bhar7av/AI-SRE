# Disk Space Runbook

## Symptom
Available disk space falls below the operational threshold.

## Possible Causes
- Excessive application logs
- Temporary files
- Large database files
- Cache growth
- Failed cleanup jobs

## Investigation
1. Confirm disk utilization.
2. Identify the affected filesystem.
3. Inspect recent logs and storage growth.
4. Identify unusually large files or directories.
5. Verify whether cleanup jobs are functioning.

## Remediation
- Remove approved temporary data.
- Rotate or archive logs.
- Clean application caches.
- Expand storage when required.
- Verify available disk space after remediation.

## Safety
Never delete production data automatically.
Storage cleanup requires human review.
