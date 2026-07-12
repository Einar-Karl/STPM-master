"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied ✓",
  className = "",
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy:", text);
    }
  }

  return (
    <Button type="button" variant="ghost" onClick={copy} className={`text-xs ${className}`}>
      {copied ? copiedLabel : label}
    </Button>
  );
}
