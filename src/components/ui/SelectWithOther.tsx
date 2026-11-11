"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, type SelectProps } from "@/components/ui/select";

export const NEW_VALUE = "__new";

type Props = Omit<SelectProps, "onChange"> & {
  /** Name of the text input that carries the manually typed value. */
  otherName: string;
  otherLabel: string;
  otherPlaceholder?: string;
  otherMaxLength?: number;
  optionLabel: string;
};

/** A select with a final "not listed" choice that reveals a text field. */
export function SelectWithOther({ otherName, otherLabel, otherPlaceholder, otherMaxLength = 160, optionLabel, options, defaultValue, ...rest }: Props) {
  const [value, setValue] = useState(String(defaultValue ?? ""));
  return (
    <div className="space-y-3">
      <Select
        {...rest}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        options={[...options, { value: NEW_VALUE, label: optionLabel }]}
      />
      {value === NEW_VALUE && (
        <Input name={otherName} label={otherLabel} placeholder={otherPlaceholder} maxLength={otherMaxLength} autoFocus />
      )}
    </div>
  );
}
