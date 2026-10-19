import assert from "node:assert/strict";
import test from "node:test";
import { firstValue, formatEventDate, safeColor } from "../lib/invite-helpers.ts";

test("firstValue returns the first query value", () => {
  assert.equal(firstValue("guest-1"), "guest-1");
  assert.equal(firstValue(["guest-1", "guest-2"]), "guest-1");
  assert.equal(firstValue(), undefined);
});

test("safeColor accepts six-digit hex colors only", () => {
  assert.equal(safeColor("#Aa09fF", "#000000"), "#Aa09fF");
  assert.equal(safeColor("#fff", "#000000"), "#000000");
  assert.equal(safeColor("red", "#000000"), "#000000");
  assert.equal(safeColor(null, "#000000"), "#000000");
});

test("formatEventDate formats valid dates in the event timezone", () => {
  assert.match(formatEventDate("2026-10-20T00:00:00.000Z") ?? "", /19 de outubro de 2026/i);
  assert.equal(formatEventDate("not-a-date"), null);
});
