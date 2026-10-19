import { createServer } from "node:http";

const port = 3022;

const eventDetails = {
  event: {
    title: "Chá da família Teste",
    subtitle: "Um encontro especial",
    description: "Fixture pública sem dados reais.",
    eventDateTime: "2027-03-20T15:00:00.000Z",
    dressCode: "Confortável",
    footerMessage: "Esperamos você!",
  },
  address: {
    venueName: "Espaço de Testes",
    city: "Cidade Exemplo",
    state: "SP",
    isRedacted: true,
  },
  theme: {
    heroTitle: "Nosso chá de teste",
    heroSubtitle: "Perto ou de longe",
    backgroundColor: "#faf7f2",
    primaryColor: "#7b3f61",
  },
};

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

  if (url.pathname === "/health") {
    response.writeHead(204).end();
    return;
  }

  const match = url.pathname.match(/^\/api\/events\/by-slug\/([^/]+)\/details$/);
  if (!match) {
    response.writeHead(404).end();
    return;
  }

  const slug = decodeURIComponent(match[1]);
  if (slug === "smoke") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(eventDetails));
    return;
  }

  if (slug === "transient") {
    response.writeHead(503, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "temporary fixture failure" }));
    return;
  }

  response.writeHead(404, { "content-type": "application/json" });
  response.end(JSON.stringify({ error: "fixture not found" }));
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Mock invite API listening on http://127.0.0.1:${port}`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
