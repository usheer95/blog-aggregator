import {db} from ".."
import { feedFollow, FeedFollow, users, feeds} from "../schema"
import { and, eq } from "drizzle-orm";
import { getFeedByUrl } from "./feeds";
import { url } from "node:inspector";

type CreatedFollow = { id: string, createdAt: Date, updatedAt: Date, userName: string, feedName: string }

export async function createFeedFollow(userId: string, feedId: string) : Promise<CreatedFollow>
{
    const [follow] = await db.insert(feedFollow).values({userId: userId, feedId: feedId}).returning();

    const [query] = await db.select({
        id: feedFollow.id,
        createdAt: feedFollow.createdAt,
        updatedAt: feedFollow.updatedAt,
        userName: users.name,
        feedName: feeds.name
    })
    .from(feedFollow)
    .where(eq(feedFollow.id, follow.id))
    .innerJoin(feeds, eq(feedFollow.feedId, feeds.id))
    .innerJoin(users, eq(feedFollow.userId, users.id))

    
    return query;
}

export async function getFeedFollowsForUser(userId: string) 
{
    const query = await db.select({
        id: feedFollow.id,
        createdAt: feedFollow.createdAt,
        updatedAt: feedFollow.updatedAt,
        userName: users.name,
        feedName: feeds.name
    })
    .from(feedFollow)
    .where(eq(feedFollow.userId, userId))
    .innerJoin(feeds, eq(feedFollow.feedId, feeds.id))
    .innerJoin(users, eq(feedFollow.userId, users.id))

    return query;
}

export async function deleteFeedFollow(userId: string, feedUrl: string)
{
    const feed = await getFeedByUrl(feedUrl);
    if (feed) {
        const query = await db.delete(feedFollow).where(and(eq(feedFollow.userId, userId), eq(feedFollow.feedId, feed.id)))
    } else {
        throw new Error("Failed to find feed with given URL.")
    }
}