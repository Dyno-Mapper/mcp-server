import { z } from 'zod';
export const create_project_from_url = {
    name: 'create_project_from_url',
    description: 'Create a Project from URL',
    inputSchema: z.object({
        url: z
            .url({ protocol: /^https?$/ })
            .describe('URL of the website to crawl. It must start with https://'),
        followRobots: z
            .boolean()
            .optional()
            .default(true)
            .describe('Follow instructions in robots.txt'),
        followSubdomains: z
            .boolean()
            .optional()
            .default(false)
            .describe('Whether to also crawl subdomains'),
        ignoreTrailingSlash: z
            .boolean()
            .optional()
            .default(true)
            .describe('Treat URLs with and without a trailing slash as the same'),
        ignoreQueryString: z
            .boolean()
            .optional()
            .default(false)
            .describe('Ignore parameters in the query string'),
        includeRedirects: z
            .boolean()
            .optional()
            .default(false)
            .describe('Include both redirected and destination links'),
        includeBadLinks: z
            .boolean()
            .optional()
            .default(false)
            .describe('Include pages with 4xx or 5xx status codes'),
        renderJavascript: z
            .boolean()
            .optional()
            .default(false)
            .describe('Render JavaScript and other assets during crawl'),
        includeContent: z
            .boolean()
            .optional()
            .default(false)
            .describe('Download the entire body content of each page'),
        uniquePageTitle: z
            .boolean()
            .optional()
            .default(false)
            .describe('Only crawl pages with unique titles'),
        ignoreScheme: z
            .boolean()
            .optional()
            .default(true)
            .describe('Ignore protocol differences (http vs https)'),
        arrangeLinksByUrl: z
            .boolean()
            .optional()
            .default(true)
            .describe('Arrange sitemap by URL parent/child relationship'),
        domainAsRoot: z
            .boolean()
            .optional()
            .default(false)
            .describe('Set the primary domain as the sitemap root'),
        includePdf: z
            .boolean()
            .optional()
            .default(false)
            .describe('Include PDF files in the sitemap'),
        startUrlAsRoot: z
            .boolean()
            .optional()
            .default(false)
            .describe('Set the starting URL as the hierarchy root'),
        authOptions: z
            .object({
            id: z.number().optional().describe('Website authentication system ID'),
            inputs: z
                .array(z.string())
                .optional()
                .describe('Website authentication inputs')
                .meta({
                example: ['username@email.com', 'password321'],
            }),
            basicAuth: z
                .object({
                username: z
                    .string()
                    .optional()
                    .describe('Website basic auth username'),
                password: z
                    .string()
                    .optional()
                    .describe('Website basic auth password'),
            })
                .optional()
                .describe('Website basic auth'),
        })
            .optional()
            .describe('Website authentication options'),
        onlySubdirectories: z
            .array(z.string())
            .optional()
            .describe('Crawl only links matching the subdirectory of the URL'),
        skipLinks: z
            .array(z.object({
            matchType: z
                .enum(['any', 'beginning', 'end', 'whole', 'regex'])
                .default('any')
                .describe('Rule match type'),
            pattern: z.string().describe('Rule pattern'),
        }))
            .optional()
            .describe('Skip links matching these rules'),
        includeLinks: z
            .array(z.object({
            matchType: z
                .enum(['any', 'beginning', 'end', 'whole', 'regex'])
                .default('any')
                .describe('Rule match type'),
            pattern: z.string().describe('Rule pattern'),
        }))
            .optional()
            .describe('Include only links matching these rules'),
        includeLinksByProject: z
            .array(z.object({
            projectId: z.number().describe('Project ID to include links from'),
            itemIds: z
                .array(z.number())
                .describe('Item IDs to include links from'),
        }))
            .optional()
            .describe('Include selected folder or items based on existing Project'),
        excludeLinks: z
            .array(z.object({
            matchType: z
                .enum(['any', 'beginning', 'end', 'whole', 'regex'])
                .default('any')
                .describe('Rule match type'),
            pattern: z.string().describe('Rule pattern'),
        }))
            .optional()
            .describe('Exclude links matching these rules'),
        excludeLinksByProject: z
            .array(z.object({
            projectId: z.number().describe('Project ID to exclude links from'),
            itemIds: z
                .array(z.number())
                .describe('Item IDs to exclude links from'),
        }))
            .optional()
            .describe('Exclude selected folder or items based on existing Project'),
        includeContentByXpath: z
            .array(z.string())
            .optional()
            .describe('Configure XPath rules for scraping content of a page body. Separate XPath rule by newline'),
        excludeContentByXpath: z
            .array(z.string())
            .optional()
            .describe('Configure XPath rules for excluding content of a page body. Separate XPath rule by newline'),
        maxPages: z
            .number()
            .optional()
            .describe('Maximum number of pages to crawl'),
        maxDepth: z.number().optional().describe('Maximum depth of the crawl'),
        speed: z
            .enum(['slower', 'slowest'])
            .optional()
            .describe('Speed of the crawl'),
        javascriptRenderDelay: z
            .number()
            .optional()
            .describe('Delay in seconds between rendering pages'),
        userAgent: z.string().optional().describe('User agent for the crawler'),
    }),
    outputSchema: z.object({
        id: z.number().describe('Project ID'),
    }),
    method: 'post',
    path: '/v1/project/url',
};
