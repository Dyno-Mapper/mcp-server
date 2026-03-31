import { z } from 'zod';

export const get_accessibility_pdf_files = {
  name: 'get_accessibility_pdf_files',
  description: 'List PDF accessibility files',
  inputSchema: z.object({
    projectId: z.number(),
    search: z.string().optional(),
    location: z.enum(['internal', 'external']).optional(),
    orderBy: z
      .enum(['date', 'known_problems', 'likely_problems', 'potential_problems'])
      .optional(),
    orderDir: z.enum(['asc', 'desc']).optional(),
    page: z.number().optional(),
    limit: z.number().optional(),
  }),
  outputSchema: z.object({
    total: z.number(),
    limit: z.number(),
    page: z.number(),
    pageSize: z.number(),
    items: z.array(
      z.object({
        id: z.number(),
        url: z.string(),
        filename: z.string(),
        isExternal: z.boolean(),
        isUploaded: z.boolean(),
        state: z.enum(['completed', 'running', 'deleted', 'queued', 'unknown']),
        status: z.string().nullable(),
        error: z.string().nullable(),
        errorReason: z.string().nullable(),
        knownProblems: z.number(),
        likelyProblems: z.number(),
        potentialProblems: z.number(),
        archivedKnownProblems: z.number(),
        archivedLikelyProblems: z.number(),
        archivedPotentialProblems: z.number(),
        created: z.string(),
      })
    ),
  }),
  method: 'get',
  path: '/v1/accessibility/{projectId}/pdf',
};
