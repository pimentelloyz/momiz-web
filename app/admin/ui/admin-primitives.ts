"use client";

import {
  cloneElement,
  createElement,
  isValidElement,
  useId,
} from "react";
import type { ReactElement, ReactNode } from "react";
import { adminErrorMessage } from "./admin-api-client.ts";
import type { AdminMutationState } from "./admin-query-state.ts";

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

export function MutationFeedback({
  state,
  pendingTitle,
  errorTitle,
  fallbackError,
  className,
}: {
  state: AdminMutationState;
  pendingTitle: string;
  errorTitle: string;
  fallbackError: string;
  className?: string;
}) {
  if (state.phase === "idle") return null;
  if (state.phase === "pending") {
    return createElement(FeedbackState, {
      variant: "loading",
      title: pendingTitle,
      description: "Aguarde a confirmação e a atualização dos dados.",
      className,
    });
  }
  if (state.phase === "error") {
    return createElement(FeedbackState, {
      variant: "error",
      title: errorTitle,
      description: adminErrorMessage(state.error, fallbackError),
      className,
    });
  }
  return createElement(FeedbackState, {
    variant: "success",
    title: "Operação concluída",
    description: state.message,
    className,
  });
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
