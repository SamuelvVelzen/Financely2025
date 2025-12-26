"use client";

import { useState } from "react";
import { HiEye, HiEyeSlash } from "react-icons/hi2";
import { BaseInput, type IBaseInputProps } from "./input";

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
            <HiEyeSlash className="size-5" />
          ) : (
            <HiEye className="size-5" />
          )}
        </button>
      }
    />
  );
}
