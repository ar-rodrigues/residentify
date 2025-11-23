"use client";

import { Button as AntButton } from "antd";

/**
 * Reusable Button component with React Icons support
 * @param {Object} props - Button props
 * @param {React.ReactNode} props.icon - React Icon component to display
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.type - Button type (primary, default, dashed, link, text)
 * @param {string} props.size - Button size (small, middle, large)
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.disabled - Disabled state
 * @param {Function} props.onClick - Click handler
 * @param {string} props.htmlType - HTML button type (button, submit, reset)
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.rest - Additional Ant Design Button props
 */
export default function Button({
  icon,
  children,
  type = "primary",
  size = "middle",
  loading = false,
  disabled = false,
  onClick,
  htmlType,
  className = "",
  ...rest
}) {
  return (
    <AntButton
      type={type}
      size={size}
      loading={loading}
      disabled={disabled}
      onClick={onClick}
      htmlType={htmlType}
      icon={icon}
      className={className}
      {...rest}
    >
      {children}
    </AntButton>
  );
}


