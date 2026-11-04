import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import test from "node:test";
import { FeedbackState, FormField } from "../app/admin/ui/admin-primitives.ts";

test("feedback variants announce loading, success and actionable failures", () => {
  const loading = renderToStaticMarkup(createElement(FeedbackState, {
    variant: "loading",
    title: "Carregando",
    description: "Aguarde.",
  }));
  assert.match(loading, /role="status"/);
  assert.match(loading, /aria-live="polite"/);
  assert.match(loading, /aria-busy="true"/);

  const success = renderToStaticMarkup(createElement(FeedbackState, {
    variant: "success",
    title: "Concluído",
    description: "Alteração salva.",
  }));
  assert.match(success, /data-feedback="success"/);
  assert.match(success, /role="status"/);

  for (const variant of ["error", "denied"] as const) {
    const failure = renderToStaticMarkup(createElement(FeedbackState, {
      variant,
      title: "Não foi possível continuar",
      description: "Revise e tente novamente.",
      action: createElement("button", { type: "button" }, "Tentar novamente"),
    }));
    assert.match(failure, /role="alert"/);
    assert.match(failure, /aria-live="assertive"/);
    assert.match(failure, /<button type="button">Tentar novamente<\/button>/);
  }
});

test("form field associates label, help and persistent error with its control", () => {
  // createElement requires the typed child in props because this Node test does not transpile JSX.
  // eslint-disable-next-line react/no-children-prop
  const markup = renderToStaticMarkup(createElement(FormField, {
    label: "Justificativa",
    description: "Explique a decisão.",
    error: "Use pelo menos 10 caracteres.",
    children: createElement("textarea", { id: "review-reason" }),
  }));
  assert.match(markup, /<label for="review-reason">Justificativa<\/label>/);
  assert.match(markup, /aria-describedby="review-reason-description review-reason-error"/);
  assert.match(markup, /aria-invalid="true"/);
  assert.match(markup, /id="review-reason-error" role="alert"/);
});
