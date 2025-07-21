import React from "react"
import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card: React.FC<CardProps> = ({ className, ...props }) => (
  <div
    className={cn(
      "rounded-lg border border-gray-200 bg-white text-gray-950 shadow-sm",
      className
    )}
    {...props}
  />
)

const CardHeader: React.FC<CardProps> = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
)

const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h3
    className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
    {...props}
  />
)

const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
  <p
    className={cn("text-sm text-gray-500", className)}
    {...props}
  />
)

const CardContent: React.FC<CardProps> = ({ className, ...props }) => (
  <div className={cn("p-6 pt-0", className)} {...props} />
)

const CardFooter: React.FC<CardProps> = ({ className, ...props }) => (
  <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
)

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }