import { db } from "..";
import { users, User} from "../schema";
import { eq } from "drizzle-orm";

export async function createUser(name: string) 
{
    const [result] = await db.insert(users).values({name: name}).returning();
    return result;
}

export async function getUserByName(name: string) : Promise<User | undefined>
{
    const [user] = await db.select().from(users).where(eq(users.name, name));
    return user;
}

export async function getUserByID(id: string) : Promise<User>
{
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user as User;
}

export async function deleteAllUsers() 
{
    await db.delete(users);
}

export async function getAllUsers() 
{
    const allUsers = await db.select().from(users);
    return allUsers;
}