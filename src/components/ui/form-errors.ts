"use client";

import { createContext, useContext } from "react";

/** Field errors of the surrounding ActionForm, so fields can show them without render-prop children. */
export const FormErrorsContext = createContext<Record<string, string>>({});

export function useFieldError(name: string | undefined, explicit?: string) {
  const ctx = useContext(FormErrorsContext);
  return explicit ?? (name ? ctx[name] : undefined);
}
