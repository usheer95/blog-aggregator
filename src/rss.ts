
import { XMLParser } from "fast-xml-parser";
import {z} from "zod";

const RSSItemSchema = z.object({
    title: z.string(),
    link: z.string(),
    description: z.string(),
    pubDate: z.string(),
});

const RSSItemArraySchema = z.preprocess(
    (val) => {
        if (Array.isArray(val)) return val;
        if (val === undefined || val === null) return [];
        return [val];
    },
    z.array(RSSItemSchema)
);

const RSSChannelSchema = z.object({
    title: z.string(),
    link: z.string(),
    description: z.string(),
    item: RSSItemArraySchema,
});

const RSSFeedSchema = z.object({
    channel: RSSChannelSchema
});

export type RSSChannel = z.infer<typeof RSSChannelSchema>;
export type RSSFeed = z.infer<typeof RSSFeedSchema>;
export type RSSItem = z.infer<typeof RSSItemSchema>;

export async function fetchRSSFeed(feedURL: string) : Promise<RSSFeed>
{   
    console.log(`Fetching from ${feedURL}...`);
    const response : Response = await fetch(feedURL, {
        method: "GET",
        headers: {
            'User-Agent': "gator",
            'Accept': 'application/rss+xml, application/xml;q=0.9'
        }
    });

    if (!response.ok){
        throw new Error(`Failed to fetch from ${feedURL}`);
    }

    const rawFeed: string = await response.text();
    const rssFeed = parseRssFeed(rawFeed);

    return rssFeed;
}

function parseRssFeed(rawRSS: string) : RSSFeed 
{
    const parser: XMLParser = new XMLParser({processEntities: false});
    const jsonFeed = parser.parse(rawRSS);

    const parseResult = RSSFeedSchema.safeParse(jsonFeed.rss);
    if (parseResult.success) {
        return parseResult.data as RSSFeed;
    }

    throw new Error(`Failed to parse RSS feed ${parseResult.error}`);
}




