import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	serverExternalPackages: ['puppeteer'],
	outputFileTracingRoot: '/Users/kartiklabhshetwar/Projects/testing-assignment-sarg',
	webpack: (config) => {
		config.externals = [...config.externals, 'canvas', 'jsdom'];
		return config;
	},
};

export default nextConfig;
