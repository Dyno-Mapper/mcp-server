import { z } from 'zod';

export const create_project_from_url = {
  name: 'create_project_from_url',
  description:
    'Create a project from a URL. ' +
    'Starts a crawl of a website and creates a project from it, returning as soon as the crawl is queued; follow progress with `get_project_url_job_status` using the returned `id`. ' +
    'Without `maxPages` the account’s page allowance is used, and a larger value is lowered to it; at the plan’s project allowance the call fails with “You have reached your project limit”. ' +
    'A crawl that signs in can stop and ask for more while it runs: answer each prompt in `loginInputs` with `submit_project_login_input`. ' +
    'The URL is followed through up to five redirects before the crawl starts. ' +
    'When the crawl finishes, read the project with `get_project_details`.',
  inputSchema: z.object({
    url: z
      .url({ protocol: /^https?$/ })
      .describe('URL of the website to crawl. It must start with https://.'),
    followRobots: z
      .boolean()
      .optional()
      .default(true)
      .describe(
        'Whether the crawler obeys a robots.txt file, which tells bots which pages to leave alone. On by default; turn it off to ignore those instructions and crawl everything reachable.'
      ),
    followSubdomains: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        'Whether the crawler also visits subdomains of the start URL, such as north.example.com under example.com. Linked pages on a subdomain are collected by default; turn this on to crawl inside the subdomains too, or block each one with `skipLinks` instead.'
      ),
    ignoreTrailingSlash: z
      .boolean()
      .optional()
      .default(true)
      .describe(
        'Whether URLs that differ only by a trailing slash are treated as one page. On by default, which keeps the crawl forgiving of hand-written markup, as a browser would be.'
      ),
    ignoreQueryString: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        'Whether URLs that differ only in their query string, the part after `?`, are treated as one page. Turn it on for dynamic sections such as calendars, which can otherwise add many near-duplicate pages.'
      ),
    includeRedirects: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        'Whether to keep both the redirected link and the URL it lands on. When off, only the destination is kept.'
      ),
    includeBadLinks: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        'Whether to keep pages that answer with a 4xx or 5xx status code, such as 404 Not Found or 500 Internal Server Error, instead of dropping them.'
      ),
    renderJavascript: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        'Whether to render each page’s JavaScript, CSS, images and other assets during the crawl. Turn it on for sites that build their content in the browser.'
      ),
    includeContent: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        'Whether to download the entire body of each page. Refine which part is kept with `includeContentByXpath`.'
      ),
    uniquePageTitle: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        'Whether to rely on every page having its own title, which gives a more accurate crawl. Only turn it on when you are certain: content management systems that publish several URLs under one title produce duplicates in the project.'
      ),
    ignoreScheme: z
      .boolean()
      .optional()
      .default(true)
      .describe(
        'Whether the http:// and https:// forms of a page are treated as one page. On by default, which avoids duplicates on servers that answer both schemes.'
      ),
    arrangeLinksByUrl: z
      .boolean()
      .optional()
      .default(true)
      .describe(
        'Whether the sitemap is arranged by the parent/child relationship between the URLs of the domain or subdomain. On by default.'
      ),
    domainAsRoot: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        'Whether the primary domain becomes the root of the sitemap tree when you crawl a subdomain or subdirectory.'
      ),
    includePdf: z
      .boolean()
      .optional()
      .default(false)
      .describe('Whether PDF links are included in the sitemap.'),
    startUrlAsRoot: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        'Whether the hierarchy tree is rooted at the start URL rather than the domain, when you crawl a subdirectory or subdomain. Requires `arrangeLinksByUrl` to be on.'
      ),
    authOptions: z
      .object({
        id: z
          .number()
          .optional()
          .describe(
            'Id of a saved login definition the crawl signs in with, as listed by `get_project_custom_logins`. Omit it for a site with no login.'
          ),
        inputs: z
          .array(z.string())
          .optional()
          .describe(
            'Values for that login, in the order its inputs are listed by `get_project_custom_logins` — typically the username and password. Required in practice when `id` is sent.'
          )
          .meta({
            example: ['username@email.com', 'password321'],
          }),
        basicAuth: z
          .object({
            username: z
              .string()
              .optional()
              .describe(
                'Username for HTTP basic authentication in front of the site.'
              ),
            password: z
              .string()
              .optional()
              .describe(
                'Password for HTTP basic authentication in front of the site.'
              ),
          })
          .optional()
          .describe(
            'HTTP basic authentication credentials, for a site that asks for them before it serves any page. Omit the object when the site does not.'
          ),
      })
      .optional()
      .describe(
        'How the crawl signs in to the site. Omit it for a public website.'
      ),
    onlySubdirectories: z
      .array(z.string())
      .optional()
      .describe(
        'Restrict the crawl to these subdirectory paths of the site. Omit it to crawl the whole site.'
      ),
    skipLinks: z
      .array(
        z.object({
          matchType: z
            .enum(['any', 'beginning', 'end', 'whole', 'regex'])
            .default('any')
            .describe(
              'How `pattern` is matched against the full URL: `any` matches it anywhere in the URL, `beginning` only at the start, `end` only at the end, `whole` only when the whole URL equals it, and `regex` treats it as a regular expression. Defaults to `any`.'
            ),
          pattern: z
            .string()
            .describe(
              'Text or regular expression to match, depending on `matchType`. Matched against the full URL of the link.'
            ),
        })
      )
      .optional()
      .describe(
        'Skip the links that match these rules, applied to the full URL of each link found in the sitemap. Omit it to skip nothing.'
      ),
    includeLinks: z
      .array(
        z.object({
          matchType: z
            .enum(['any', 'beginning', 'end', 'whole', 'regex'])
            .default('any')
            .describe(
              'How `pattern` is matched against the full URL: `any` matches it anywhere in the URL, `beginning` only at the start, `end` only at the end, `whole` only when the whole URL equals it, and `regex` treats it as a regular expression. Defaults to `any`.'
            ),
          pattern: z
            .string()
            .describe(
              'Text or regular expression to match, depending on `matchType`. Matched against the full URL of the link.'
            ),
        })
      )
      .optional()
      .describe(
        'Include only the links that match these rules, applied to the full URL of each link found in the sitemap. Omit it to keep every link the other scope rules allow.'
      ),
    includeLinksByProject: z
      .array(
        z.object({
          projectId: z
            .number()
            .describe('Id of the project to take included links from.'),
          itemIds: z
            .array(z.number())
            .describe(
              'Ids of the items in that project whose links are included, as returned by `get_project_sitemap_items`.'
            ),
        })
      )
      .optional()
      .describe(
        'Include only links that another project already holds, chosen per project. Omit it to keep every link the other scope rules allow.'
      ),
    excludeLinks: z
      .array(
        z.object({
          matchType: z
            .enum(['any', 'beginning', 'end', 'whole', 'regex'])
            .default('any')
            .describe(
              'How `pattern` is matched against the full URL: `any` matches it anywhere in the URL, `beginning` only at the start, `end` only at the end, `whole` only when the whole URL equals it, and `regex` treats it as a regular expression. Defaults to `any`.'
            ),
          pattern: z
            .string()
            .describe(
              'Text or regular expression to match, depending on `matchType`. Matched against the full URL of the link.'
            ),
        })
      )
      .optional()
      .describe(
        'Exclude the links that match these rules, applied to the full URL of each link found in the sitemap. Omit it to exclude nothing.'
      ),
    excludeLinksByProject: z
      .array(
        z.object({
          projectId: z
            .number()
            .describe('Id of the project to take excluded links from.'),
          itemIds: z
            .array(z.number())
            .describe(
              'Ids of the items in that project whose links are excluded, as returned by `get_project_sitemap_items`.'
            ),
        })
      )
      .optional()
      .describe(
        'Exclude links that another project already holds, chosen per project. Omit it to exclude nothing this way.'
      ),
    includeContentByXpath: z
      .array(z.string())
      .optional()
      .describe(
        'XPath selectors that mark the part of a page body to keep as its content. Omit it to keep the whole body.'
      ),
    excludeContentByXpath: z
      .array(z.string())
      .optional()
      .describe(
        'XPath selectors that mark the part of a page body to leave out of its content. Omit it to exclude nothing.'
      ),
    maxPages: z
      .number()
      .optional()
      .describe(
        'Maximum number of pages to crawl. The plan sets a page allowance and a value above it is lowered to that allowance; omit it to crawl up to the allowance.'
      ),
    maxDepth: z
      .number()
      .optional()
      .describe(
        'Maximum depth of the crawl, counted in links from the start URL. A value below 1 is submitted as 0, and so is an omitted field.'
      ),
    speed: z
      .enum(['slower', 'slowest'])
      .optional()
      .describe(
        'Pace of the crawl. `slower` throttles it, `slowest` throttles it further; omit it to crawl as fast as the crawler allows.'
      ),
    javascriptRenderDelay: z
      .number()
      .optional()
      .describe(
        'Seconds to wait between rendering pages. Values above 10 are lowered to 10; omit it for no added delay.'
      ),
    userAgent: z
      .string()
      .optional()
      .describe(
        'User agent the crawler sends with every request. Omit it to send the crawler’s own.'
      ),
  }),
  outputSchema: z.object({
    id: z
      .number()
      .describe(
        'Id of the project that was created. Poll `get_project_url_job_status` with it for the crawl it started.'
      ),
    jobId: z
      .number()
      .optional()
      .describe(
        'Id of the crawl job the crawler queued for this project, returned so the project can be correlated with the crawler’s own records. `id`, not this, is what every other tool takes.'
      ),
    loginInputs: z
      .array(
        z.object({
          id: z
            .number()
            .describe(
              'Position of the input in this list. It stays the same for the life of the crawl and is what `submit_project_login_input` later takes.'
            ),
          label: z
            .string()
            .describe(
              'Short label of the prompt, for example the name of the sign-in step.'
            ),
          description: z
            .string()
            .optional()
            .describe(
              'What the prompt asks for, in the words the login recipe uses. An empty string when it carries no explanation.'
            ),
        })
      )
      .optional()
      .describe(
        'Prompts the crawl may stop on while signing in. Empty when the crawl does not sign in; each `id` is what `submit_project_login_input` later takes.'
      ),
  }),
  method: 'post',
  path: '/v1/project/url',
};
