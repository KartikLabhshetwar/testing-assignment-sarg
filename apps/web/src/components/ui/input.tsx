import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				"file:text-foreground placeholder:text-muted-foreground selection:bg-black selection:text-white border-4 border-black flex h-12 w-full min-w-0 rounded-none bg-white px-4 py-3 text-base font-medium transition-all outline-none file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-base file:font-bold disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
				"focus-visible:border-black focus-visible:ring-0 focus-visible:ring-offset-0",
				"aria-invalid:border-red-500",
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
