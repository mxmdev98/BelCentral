// src/components/PasswordField.tsx
// A password input with an inline show/hide ("view password") toggle button.
// Works two ways:
//   1. Controlled via react-hook-form — spread the object returned by
//      register("password") into inputProps:
//        <PasswordField label="Password" inputProps={register("password")} />
//   2. Controlled via value/onChange — pass them as inputProps:
//        <PasswordField inputProps={{ value, onChange }} />
import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from "react";

interface PasswordFieldProps {
  label?: ReactNode;
  // Everything that goes onto the underlying <input>: the register() return,
  // or { value, onChange, ... }.
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  id?: string;
  className?: string;
  error?: ReactNode;
  showToggleLabel?: string;
  hideToggleLabel?: string;
}

const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(
  { label, inputProps, id, className = "", error, showToggleLabel, hideToggleLabel },
  ref,
) {
  const [visible, setVisible] = useState(false);
  const inputId = id ?? inputProps?.id;
  const toggleLabel = visible
    ? (hideToggleLabel ?? "Hide password")
    : (showToggleLabel ?? "Show password");

  return (
    <div className={className}>
      {label && <label className="label" htmlFor={inputId}>{label}</label>}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={visible ? "text" : "password"}
          className="input pr-11"
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={toggleLabel}
          title={toggleLabel}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700 focus:outline-none focus:text-brand-700"
        >
          {visible ? (
            // eye-off icon
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
              <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
              <line x1="2" y1="2" x2="22" y2="22" />
            </svg>
          ) : (
            // eye icon
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
});

export default PasswordField;
