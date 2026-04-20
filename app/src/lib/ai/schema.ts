import { z } from "zod";

export const MarketCategory = z.enum([
  "sports",
  "politics",
  "economics",
  "culture",
  "other",
]);

export const MarketSpecSchema = z.object({
  question: z
    .string()
    .describe(
      "A precise YES/NO prediction question, 10-120 characters. Must be unambiguously resolvable.",
    ),
  resolutionCriteria: z
    .string()
    .describe(
      "One or two sentences stating exactly how the market resolves YES, NO, or INVALID. Name the authoritative source if any.",
    ),
  category: MarketCategory.describe(
    "Best-fit topic. Use 'other' only if none of the named categories fit.",
  ),
  closeIsoDate: z
    .string()
    .describe(
      "ISO 8601 date (YYYY-MM-DD) for when trading should close. Always strictly after today.",
    ),
  resolveIsoDate: z
    .string()
    .describe(
      "ISO 8601 date (YYYY-MM-DD) for when the outcome can be determined. Must be >= closeIsoDate.",
    ),
  tags: z
    .array(z.string())
    .max(5)
    .describe("Up to 5 lowercase short tags (e.g., 'fifa', 'argentina')."),
  safetyFlag: z
    .enum(["safe", "unsafe"])
    .describe(
      "Mark 'unsafe' if the proposed market would violate policy (harm to persons, harassment, CSAM, extremist content).",
    ),
  safetyReason: z
    .string()
    .optional()
    .describe("If safetyFlag is 'unsafe', explain in one sentence."),
});

export type MarketSpec = z.infer<typeof MarketSpecSchema>;
