import createNextIntlPlugin from "next-intl/plugin";
import withPWA from "@ducanh2912/next-pwa";

const withNextIntl = createNextIntlPlugin("./i18n/request.js");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['antd', '@ant-design/icons'],
  },
  // Compress output
  compress: true,
  webpack: (config, { isServer, webpack }) => {
    // Suppress warnings about Critical dependency: the request of a dependency is an expression
    config.ignoreWarnings = [
      { module: /node_modules\/swagger-jsdoc/ },
      { module: /node_modules\/@supabase\/realtime-js/ },
    ];

    // Provide a mock for process.versions and process.version if they are missing
    // This helps with libraries like Supabase and Swagger that check for Node.js environment
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.versions': '({})',
        'process.version': '"v20.0.0"',
      })
    );

    return config;
  },
};

const pwaConfig = withPWA({
  dest: "public",
  disable: false, // Enable PWA in development to allow testing install prompt
  workboxOptions: {
    // Exclude chrome-extension and other unsupported schemes from precaching
    exclude: [
      ({ url }) => {
        // Exclude chrome-extension://, moz-extension://, and other extension schemes
        try {
          const urlObj = typeof url === "string" ? new URL(url) : url;
          return (
            urlObj.protocol === "chrome-extension:" ||
            urlObj.protocol === "moz-extension:" ||
            urlObj.protocol === "safari-extension:" ||
            urlObj.protocol === "ms-browser-extension:"
          );
        } catch {
          // If URL parsing fails, don't exclude (let it fail naturally)
          return false;
        }
      },
    ],
    // Runtime caching configuration - only cache http/https requests
    runtimeCaching: [
      {
        urlPattern: ({ url }) => {
          // Only cache http and https requests, exclude all extension schemes
          try {
            const urlObj = typeof url === "string" ? new URL(url) : url;
            return (
              urlObj.protocol === "http:" ||
              urlObj.protocol === "https:"
            );
          } catch {
            return false;
          }
        },
        handler: "NetworkFirst",
        options: {
          cacheName: "offlineCache",
          expiration: {
            maxEntries: 200,
          },
        },
      },
    ],
  },
});

export default withNextIntl(pwaConfig(nextConfig));
