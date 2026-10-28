import { z } from 'zod';
export const get_inventory_summary = {
    name: 'get_inventory_summary',
    description: 'One call for the numbers behind the inventory: how many pages the crawl found, how many internal and external links it recorded, and how many of those links failed. Use it to size a project before paging through `get_inventory`, or to render a header without fetching a single row. Every count comes from the statistics the crawl stored, so the `total` of `get_inventory` matches neither `internalLinks` nor `externalLinks`. A project that has never been crawled has no crawler record and answers 500 rather than zeroes or a 404, and zeroes are a real answer only for a crawl that ran and found nothing.',
    inputSchema: z.object({
        projectId: z
            .number()
            .describe('Id of the project, as returned by `get_projects`, and also the id the crawl of the project is stored under'),
    }),
    outputSchema: z.object({
        subdomains: z
            .array(z.string())
            .describe('Other hosts the crawl treated as part of the site, such as `blog.example.com`, with `www.` stripped and the host of the site removed. Empty when the crawl reported none'),
        pages: z.number().describe('Number of pages the crawl found on the site'),
        internalLinks: z
            .number()
            .describe('Number of internal links the crawl recorded. Some crawls store no link counts at all, and this field is published as a number, so the call answers 500 instead of returning null in that case'),
        externalLinks: z
            .number()
            .describe('Number of links pointing at other sites that the crawl recorded. Published as a number, so a crawl that stored no such count leaves the call answering 500 rather than null'),
        badLinks: z
            .number()
            .describe('Links that answered 400-599, summed from the stored status counts of the crawl'),
        errors: z
            .number()
            .describe('Links stored with a status above 599, meaning a link the crawl got no HTTP response for. Disjoint from `badLinks`, which counts 400-599 only'),
    }),
    method: 'get',
    path: '/v1/inventory/{projectId}/summary',
};
