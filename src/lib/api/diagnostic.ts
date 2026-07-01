import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const sendDiagnostic = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      nome: z.string().min(1),
      empresa: z.string().min(1),
      faturamento: z.string().min(1),
      desafio: z.string().min(1),
      email: z.string().email(),
      whatsapp: z.string().min(1),
    })
  )
  .handler(async ({ data }) => {
    const { sendDiagnosticEmails } = await import("./send-diagnostic.server");
    return await sendDiagnosticEmails(data);
  });
