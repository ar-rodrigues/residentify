"use client";

// Import Layout and its subcomponents from antd
// In Ant Design v5, subcomponents are attached as properties to Layout
import { Layout as AntLayout } from "antd";

/**
 * Reusable Layout components
 * These are re-exported from Ant Design Layout
 */
const Layout = AntLayout;

// Access subcomponents - they are attached to the Layout component
const Header = AntLayout.Header;
const Content = AntLayout.Content;
const Footer = AntLayout.Footer;
const Sider = AntLayout.Sider;

// Export all components
export { Layout };
export { Header };
export { Content };
export { Footer };
export { Sider };

export default Layout;
