import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { MarketSpecSchema } from "@/lib/ai/schema";
import { SYSTEM_PROMPT } from "@/lib/ai/prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const InputSchema = z.object({
  prompt: z.string().min(3).max(800),
  sourceUrl: z.string().url().optional(),
});

const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";
const DEEPSEEK_MODEL = "deepseek-chat";

/**
 * DeepSeek occasionally wraps JSON in ```json ... ``` fences or adds
 * conversational prose. Strip fences and try to find the first {...} block.
 */
function extractJson(raw: string): string {
  let s = raw.trim();
  // Strip markdown code fences if present
  const fenceMatch = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenceMatch) s = fenceMatch[1].trim();
  // Fall back: find first { ... last }
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    s = s.slice(start, end + 1);
  }
  return s;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "DEEPSEEK_API_KEY is not set on the server" },
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

  const client = new OpenAI({ apiKey, baseURL: DEEPSEEK_BASE_URL });
  const today = new Date().toISOString().slice(0, 10);

  const userContent = body.sourceUrl
    ? `Today is ${today}.\nUser prompt: ${body.prompt}\nSource URL (optional): ${body.sourceUrl}`
    : `Today is ${today}.\nUser prompt: ${body.prompt}`;

  try {
    const response = await client.chat.completions.create({
      model: DEEPSEEK_MODEL,
      max_tokens: 2000,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "";
    if (!raw) {
      return NextResponse.json(
        { error: "empty response from model" },
        { status: 502 },
      );
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(extractJson(raw));
    } catch (e) {
      return NextResponse.json(
        {
          error: "model returned non-JSON output",
          detail: e instanceof Error ? e.message : String(e),
          raw: raw.slice(0, 500),
        },
        { status: 502 },
      );
    }

    const parsed = MarketSpecSchema.safeParse(parsedJson);
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
          input: response.usage?.prompt_tokens ?? 0,
          output: response.usage?.completion_tokens ?? 0,
          total: response.usage?.total_tokens ?? 0,
        },
        model: DEEPSEEK_MODEL,
      },
      { status: 200 },
    );
  } catch (e) {
    if (e instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `deepseek: ${e.message}`, status: e.status },
        { status: e.status ?? 502 },
      );
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
