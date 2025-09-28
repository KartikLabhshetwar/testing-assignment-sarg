import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth.handler);

export const GET = async (request: Request) => {
	try {
		return await handler.GET(request);
	} catch (error) {
		console.error("Auth GET error:", error);
		return new Response(JSON.stringify({ error: "Auth GET failed" }), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};

export const POST = async (request: Request) => {
	try {
		return await handler.POST(request);
	} catch (error) {
		console.error("Auth POST error:", error);
		return new Response(JSON.stringify({ error: "Auth POST failed" }), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
