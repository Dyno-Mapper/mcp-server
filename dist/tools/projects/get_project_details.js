import { z } from 'zod';
export const get_project_details = {
    name: 'get_project_details',
    description: 'Get a project. ' +
        'Returns one project, with the counts and flags that decide what can be done with it. ' +
        'Three numbers are reported: `items` is the count stored on the project, `pages` the published pages counted now, `buckets` the published containers that group pages; the stored count is not guaranteed to be the sum of the other two. ' +
        'A project is readable while its first crawl runs, and `crawlDate` reports its creation date until that crawl finishes. ' +
        'Deleted, unpublished and archived projects answer 404, and so does a project belonging to another account. ' +
        'Read crawl and import progress with `get_project_url_job_status` or `get_project_file_job_status`, and scores with `get_project_vacq_score` or `get_project_dacq_score`.',
    inputSchema: z.object({
        projectId: z
            .number()
            .describe('Id of the project, as returned by `get_projects` or by one of the `create_project_from_url`, `create_project_from_file` and `create_project_from_sharepoint` tools.'),
    }),
    outputSchema: z.object({
        id: z
            .number()
            .describe('Numeric project id, used by every other project tool.'),
        alphaId: z
            .string()
            .describe('Opaque alphanumeric id the application uses in its own URLs, such as `sitemapUrl`. It encodes the same project as `id`, and it is never accepted in place of `id`.'),
        type: z
            .enum(['scratch', 'crawler', 'xml', 'text', 'duplicate', 'merge'])
            .describe('How the project was created. `crawler` is a crawl of a website (`create_project_from_url` or `create_project_from_sharepoint`), `text` an imported text list of URLs (`create_project_from_file` with `type` set to `text`), `xml` an imported XML sitemap (`create_project_from_file` with `type` set to `xml`). `scratch` is a project built by hand in the application, `duplicate` one copied from another project, and `merge` one combined from several; no tool here creates those three.'),
        title: z
            .string()
            .describe('Title of the project: the address it was created from, without the scheme, for a crawled project, or the imported filename. An empty string when the application never recorded one.'),
        items: z
            .number()
            .describe('Item count stored on the project row — the figure the project list of the application shows. It is a saved count rather than one taken for this call, so it is not guaranteed to equal `pages` plus `buckets`.'),
        pages: z
            .number()
            .describe('Number of published pages in the project, counted when this call runs: sitemap items of type `link` that are published. Folders and unpublished or deleted items are not counted.'),
        buckets: z
            .number()
            .describe('Number of published containers — the folder nodes that group pages in the sitemap tree — counted when this call runs. A container is not a page, so these are not part of `pages`.'),
        isPublic: z
            .boolean()
            .describe('True when the share record of the project is public. It is stored separately from `isPrivate`, so the two flags can disagree.'),
        isPrivate: z
            .boolean()
            .describe('Private project: not publicly reachable. Every project created by `create_project_from_sharepoint` is stored private.'),
        isSharepoint: z
            .boolean()
            .describe('True when the project was created from a SharePoint site with `create_project_from_sharepoint`.'),
        domain: z
            .string()
            .describe('Hostname the project was created from, for example `example.com`. An empty string for an import that has no host; never null.'),
        groupId: z
            .number()
            .nullish()
            .describe('Project group the project is filed under, as an id from `get_project_groups`. Null when it is in no group.'),
        groupName: z
            .string()
            .nullish()
            .describe('Name of that group. Null when the project is in no group.'),
        groupColor: z
            .string()
            .nullish()
            .describe('Colour the application paints that group with. Null when the project is in no group, or when the group has no colour set.'),
        logoUrl: z
            .string()
            .describe('URL of the logo of the project, served by the DYNO Mapper application and not by this API. It always answers, falling back to a default, and carries a version query when a custom logo is set.'),
        thumbnail: z
            .string()
            .nullish()
            .describe('Screenshot of the project, captured by the application. Null until the first capture finishes, and never set for a private SharePoint project, whose sign-in page is all a capture would show.'),
        allowTextRefresh: z
            .boolean()
            .describe('True when the project can be refreshed with `refresh_project_file` using `type` set to `text`. Only a text import created from a `url` can be: a project created from an uploaded file, or any project that is not a text import, answers false.'),
        allowXmlRefresh: z
            .boolean()
            .describe('True when the project can be refreshed with `refresh_project_file` using `type` set to `xml`. Only an XML import created from a `url` can be: a project created from an uploaded file, or any project that is not an XML import, answers false.'),
        createdAt: z
            .string()
            .describe('ISO 8601 date and time the project was created.'),
        crawlDate: z
            .string()
            .describe('ISO 8601 date and time of the most recent crawl of the project. A project that has never been crawled reports its creation date here instead, so this is never null.'),
        lastModified: z
            .string()
            .describe('ISO 8601 date and time the project record was last changed, falling back to its creation date when it never has been.'),
        sitemapUrl: z
            .string()
            .describe('URL of the project in the DYNO Mapper web application, built from `alphaId`. Open it in a browser; it is not something this server calls.'),
    }),
    method: 'get',
    path: '/v1/project/{projectId}',
};
