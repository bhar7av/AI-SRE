import { useEffect, useState } from "react";
import {
  getServices,
  createService,
  addDependency,
} from "../api/services";

export default function ServicesPanel() {
  const [services, setServices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedService, setSelectedService] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    owner: "",
    environment: "production",
    repository: "",
    health_endpoint: "",
  });

  async function loadServices() {
    try {
      const data = await getServices();
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Unable to load services."
      );
    }
  }

  useEffect(() => {
    loadServices();
  }, []);

  function updateField(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleCreate(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      setMessage("");

      await createService({
        name: form.name.trim(),
        description: form.description.trim() || null,
        owner: form.owner.trim() || null,
        environment: form.environment,
        repository: form.repository.trim() || null,
        health_endpoint:
          form.health_endpoint.trim() || null,
      });

      setForm({
        name: "",
        description: "",
        owner: "",
        environment: "production",
        repository: "",
        health_endpoint: "",
      });

      setShowForm(false);
      setMessage("Service connected successfully.");
      await loadServices();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Failed to connect service."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDependency(serviceId, dependencyId) {
    if (!serviceId || !dependencyId) return;

    try {
      setLoading(true);
      setError("");
      setMessage("");

      await addDependency(serviceId, {
        dependency_id: dependencyId,
        dependency_type: "runtime",
      });

      setMessage("Service dependency connected.");
      setSelectedService("");
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Failed to connect dependency."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="services-panel">
      <div className="services-header">
        <div>
          <div className="eyebrow">Service Registry</div>

          <h2 className="services-title">
            Connected Services
          </h2>

          <p className="services-description">
            Connect production services to AI-SRE and map
            their dependencies for intelligent incident analysis.
          </p>
        </div>

        <button
          className="connect-service-button"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Close" : "+ Connect Service"}
        </button>
      </div>

      {message && (
        <div className="service-message success">
          ✓ {message}
        </div>
      )}

      {error && (
        <div className="service-message error">
          {error}
        </div>
      )}

      {showForm && (
        <form
          className="service-form"
          onSubmit={handleCreate}
        >
          <div className="service-form-heading">
            <span>Connect a production service</span>
            <small>All fields except name are optional.</small>
          </div>

          <div className="service-form-grid">
            <label>
              Service name *
              <input
                name="name"
                value={form.name}
                onChange={updateField}
                placeholder="payments-api"
                required
              />
            </label>

            <label>
              Environment
              <select
                name="environment"
                value={form.environment}
                onChange={updateField}
              >
                <option value="production">
                  Production
                </option>
                <option value="staging">
                  Staging
                </option>
                <option value="development">
                  Development
                </option>
              </select>
            </label>

            <label>
              Owner
              <input
                name="owner"
                value={form.owner}
                onChange={updateField}
                placeholder="payments-team"
              />
            </label>

            <label>
              Health endpoint
              <input
                name="health_endpoint"
                value={form.health_endpoint}
                onChange={updateField}
                placeholder="https://payments.example.com/health"
              />
            </label>

            <label className="full-width">
              Repository
              <input
                name="repository"
                value={form.repository}
                onChange={updateField}
                placeholder="https://github.com/company/payments"
              />
            </label>

            <label className="full-width">
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={updateField}
                placeholder="Handles payment processing and transaction orchestration."
                rows="3"
              />
            </label>
          </div>

          <div className="service-form-actions">
            <button
              type="submit"
              className="connect-submit"
              disabled={loading}
            >
              {loading
                ? "Connecting..."
                : "Connect Service"}
            </button>
          </div>
        </form>
      )}

      <div className="services-list">
        {services.length === 0 ? (
          <div className="services-empty">
            <div className="services-empty-icon">+</div>
            <h3>No services connected</h3>
            <p>
              Connect your first production service to start
              receiving telemetry and detecting incidents.
            </p>
          </div>
        ) : (
          services.map((service) => (
            <div
              className="service-card"
              key={service.id}
            >
              <div className="service-card-main">
                <div className="service-status-dot" />

                <div>
                  <div className="service-name">
                    {service.name}
                  </div>

                  <div className="service-id">
                    {service.id}
                  </div>

                  {service.description && (
                    <p className="service-description">
                      {service.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="service-card-meta">
                <span className="environment-badge">
                  {service.environment}
                </span>

                {service.owner && (
                  <span>{service.owner}</span>
                )}
              </div>

              <div className="service-card-actions">
                <select
                  value={
                    selectedService === service.id
                      ? ""
                      : selectedService
                  }
                  onChange={(event) => {
                    setSelectedService(event.target.value);

                    if (event.target.value) {
                      handleDependency(
                        service.id,
                        event.target.value
                      );
                    }
                  }}
                  disabled={
                    loading || services.length < 2
                  }
                >
                  <option value="">
                    Connect dependency
                  </option>

                  {services
                    .filter(
                      (candidate) =>
                        candidate.id !== service.id
                    )
                    .map((candidate) => (
                      <option
                        key={candidate.id}
                        value={candidate.id}
                      >
                        → {candidate.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          ))
        )}
      </div>

      {services.length > 0 && (
        <div className="integration-note">
          <div className="integration-note-icon">
            ↗
          </div>

          <div>
            <strong>Telemetry integration</strong>

            <p>
              Send metrics to{" "}
              <code>
                /api/v1/telemetry/metrics
              </code>{" "}
              using the connected service ID.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
