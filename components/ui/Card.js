"use client";

import { Card as AntCard } from "antd";

/**
 * Reusable Card component with consistent styling
 * @param {Object} props - Card props
 * @param {React.ReactNode} props.children - Card content
 * @param {React.ReactNode} props.title - Card title
 * @param {React.ReactNode} props.extra - Extra content in header
 * @param {boolean} props.hoverable - Whether card should be hoverable
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.rest - Additional Ant Design Card props
 */
export default function Card({
  children,
  title,
  extra,
  hoverable = false,
  className = "",
  ...rest
}) {
  return (
    <AntCard
      title={title}
      extra={extra}
      hoverable={hoverable}
      className={className}
      {...rest}
    >
      {children}
    </AntCard>
  );
}


