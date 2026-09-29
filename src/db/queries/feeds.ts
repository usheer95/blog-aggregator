
import { db } from "..";
import { Feed, feeds } from "../schema";

export async function createFeed(name: string, url: string, userId: string) : Promise<Feed | undefined>
{
    const feed: Array<Feed> = await db.insert(feeds).values({name: name, url: url, userId: userId}).returning();
    return feed.at(0) as Feed | undefined;
}