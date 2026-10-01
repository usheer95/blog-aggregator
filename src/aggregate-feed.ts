import { getNextFeedToFetch, markFeedFetched } from "./db/queries/feeds";
import { fetchRSSFeed, RSSItem, RSSFeed } from "./rss";
import { Feed } from "./db/schema"
import { createPost } from "./db/queries/posts";

export type AggResult = {success: true, data: Array<RSSItem>} | {success: false, error: string }

export async function aggregateFeed() : Promise<void> 
{
    // Get the next feed to aggregate - Using SQL to achive this 
    const nextFeedToFetch: Feed | undefined = await getNextFeedToFetch();
    if (!nextFeedToFetch) {
        throw new Error("Failed to get next feed from database")
    }

    try {
        // Fetch the next feed using the URL
        const rssFeed: RSSFeed = await fetchRSSFeed(nextFeedToFetch.url);

        const items: Array<RSSItem> = rssFeed.channel.item;
        for (const item of items) {
            try {
                await createPost(item, nextFeedToFetch.id);
                console.log(`Adding new post "${item.title}" to database...`);
            } catch(error) {
                continue;
            } 
        } 
    } catch(error: any) {
        throw new Error(`Failed to fetch feed ${error}`);
    } finally {
         // Mark the feed as fetched? Only if successful fetch right?
        await markFeedFetched(nextFeedToFetch.id);
    }
}