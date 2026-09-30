import {db} from ".."
import { feedFollow, FeedFollow } from "../schema"
import { getFeedByID } from "./feeds";
import { getUserByID } from "./users";

type CreatedFollow = FeedFollow & { userName: string, feedName: string }

export async function createFeedFollow(userId: string, feedId: string) : Promise<CreatedFollow>
{
    const [follow] = await db.insert(feedFollow).values({userId: userId, feedId: feedId}).returning();
    const userName = (await getUserByID(userId)).name;
    const feedName = (await getFeedByID(feedId)).name;
    const createdFollow = {...follow, userName, feedName};
    
    return createdFollow;
}