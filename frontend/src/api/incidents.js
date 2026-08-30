import axios from "axios";


// ============================================================
// API CONFIGURATION
// ============================================================
const API_BASE_URL = "https://ai-sre.onrender.com";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,

  headers: {
    "Content-Type": "application/json",
  },
});


// ============================================================
// REQUEST ERROR HANDLER
// ============================================================

function handleApiError(error) {
  console.error("AI-SRE API Error:", error);

  if (error.response) {
    console.error(
      "Status:",
      error.response.status
    );

    console.error(
      "Response:",
      error.response.data
    );
  } else if (error.request) {
    console.error(
      "No response received from backend."
    );
  } else {
    console.error(
      "Request error:",
      error.message
    );
  }

  throw error;
}


// ============================================================
// INCIDENTS
// ============================================================

export async function getIncidents() {
  try {
    const response = await api.get(
      "/api/v1/incidents"
    );

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}


export async function getIncident(
  incidentId
) {
  try {
    const response = await api.get(
      `/api/v1/incidents/${incidentId}`
    );

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}


// ============================================================
// AUTOMATIC DETECTION
// ============================================================

export async function detectIncidents() {
  try {
    const response = await api.post(
      "/api/v1/incidents/detect"
    );

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}


// ============================================================
// AI ANALYSIS
// ============================================================

export async function analyzeIncident(
  incidentId
) {
  try {
    const response = await api.get(
      `/api/v1/incidents/${incidentId}/analysis`
    );

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}


// ============================================================
// INCIDENT CONTEXT
// ============================================================

export async function getIncidentContext(
  incidentId
) {
  try {
    const response = await api.get(
      `/api/v1/incidents/${incidentId}/context`
    );

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}


// ============================================================
// REMEDIATION
// ============================================================

export async function getRemediation(
  incidentId
) {
  try {
    const response = await api.get(
      `/api/v1/incidents/${incidentId}/remediation`
    );

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}


// ============================================================
// APPROVE REMEDIATION
// ============================================================

export async function approveRemediation(
  incidentId
) {
  try {
    const response = await api.post(
      `/api/v1/incidents/${incidentId}/approve`
    );

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}


// ============================================================
// EXECUTE REMEDIATION
// ============================================================

export async function executeRemediation(
  incidentId
) {
  try {
    const response = await api.post(
      `/api/v1/incidents/${incidentId}/execute`
    );

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}


// ============================================================
// ROLLBACK REMEDIATION
// ============================================================

export async function rollbackRemediation(
  incidentId
) {
  try {
    const response = await api.post(
      `/api/v1/incidents/${incidentId}/rollback`
    );

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}


// ============================================================
// AUDIT LOGS
// ============================================================

export async function getAuditLogs(
  incidentId
) {
  try {
    const response = await api.get(
      `/api/v1/incidents/${incidentId}/audit`
    );

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}


// ============================================================
// TELEMETRY - METRICS
// ============================================================

export async function createMetric(
  metric
) {
  try {
    const response = await api.post(
      "/api/v1/telemetry/metrics",
      metric
    );

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}


export async function getMetrics(
  serviceId = null
) {
  try {
    const url = serviceId
      ? `/api/v1/telemetry/metrics?service_id=${encodeURIComponent(
          serviceId
        )}`
      : "/api/v1/telemetry/metrics";

    const response = await api.get(url);

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}


// ============================================================
// TELEMETRY - LOGS
// ============================================================

export async function createLog(
  log
) {
  try {
    const response = await api.post(
      "/api/v1/telemetry/logs",
      log
    );

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}


export async function getLogs(
  serviceId = null
) {
  try {
    const url = serviceId
      ? `/api/v1/telemetry/logs?service_id=${encodeURIComponent(
          serviceId
        )}`
      : "/api/v1/telemetry/logs";

    const response = await api.get(url);

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}


// ============================================================
// EXPORT API INSTANCE
// ============================================================

export default api;