"use client";

import { Input as AntInput } from "antd";

/**
 * Reusable Input component with React Icons support
 * @param {Object} props - Input props
 * @param {React.ReactNode} props.prefixIcon - React Icon component to display as prefix
 * @param {React.ReactNode} props.suffixIcon - React Icon component to display as suffix
 * @param {string} props.type - Input type (text, password, email, etc.)
 * @param {string} props.placeholder - Input placeholder
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.loading - Loading state
 * @param {Object} props.rest - Additional Ant Design Input props
 */
export default function Input({
  prefixIcon,
  suffixIcon,
  type = "text",
  placeholder,
  value,
  onChange,
  className = "",
  disabled = false,
  loading = false,
  ...rest
}) {
  const prefix = prefixIcon ? (
    <span className="text-gray-400">{prefixIcon}</span>
  ) : undefined;

  const suffix = suffixIcon ? (
    <span className="text-gray-400">{suffixIcon}</span>
  ) : undefined;

  return (
    <AntInput
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      prefix={prefix}
      suffix={suffix}
      disabled={disabled}
      className={className}
      {...rest}
    />
  );
}

