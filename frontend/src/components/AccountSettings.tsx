import { useState } from "react";
import "./AccountSettings.css";

type Props = {
  user?: {
    name: string;
    email: string;
  };
  onSave?: (data: Record<string, unknown>) => Promise<void>;
};

/** #53 — Validation errors keyed by field name */
type FieldErrors = Partial<Record<"name" | "email", string>>;

export default function AccountSettings({ user, onSave }: Props) {
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    notifications: true,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleChange = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear individual field error on change
    if (key === "name" || key === "email") {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  /** #53 — Client-side required-field validation */
  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!form.name.trim()) {
      errors.name = "Name is required.";
    }
    if (!form.email.trim()) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = "Enter a valid email address.";
    }
    return errors;
  }

  const handleSubmit = async () => {
    setMessage(null);

    // Run validation before submitting
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    setFieldErrors({});

    try {
      await onSave?.(form);
      setMessage("Settings saved successfully.");
      setMessageType("success");
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Failed to save settings.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-container">
      <h2>Account Settings</h2>

      {/* Profile Section */}
      <div className="settings-section">
        <h3>Profile</h3>

        {/* #53 — required + aria attributes; #54 — error paired with text */}
        <label htmlFor="settings-name">
          Name <span aria-hidden="true" className="settings-required">*</span>
        </label>
        <input
          id="settings-name"
          type="text"
          value={form.name}
          required
          aria-required="true"
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "settings-name-error" : undefined}
          onChange={(e) => handleChange("name", e.target.value)}
          className={fieldErrors.name ? "settings-input settings-input--error" : "settings-input"}
        />
        {fieldErrors.name && (
          <p id="settings-name-error" role="alert" className="settings-field-error">
            {/* Icon + text so the error is not conveyed by colour alone (#54) */}
            <span aria-hidden="true" className="settings-error-icon">⚠</span>
            {fieldErrors.name}
          </p>
        )}

        <label htmlFor="settings-email" style={{ marginTop: "1rem", display: "block" }}>
          Email <span aria-hidden="true" className="settings-required">*</span>
        </label>
        <input
          id="settings-email"
          type="email"
          value={form.email}
          required
          aria-required="true"
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "settings-email-error" : undefined}
          onChange={(e) => handleChange("email", e.target.value)}
          className={fieldErrors.email ? "settings-input settings-input--error" : "settings-input"}
        />
        {fieldErrors.email && (
          <p id="settings-email-error" role="alert" className="settings-field-error">
            <span aria-hidden="true" className="settings-error-icon">⚠</span>
            {fieldErrors.email}
          </p>
        )}
      </div>

      {/* Password Section */}
      <div className="settings-section">
        <h3>Security</h3>

        <label htmlFor="settings-password">New Password</label>
        <input
          id="settings-password"
          type="password"
          value={form.password}
          onChange={(e) => handleChange("password", e.target.value)}
          className="settings-input"
        />
      </div>

      {/* Preferences */}
      <div className="settings-section">
        <h3>Preferences</h3>

        <label className="toggle">
          <input
            type="checkbox"
            checked={form.notifications}
            onChange={(e) =>
              handleChange("notifications", e.target.checked)
            }
          />
          Enable Notifications
        </label>
      </div>

      {/* Feedback — #54: success/error conveyed by text + icon, not colour alone */}
      {message && (
        <p
          role="status"
          aria-live="polite"
          className={`settings-message settings-message--${messageType}`}
        >
          <span aria-hidden="true" className="settings-status-icon">
            {messageType === "success" ? "✓" : "⚠"}
          </span>
          {message}
        </p>
      )}

      {/* Actions */}
      <button
        className="settings-save-btn"
        onClick={handleSubmit}
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}