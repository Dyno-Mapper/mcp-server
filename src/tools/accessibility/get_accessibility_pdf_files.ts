import { z } from 'zod';

export const get_accessibility_pdf_files = {
  name: 'get_accessibility_pdf_files',
  description: 'List PDF accessibility files',
  inputSchema: z.object({
    projectId: z.number().describe('The ID of the project'),
    search: z.string().trim().optional().describe('The search string'),
    location: z
      .enum(['internal', 'external'])
      .optional()
      .describe('The location of the PDF files'),
    orderBy: z
      .enum(['date', 'known_problems', 'likely_problems', 'potential_problems'])
      .optional()
      .describe('The field to order by'),
    orderDir: z
      .enum(['asc', 'desc'])
      .optional()
      .describe('The direction to order by'),
    page: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .describe('The page number'),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .transform((n) => Math.min(n, 100))
      .optional()
      .default(50)
      .describe('The results limit (max 100)'),
  }),
  outputSchema: z.object({
    total: z.number().describe('Total number of items'),
    limit: z.number().describe('The results limit'),
    page: z.number().describe('The current page number'),
    pageSize: z.number().describe('The size of the page'),
    items: z
      .array(
        z.object({
          id: z.number().describe('The ID of the PDF file'),
          url: z.string().describe('The URL of the PDF file'),
          filename: z.string().describe('The filename of the PDF file'),
          isExternal: z.boolean().describe('Whether the PDF is external'),
          isUploaded: z.boolean().describe('Whether the PDF was uploaded'),
          state: z
            .enum(['completed', 'running', 'deleted', 'queued', 'unknown'])
            .describe('The state of the PDF analysis'),
          status: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe('The status of the PDF analysis'),
          error: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe('Error message if the analysis failed'),
          errorReason: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe('The reason for the error if the analysis failed'),
          knownProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('Number of known accessibility problems'),
          likelyProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('Number of likely accessibility problems'),
          potentialProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('Number of potential accessibility problems'),
          archivedKnownProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('Number of archived known accessibility problems'),
          archivedLikelyProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('Number of archived likely accessibility problems'),
          archivedPotentialProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('Number of archived potential accessibility problems'),
          created: z.iso
            .datetime()
            .describe('The date and time the entry was created'),
        })
      )
      .describe('An array of PDF accessibility files'),
  }),
  method: 'get',
  path: '/v1/accessibility/{projectId}/pdf',
};
