"use client";

import {
  cloneElement,
  createElement,
  isValidElement,
  useId,
} from "react";
import type { ReactElement, ReactNode } from "react";

type FeedbackVariant = "loading" | "empty" | "error" | "denied" | "success";

export function FeedbackState({
  variant,
  title,
  description,
  action,
  className,
}: {
  variant: FeedbackVariant;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  const assertive = variant === "error" || variant === "denied";
  return createElement(
    "div",
    {
      className,
      "data-feedback": variant,
      role: assertive ? "alert" : "status",
      "aria-live": assertive ? "assertive" : "polite",
      "aria-busy": variant === "loading" || undefined,
    },
    createElement("strong", null, title),
    createElement("span", null, description),
    action,
  );
}

type FieldControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

export function FormField({
  label,
  description,
  error,
  children,
  className,
}: {
  label: string;
  description?: string;
  error?: string;
  children: ReactElement<FieldControlProps>;
  className?: string;
}) {
  const generatedId = useId();
  const controlId = children.props.id || `field-${generatedId.replaceAll(":", "")}`;
  const descriptionId = description ? `${controlId}-description` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [children.props["aria-describedby"], descriptionId, errorId].filter(Boolean).join(" ") || undefined;
  const control = isValidElement(children)
    ? cloneElement(children, {
        id: controlId,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : children.props["aria-invalid"],
      })
    : children;

  return createElement(
    "div",
    { className },
    createElement("label", { htmlFor: controlId }, label),
    description ? createElement("small", { id: descriptionId }, description) : null,
    control,
    error ? createElement("small", { id: errorId, role: "alert" }, error) : null,
  );
}
