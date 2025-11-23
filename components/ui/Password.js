"use client";

import { Input } from "antd";

const { Password: AntPassword } = Input;

/**
 * Reusable Password Input component with React Icons support
 * @param {Object} props - Password Input props
 * @param {React.ReactNode} props.prefixIcon - React Icon component to display as prefix
 * @param {string} props.placeholder - Input placeholder
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.disabled - Disabled state
 * @param {Object} props.rest - Additional Ant Design Password Input props
 */
export default function Password({
  prefixIcon,
  placeholder,
  value,
  onChange,
  className = "",
  disabled = false,
  ...rest
}) {
  const prefix = prefixIcon ? (
    <span className="text-gray-400">{prefixIcon}</span>
  ) : undefined;

  return (
    <AntPassword
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      prefix={prefix}
      disabled={disabled}
      className={className}
      {...rest}
    />
  );
}

