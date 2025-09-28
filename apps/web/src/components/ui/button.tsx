import * as React from "react";
import { Slot as SlotPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-none text-base font-bold uppercase tracking-wide transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-black focus-visible:ring-0 focus-visible:ring-offset-0 aria-invalid:border-red-500",
	{
		variants: {
			variant: {
				default:
					"bg-black text-white border-4 border-black hover:bg-white hover:text-black",
				destructive:
					"bg-red-500 text-white border-4 border-red-500 hover:bg-white hover:text-red-500",
				outline:
					"border-4 border-black bg-white text-black hover:bg-black hover:text-white",
				secondary:
					"bg-gray-100 text-black border-4 border-gray-300 hover:bg-gray-300",
				ghost:
					"hover:bg-gray-100 hover:text-black border-4 border-transparent hover:border-gray-300",
				link: "text-black underline-offset-4 hover:underline border-0",
			},
			size: {
				default: "h-12 px-6 py-3 has-[>svg]:px-4",
				sm: "h-10 gap-2 px-4 has-[>svg]:px-3",
				lg: "h-14 px-8 has-[>svg]:px-6",
				icon: "size-12",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant,
	size,
	asChild = false,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? SlotPrimitive.Slot : "button";

	return (
		<Comp
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
