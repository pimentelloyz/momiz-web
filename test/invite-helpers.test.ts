import assert from "node:assert/strict";
import test from "node:test";
import { firstValue, formatEventDate, safeColor } from "../lib/invite-helpers.ts";

test("firstValue returns the first query value", () => {
  assert.equal(firstValue("guest-1"), "guest-1");
  assert.equal(firstValue(["guest-1", "guest-2"]), "guest-1");
  assert.equal(firstValue(), undefined);
});

test("safeColor normalizes API-supported six-digit hex colors", () => {
  assert.equal(safeColor("#Aa09fF"), "#aa09ff");
  assert.equal(safeColor("#112233"), "#112233");
});

test("safeColor rejects unsupported formats and uses the requested fallback", () => {
  assert.equal(safeColor("#fff", "#000000"), "#000000");
  assert.equal(safeColor("#11223344", "#000000"), "#000000");
  assert.equal(safeColor(" #112233", "#000000"), "#000000");
  assert.equal(safeColor("red", "#000000"), "#000000");
  assert.equal(safeColor(null, "#000000"), "#000000");
  assert.equal(safeColor(undefined), undefined);
});

test("formatEventDate formats valid dates in the event timezone", () => {
  assert.match(formatEventDate("2026-10-20T00:00:00.000Z") ?? "", /19 de outubro de 2026/i);
  assert.equal(formatEventDate("not-a-date"), null);
});
