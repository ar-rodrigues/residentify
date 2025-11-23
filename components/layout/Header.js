"use client";

import { Layout } from "antd";

const { Header: LayoutHeader } = Layout;

/**
 * Reusable Header component
 * @param {Object} props - Header props
 * @param {React.ReactNode} props.children - Header content
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.rest - Additional Ant Design Header props
 */
export default function Header({ children, className = "", ...rest }) {
  return (
    <LayoutHeader
      className={`flex items-center justify-between bg-white shadow-sm border-b border-gray-200 px-6 py-4 ${className}`}
      {...rest}
    >
      {children}
    </LayoutHeader>
  );
}
