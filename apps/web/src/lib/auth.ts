import { betterAuth, type BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";

export const auth = betterAuth<BetterAuthOptions>({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	baseURL: process.env.BETTER_AUTH_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000",
	trustedOrigins: [
		process.env.CORS_ORIGIN || "",
		process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000",
		"https://testing-assignment-sarg-web.vercel.app"
	],
	emailAndPassword: {
		enabled: true,
	},
	advanced: {
		defaultCookieAttributes: {
			sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
			secure: process.env.NODE_ENV === "production",
			httpOnly: true,
		},
	},
});
