import { RSSItem } from "src/rss";
import { posts, Post, feedFollow} from "../schema";
import { db } from "..";
import {eq, getTableColumns, asc, desc} from "drizzle-orm"

export async function createPost(post: RSSItem, feedId: string) : Promise<Post>
{
    const [createdPost] = await db.insert(posts).values({title: post.title, url: post.link, description: post.description, publishedAt: post.pubDate, feedId: feedId}).returning();
    return createdPost;
}


export async function getPostForUser(userID: string, numLimit: number) : Promise<Array<Post>> 
{
    const query = await db
        .select(getTableColumns(posts))
        .from(posts)
        .innerJoin(feedFollow, eq(feedFollow.feedId, posts.feedId))
        .where(eq(feedFollow.userId, userID))
        .orderBy(desc(posts.publishedAt))
        .limit(numLimit)

    return query
}