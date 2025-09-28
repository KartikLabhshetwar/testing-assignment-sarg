import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

export default function UserMenu() {
	const router = useRouter();
	const { data: session, isPending } = authClient.useSession();
	const [isSigningOut, setIsSigningOut] = useState(false);

	if (isPending) {
		return <Skeleton className="h-9 w-24" />;
	}

	if (!session) {
		return (
			<Button variant="outline" asChild>
				<Link href="/login">Sign In</Link>
			</Button>
		);
	}

	const handleSignOut = async () => {
		try {
			setIsSigningOut(true);
			const { data, error } = await authClient.signOut({
				fetchOptions: {
					onSuccess: () => {
						router.push("/");
					},
					onError: (ctx) => {
						console.error("Sign out error:", ctx.error);
						alert(`Sign out failed: ${ctx.error.message}`);
					},
				},
			});
			
			if (error) {
				console.error("Sign out error:", error);
				alert(`Sign out failed: ${error.message}`);
			}
		} catch (error) {
			console.error("Sign out error:", error);
			alert("Sign out failed. Please try again.");
		} finally {
			setIsSigningOut(false);
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline">{session.user.name}</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="bg-card">
				<DropdownMenuLabel>My Account</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem>{session.user.email}</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Button
						variant="destructive"
						className="w-full"
						onClick={handleSignOut}
						disabled={isSigningOut}
					>
						{isSigningOut ? "Signing Out..." : "Sign Out"}
					</Button>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
