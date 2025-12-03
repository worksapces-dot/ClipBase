import { ComponentPropsWithoutRef, ReactNode } from "react";
import { ArrowRightIcon } from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
  className?: string;
}

interface BentoCardProps extends ComponentPropsWithoutRef<"div"> {
  name: string;
  className: string;
  background: ReactNode;
  Icon: React.ElementType;
  description: string;
  href: string;
  cta: string;
}

const BentoGrid = ({ children, className, ...props }: BentoGridProps) => {
  return (
    <div
      className={cn(
        "grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  ...props
}: BentoCardProps) => (
  <div
    key={name}
    className={cn(
      "group relative flex flex-col overflow-hidden rounded-2xl",
      "bg-neutral-900/80 border border-white/10",
      "hover:border-white/20 hover:bg-neutral-900 transition-all duration-300",
      className
    )}
    {...props}
  >
    {/* Gradient background area */}
    <div className="relative h-32 overflow-hidden">
      {background}
    </div>

    {/* Content */}
    <div className="flex flex-col flex-1 p-6">
      <Icon className="h-8 w-8 text-white/80 mb-4" />
      <h3 className="text-base font-semibold text-white mb-2">{name}</h3>
      <p className="text-white/50 text-sm leading-relaxed flex-1">
        {description}
      </p>

      <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Button
          variant="link"
          asChild
          size="sm"
          className="p-0 h-auto text-white/70 hover:text-white"
        >
          <a href={href}>
            {cta}
            <ArrowRightIcon className="ms-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  </div>
);

export { BentoCard, BentoGrid };
