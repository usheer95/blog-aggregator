
import { db } from "..";
import { Feed, feeds } from "../schema";
import { eq, sql } from "drizzle-orm";

export async function createFeed(name: string, url: string, userId: string) : Promise<Feed>
{
    const [feed] = await db.insert(feeds).values({name: name, url: url, userId: userId}).returning();
    return feed as Feed;
}

export async function getAllFeeds() : Promise<Array<Feed>>
{
    const allFeeds: Array<Feed> = await db.select().from(feeds);
    return allFeeds; 
}

export async function getFeedByID(id: string) : Promise<Feed> 
{
    const [feed] = await db.select().from(feeds).where(eq(feeds.id, id));
    return feed as Feed;
}

export async function getFeedByUrl(url: string) : Promise<Feed | undefined> 
{
    const [feed] = await db.select().from(feeds).where(eq(feeds.url, url));
    return feed;
}

export async function markFeedFetched(feedId: string) : Promise<Feed>
{
    const [updatedFeeds] = await db.update(feeds).set({lastFetchedAt: new Date()}).where(eq(feeds.id, feedId)).returning();
    console.log(`Updated last fetched for ${updatedFeeds.name}`);
    return updatedFeeds;
} 

export async function getNextFeedToFetch() : Promise<Feed | undefined>
{
    // Get any feeds that have not been fetched yet i.e any last_fetched_at column that is null
    // If all the last_fetched_at columns are not null then use the last_fetch_at column and return the one with the oldest timestamp
    const nextFeedToFetch = await db.select().from(feeds).orderBy(sql`${feeds.lastFetchedAt} asc nulls first`);
    return nextFeedToFetch.at(0);
}