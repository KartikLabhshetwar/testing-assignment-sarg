import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../index.css";
import Providers from "@/components/providers";
import { Sidebar } from "@/components/sidebar";
import { ToasterProvider } from "@/components/toaster-provider";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Business Intelligence Dashboard",
	description: "Advanced data analytics, automated reporting, and business intelligence tools",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<Providers>
					<div className="flex h-screen bg-background">
						<Sidebar />
						<main className="flex-1 overflow-y-auto">
							{children}
						</main>
					</div>
					<ToasterProvider />
				</Providers>
			</body>
		</html>
	);
}
