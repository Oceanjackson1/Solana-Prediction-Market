import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { MarketSpecSchema } from "@/lib/ai/schema";
import { SYSTEM_PROMPT } from "@/lib/ai/prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const InputSchema = z.object({
  prompt: z.string().min(3).max(800),
  sourceUrl: z.string().url().optional(),
});

function schemaToJsonSchema() {
  return {
    type: "object",
    properties: {
      question: { type: "string", minLength: 10, maxLength: 120 },
      resolutionCriteria: { type: "string", maxLength: 400 },
      category: {
        type: "string",
        enum: ["sports", "politics", "economics", "culture", "other"],
      },
      closeIsoDate: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
      resolveIsoDate: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
      tags: {
        type: "array",
        items: { type: "string" },
        maxItems: 5,
      },
      safetyFlag: { type: "string", enum: ["safe", "unsafe"] },
      safetyReason: { type: "string" },
    },
    required: [
      "question",
      "resolutionCriteria",
      "category",
      "closeIsoDate",
      "resolveIsoDate",
      "tags",
      "safetyFlag",
    ],
    additionalProperties: false,
  };
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set on the server" },
      { status: 500 },
    );
  }

  let body: z.infer<typeof InputSchema>;
  try {
    body = InputSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "invalid payload" },
      { status: 400 },
    );
  }

  const client = new Anthropic({ apiKey });
  const today = new Date().toISOString().slice(0, 10);

  const userContent = body.sourceUrl
    ? `Today is ${today}.\nUser prompt: ${body.prompt}\nSource URL (optional): ${body.sourceUrl}`
    : `Today is ${today}.\nUser prompt: ${body.prompt}`;

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: schemaToJsonSchema(),
        },
      },
      messages: [{ role: "user", content: userContent }],
    });

    const textBlock = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text",
    );
    if (!textBlock) {
      return NextResponse.json(
        { error: "no text block in response" },
        { status: 502 },
      );
    }
    const parsed = MarketSpecSchema.safeParse(JSON.parse(textBlock.text));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "schema validation failed", detail: parsed.error.issues },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        spec: parsed.data,
        usage: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
          cacheRead: response.usage.cache_read_input_tokens ?? 0,
          cacheWrite: response.usage.cache_creation_input_tokens ?? 0,
        },
      },
      { status: 200 },
    );
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `claude: ${e.message}`, status: e.status },
        { status: e.status ?? 502 },
      );
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
