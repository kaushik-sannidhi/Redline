import { z } from "zod";

export const scanRequestSchema = z.object({
  url: z
    .string()
    .trim()
    .url()
    .refine((value) => ["http:", "https:"].includes(new URL(value).protocol), {
      message: "Only http and https URLs can be scanned."
    }),
  repoUrl: z.string().trim().url().optional().or(z.literal(""))
});

export const rescanRequestSchema = z.object({
  hash: z.string().min(4).max(64)
});

export const githubAnalyzeRequestSchema = z.object({
  repoUrl: z.string().trim().url()
});

export const remediateRequestSchema = z.object({
  hash: z.string().min(4).max(64),
  findingIds: z.array(z.string().min(1)).min(1).max(20).optional(),
  findingIndexes: z.array(z.number().int().min(0)).min(1).max(20).optional()
});
