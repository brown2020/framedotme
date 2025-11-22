import nextConfig from "eslint-config-next";

const next = Array.isArray(nextConfig)
  ? nextConfig
  : nextConfig.default ?? nextConfig;

const config = [
  {
    ignores: ["node_modules", ".next", "public", "dist"],
  },
  ...next,
];

export default config;

