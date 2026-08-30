# AI-SRE
AI-powered Site Reliability Engineering platform for intelligent incident detection, investigation, root cause analysis, and safe remediation.
# AI SRE

#Notion Notebook link :- https://app.notion.com/p/AI-Site-Reliability-Engineering-3ca9d72fe8ac8000a0ddfeb2311c951e?source=copy_link
Every single detail explained

## Intelligent Incident Detection, Root Cause Analysis and Automated Remediation

AI SRE is an AI powered Site Reliability Engineering platform designed to monitor production services, detect abnormal behavior, analyze incidents, identify probable root causes, and assist with safe remediation.

The platform connects production services with a centralized incident command center. Telemetry from connected services is collected and analyzed to identify failures and reliability issues.

The goal is to reduce the time required to detect, investigate, and resolve production incidents.

## Project Track

Open Track

## Problem Statement

Modern applications are composed of multiple interconnected services. When one service starts failing, the resulting issue can propagate across dependent services and make incident investigation difficult.

Traditional monitoring systems can identify that something is wrong, but engineers still need to manually investigate logs, service health, dependencies, and possible root causes.

This process can increase Mean Time To Detect and Mean Time To Resolve.

AI SRE addresses this problem by connecting production services to a centralized reliability platform that collects telemetry, detects abnormal behavior, creates incidents, analyzes their root causes, and provides remediation recommendations.

## What AI SRE Solves

AI SRE provides a centralized workflow for production incident management.

1. Production services are registered with AI SRE.

2. Services send telemetry and operational signals to the platform.

3. The telemetry collector receives and processes these signals.

4. The detection layer identifies abnormal behavior and potential failures.

5. An incident is created when a significant reliability problem is detected.

6. The incident is analyzed using available service and telemetry information.

7. The Root Cause Analysis layer identifies the most probable cause.

8. The platform generates a remediation recommendation.

9. Remediation actions can be reviewed and executed through the platform.

10. The incident lifecycle is tracked until resolution.

## Core Features

### Service Registry

Production services can be connected to AI SRE through the Service Registry.

A service can contain information such as:

1. Service name

2. Environment

3. Owner

4. Health endpoint

5. Repository

6. Description

The registry provides AI SRE with the context required to understand the production environment.

### Telemetry Collection

The telemetry collector receives operational information from connected services.

The collector acts as the bridge between production services and AI SRE.

Instead of manually entering incidents into the dashboard, services can continuously send telemetry to the platform.

Example signals include:

1. HTTP status codes

2. Request latency

3. Error rates

4. Service health

5. Availability information

6. Runtime events

### Incident Detection

The detection layer analyzes incoming telemetry and identifies abnormal behavior.

Examples include:

1. Increasing error rates

2. Service health failures

3. Increased request latency

4. Repeated failed requests

5. Availability degradation

When a configured reliability condition is detected, AI SRE can create an incident.

### Incident Management

Detected incidents are displayed inside the Incident Command Center.

Each incident can contain information such as:

1. Incident status

2. Severity

3. Affected service

4. Detection information

5. Telemetry context

6. Root cause information

7. Remediation information

8. Resolution state

The dashboard provides a centralized view of active and resolved incidents.

### Root Cause Analysis

AI SRE analyzes the available incident context to determine the probable root cause.

The analysis can consider:

1. Affected services

2. Service dependencies

3. Telemetry

4. Error information

5. Recent operational changes

6. Incident context

The result is presented as an explanation rather than simply reporting that a service has failed.

### AI Assisted Analysis

AI SRE integrates an LLM based analysis layer to assist with incident investigation.

The LLM service receives structured incident context and generates useful information for engineers, including:

1. Probable root cause

2. Explanation of the failure

3. Relevant service context

4. Suggested next steps

5. Remediation recommendations

### Remediation

The remediation service provides a controlled path from incident analysis to corrective action.

Instead of immediately executing potentially dangerous actions, the platform can first produce a recommended remediation action that can be reviewed.

This makes the system safer for production environments.

### Incident Audit Trail

Important incident and remediation operations can be tracked to provide visibility into what happened during the incident lifecycle.

This helps engineers understand:

1. What was detected

2. Which service was affected

3. What analysis was performed

4. What remediation was recommended

5. What action was taken

6. Whether the incident was resolved

## System Architecture

The system is divided into a frontend, backend services, telemetry collection, database, and AI analysis layer.

```text
                         PRODUCTION SERVICES
                                  |
                                  |
                           Telemetry Signals
                                  |
                                  v
                       +----------------------+
                       | Telemetry Collector  |
                       +----------------------+
                                  |
                                  v
                       +----------------------+
                       | Detection Service    |
                       +----------------------+
                                  |
                          Abnormal Behaviour
                                  |
                                  v
                       +----------------------+
                       | Incident Service     |
                       +----------------------+
                                  |
                                  v
                       +----------------------+
                       | Context Service      |
                       +----------------------+
                                  |
                                  v
                       +----------------------+
                       | RCA Service          |
                       +----------------------+
                                  |
                                  v
                       +----------------------+
                       | LLM Service          |
                       +----------------------+
                                  |
                                  v
                       +----------------------+
                       | Remediation Service  |
                       +----------------------+
                                  |
                                  v
                       +----------------------+
                       | Audit Service        |
                       +----------------------+
                                  |
                                  v
                              Database
                                  |
                                  v
                       +----------------------+
                       | Frontend Dashboard   |
                       | Incident Command     |
                       | Center               |
                       +----------------------+
