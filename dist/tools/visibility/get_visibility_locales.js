import { z } from 'zod';
export const get_visibility_locales = {
    name: 'get_visibility_locales',
    description: 'Returns every locale a keyword can be tracked in: the code to send as `locale`, and the country and language that code stands for. Pass one of these values to `create_visibility_keywords` when adding keywords, or to `update_visibility_keyword_setting` to move existing ones. The catalogue is the whole set the application supports, not the locales a single project already uses, so it is safe to fetch once and cache. A locale is read from the search results of that country, which means the same keyword tracked in two locales is two independent keywords with their own rank history.',
    inputSchema: z.object({}),
    outputSchema: z.object({
        locales: z
            .array(z.object({
            locale: z
                .string()
                .describe('Locale code to send as `locale`, for example `en-us` or `de-de`: lower-case, the language first and the market it is searched in second.'),
            name: z
                .string()
                .describe('Readable name of the market the code stands for, in the form `United States – English`: the country first, then the language searched in.'),
        }))
            .describe('Every locale keywords can be tracked in, in the order the application defines them. Not filtered by what the account or project already uses.'),
    }),
    method: 'get',
    path: '/v1/visibility/locales',
};
