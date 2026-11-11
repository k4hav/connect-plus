"use client";

import { useState } from "react";
import { Check, Copy, Link2, Sparkles } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts / older browsers.
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export function CopyButton({
  text,
  label,
  copiedLabel = "Copied",
  icon = "copy",
  relativeUrl,
  ...props
}: {
  text?: string;
  /** If set, copies the absolute URL for this site path instead of `text`. */
  relativeUrl?: string;
  label: string;
  copiedLabel?: string;
  icon?: "copy" | "link" | "spark";
} & Omit<ButtonProps, "onClick" | "children">) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const Icon = icon === "link" ? Link2 : icon === "spark" ? Sparkles : Copy;

  async function onClick() {
    const value = relativeUrl ? `${window.location.origin}${relativeUrl}` : (text ?? "");
    const ok = await writeClipboard(value);
    setState(ok ? "copied" : "error");
    setTimeout(() => setState("idle"), 2000);
  }

  return (
    <Button type="button" onClick={onClick} {...props}>
      {state === "copied" ? <Check className="h-4 w-4" aria-hidden="true" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
      <span aria-live="polite">{state === "copied" ? copiedLabel : state === "error" ? "Copy failed" : label}</span>
    </Button>
  );
}
