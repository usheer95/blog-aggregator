
import { db } from "..";
import { Feed, feeds } from "../schema";
import { eq } from "drizzle-orm";

export async function createFeed(name: string, url: string, userId: string) : Promise<Feed | undefined>
{
    const [feed] = await db.insert(feeds).values({name: name, url: url, userId: userId}).returning();
    return feed as Feed | undefined;
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