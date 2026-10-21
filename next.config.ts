import type { NextConfig } from "next";

const config: NextConfig = {
  // Keep the project's existing AGENTS.md intact when starting development.
  agentRules: false,
};

export default config;
