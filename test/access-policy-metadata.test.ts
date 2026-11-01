import assert from "node:assert/strict";
import test from "node:test";
import {
  capabilityLabel,
  capabilityMetadata,
} from "../app/admin/ui/access-policy-metadata.ts";

test("describes host delivery without duplicating package eligibility", () => {
  assert.deepEqual(capabilityMetadata["gift.host_delivery"], {
    label: "Entrega no endereço do anfitrião",
    description:
      "Permite cadastrar um endereço privado para convidados enviarem presentes comprados fora do Momiz.",
    group: "Presentes",
  });
  assert.equal(
    capabilityLabel("gift.host_delivery"),
    "Entrega no endereço do anfitrião",
  );
});
