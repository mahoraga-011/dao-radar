"use client";

import { CircleNotch } from "@phosphor-icons/react";

export default function LoadingSpinner({ size = 24, className = "" }: { size?: number; className?: string }) {
  return <CircleNotch size={size} className={`animate-spin text-accent ${className}`} />;
}
