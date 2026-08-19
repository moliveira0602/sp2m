import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// NOTE: z.record() with a z.union() value schema crashes the TanStack Start
// server-fn client/server split during Rollup bundling (bug in the plugin's
// AST splitting, unrelated to this app). Validate answers manually instead.
function isValidAnswers(
  value: unknown,
): value is Record<string, number | "na"> {
  if (typeof value !== "object" || value === null) return false;
  return Object.values(value).every(
    (v) => v === "na" || (typeof v === "number" && v >= 0 && v <= 5),
  );
}

const answersSchema = z.record(z.string(), z.any()).refine(isValidAnswers, {
  message: "Cada resposta deve ser um número de 0 a 5 ou 'na'.",
});

export const sendDiagnosticFull = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      profile: z.object({
        company: z.string().min(1),
        cnpj: z.string().optional().default(""),
        contact: z.string().min(1),
        role: z.string().optional().default(""),
        email: z.string().email(),
        whatsapp: z.string().min(1),
        segment: z.string().min(1),
        revenue: z.string().optional().default(""),
        employees: z.string().optional().default(""),
        units: z.string().optional().default(""),
        city: z.string().optional().default(""),
        state: z.string().optional().default(""),
        system: z.string().optional().default(""),
        consent: z.literal(true),
      }),
      answers: answersSchema,
      protocol: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const { sendDiagnosticFullEmails } =
      await import("./send-diagnostic-full.server");
    return await sendDiagnosticFullEmails(
      data as Parameters<typeof sendDiagnosticFullEmails>[0],
    );
  });
