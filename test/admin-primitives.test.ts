import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import test from "node:test";
import { FeedbackState, FormField, MutationFeedback } from "../app/admin/ui/admin-primitives.ts";
import { AdminApiError } from "../app/admin/ui/admin-api-client.ts";

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

  const empty = renderToStaticMarkup(createElement(FeedbackState, {
    variant: "empty",
    title: "Nenhuma atividade",
    description: "A consulta foi concluída sem ocorrências.",
  }));
  assert.match(empty, /data-feedback="empty"/);
  assert.match(empty, /role="status"/);

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

test("mutation feedback announces pending, correlated error and authoritative success", () => {
  const pending = renderToStaticMarkup(createElement(MutationFeedback, {
    state: { phase: "pending" },
    pendingTitle: "Registrando decisão",
    errorTitle: "Falha na decisão",
    fallbackError: "Não foi possível registrar.",
  }));
  assert.match(pending, /role="status"/);
  assert.match(pending, /aria-busy="true"/);

  const failure = renderToStaticMarkup(createElement(MutationFeedback, {
    state: { phase: "error", error: new AdminApiError({ message: "Conflito.", code: "CONFLICT", requestId: "req-mutation", status: 409 }) },
    pendingTitle: "Registrando decisão",
    errorTitle: "Falha na decisão",
    fallbackError: "Não foi possível registrar.",
  }));
  assert.match(failure, /role="alert"/);
  assert.match(failure, /Identificador: req-mutation/);

  const success = renderToStaticMarkup(createElement(MutationFeedback, {
    state: { phase: "success", message: "Fonte atualizada." },
    pendingTitle: "Registrando decisão",
    errorTitle: "Falha na decisão",
    fallbackError: "Não foi possível registrar.",
  }));
  assert.match(success, /role="status"/);
  assert.match(success, /Fonte atualizada/);
});
