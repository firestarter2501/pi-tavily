import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description: "Search the web via Tavily. Use for current information.",
    parameters: Type.Object({
      query: Type.String({ description: "Search query" }),
      max_results: Type.Optional(Type.Number({ default: 5 })),
    }),
    async execute(_id, params, signal) {
      const key = process.env.TAVILY_API_KEY;
      if (!key) {
        throw new Error("TAVILY_API_KEY is not set. Start pi from a mise-activated shell or via `mise exec -- pi`.");
      }

      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        signal,
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: params.query,
          max_results: params.max_results ?? 5,
          include_answer: true,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Tavily API error ${res.status}: ${body}`);
      }

      const data: any = await res.json();
      const results: any[] = data.results ?? [];
      const text = [
        data.answer,
        ...results.map((r) => `## ${r.title}\n${r.url}\n${r.content}`),
      ].filter(Boolean).join("\n\n");

      return {
        content: [{ type: "text", text: text || "No results." }],
        details: {},
      };
    },
  });
}
