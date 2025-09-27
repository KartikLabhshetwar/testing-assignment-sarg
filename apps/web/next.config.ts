import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	eslint: {
		ignoreDuringBuilds: true,
	},
	outputFileTracingRoot: '/Users/kartiklabhshetwar/Projects/testing-assignment-sarg',
};

export default nextConfig;
