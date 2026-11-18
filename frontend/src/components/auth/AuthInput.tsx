import { useState } from "react";
import type { InputHTMLAttributes } from "react";

import mailIcon from "../../assets/icons/Mail.svg";
import lockIcon from "../../assets/icons/Lock.svg";
import eyeIcon from "../../assets/icons/EyeDotted.svg";
import eyeOffIcon from "../../assets/icons/EyeOff.svg";

type AuthInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "type" | "placeholder"
> & {
  id: string;
  label: string;
  type: "email" | "password";
};

export default function AuthInput({
  id,
  label,
  type,
  ...inputProps
}: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className="auth-input">
      {/* Keep a permanent accessible name when the placeholder disappears. */}
      <label className="auth-layout__sr-only" htmlFor={id}>
        {label}
      </label>

      <div
        className={`auth-input__control${
          isPassword ? " auth-input__control--password" : ""
        }`}
      >
        <img
          className="auth-input__icon"
          src={isPassword ? lockIcon : mailIcon}
          alt=""
          aria-hidden="true"
        />

        <input
          {...inputProps}
          id={id}
          type={inputType}
          placeholder={label}
        />

        {isPassword && (
          <button
            className="auth-input__toggle"
            type="button"
            disabled={inputProps.disabled}
            aria-label={`Show ${label.toLowerCase()}`}
            aria-pressed={showPassword}
            aria-controls={id}
            onClick={() => setShowPassword((current) => !current)}
          >
            <img
              src={showPassword ? eyeOffIcon : eyeIcon}
              alt=""
              aria-hidden="true"
            />
          </button>
        )}
      </div>
    </div>
  );
}