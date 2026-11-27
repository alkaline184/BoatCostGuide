import type { ReactNode } from "react";

export function NumericField({
  id,
  label,
  value,
  onChange,
  unit,
  error,
  accessory,
  hint,
  whole,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  unit: string;
  error?: string;
  accessory?: ReactNode;
  hint?: string;
  whole?: boolean;
}) {
  const message = error || hint;
  return (
    <div className="numeric-field">
      <div className="field-heading">
        <label htmlFor={id}>{label}</label>
        {accessory}
      </div>
      <div className="input-shell" data-invalid={Boolean(error)}>
        {unit === "$" && (
          <>
            <span aria-hidden="true">$</span>
            <span className="sr-only" id={`${id}-unit`}>
              US dollars
            </span>
          </>
        )}
        <input
          id={id}
          type="text"
          value={value}
          inputMode={whole ? "numeric" : "decimal"}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={Boolean(error)}
          aria-describedby={
            [`${id}-unit`, message ? `${id}-message` : ""]
              .filter(Boolean)
              .join(" ") || undefined
          }
          onChange={(event) => onChange(event.target.value)}
        />
        {unit !== "$" && <span id={`${id}-unit`}>{unit}</span>}
      </div>
      {message && (
        <p
          id={`${id}-message`}
          className={error ? "field-error" : "fine-print"}
        >
          {message}
        </p>
      )}
    </div>
  );
}
