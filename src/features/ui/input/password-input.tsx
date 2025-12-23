"use client";

import { BaseInput, type IBaseInputProps } from "./input";
import { useState } from "react";
import { HiEye, HiEyeSlash } from "react-icons/hi2";

export type IPasswordInputProps = Omit<IBaseInputProps, "type">;

export function PasswordInput(props: IPasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <BaseInput
      {...props}
      type={showPassword ? "text" : "password"}
      suffixIcon={
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="cursor-pointer hover:opacity-70 transition-opacity"
          aria-label={showPassword ? "Hide password" : "Show password"}>
          {showPassword ? (
            <HiEyeSlash className="w-5 h-5" />
          ) : (
            <HiEye className="w-5 h-5" />
          )}
        </button>
      }
    />
  );
}

