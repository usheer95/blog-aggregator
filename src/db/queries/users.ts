import { db } from "..";
import { users, User} from "../schema";
import { eq } from "drizzle-orm";

export async function createUser(name: string) {
    const [result] = await db.insert(users).values({name: name}).returning();
    return result;
}

export async function getUserByName(name: string) {
    const user = await db.select().from(users).where(eq(users.name, name));
    return user.at(0) as User | undefined;
}

export async function deleteAllUsers() {
    await db.delete(users);
}

export async function getAllUsers() {
    const allUsers = await db.select().from(users);
    return allUsers;
}