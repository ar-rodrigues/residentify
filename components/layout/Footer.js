"use client";

import { Layout } from "antd";

const { Footer: LayoutFooter } = Layout;

/**
 * Reusable Footer component
 * @param {Object} props - Footer props
 * @param {React.ReactNode} props.children - Footer content
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.rest - Additional Ant Design Footer props
 */
export default function Footer({ children, className = "", ...rest }) {
  return (
    <LayoutFooter
      className={`text-center bg-gray-50 border-t border-gray-200 py-6 ${className}`}
      {...rest}
    >
      {children}
    </LayoutFooter>
  );
}


