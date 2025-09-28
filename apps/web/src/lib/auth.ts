import { betterAuth, type BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";

const baseURL = process.env.BETTER_AUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

console.log("Better Auth Configuration:", {
	baseURL,
	nodeEnv: process.env.NODE_ENV,
	vercelUrl: process.env.VERCEL_URL,
	betterAuthUrl: process.env.BETTER_AUTH_URL,
	databaseUrl: process.env.DATABASE_URL ? "Set" : "Not set",
});

export const auth = betterAuth<BetterAuthOptions>({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	baseURL,
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
