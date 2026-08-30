import axios from "axios";

const API_BASE_URL = "https://ai-sre.onrender.com";


export async function getServices() {
  const response = await axios.get(
    `${API_BASE_URL}/api/v1/services`
  );
  return response.data;
}

export async function createService(data) {
  const response = await axios.post(
    `${API_BASE_URL}/api/v1/services`,
    data
  );
  return response.data;
}

export async function addDependency(serviceId, data) {
  const response = await axios.post(
    `${API_BASE_URL}/api/v1/services/${serviceId}/dependencies`,
    data
  );
  return response.data;
}
