import {pgTable, timestamp, uuid, text, unique} from "drizzle-orm/pg-core";
import { time } from "node:console";

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
    name: text("name").notNull().unique(),
});

export type User = typeof users.$inferSelect;

export const feeds = pgTable("feeds", {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
    lastFetchedAt: timestamp("last_fetched_at"),
    name: text("name").notNull().unique(),
    url: text("url").unique().notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
});

export type Feed = typeof feeds.$inferSelect;

export const feedFollow = pgTable("feed_follow", {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
    userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
    feedId: uuid("feed_id").references(() => feeds.id, { onDelete: 'cascade'}).notNull(),
}, (t) => [
    unique().on(t.userId, t.feedId),
]);

export type FeedFollow = typeof feedFollow.$inferSelect;

export const posts = pgTable("posts", {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
    title: text("title").notNull(),
    url: text("url").unique().notNull(),
    description: text("description").notNull(),
    publishedAt: timestamp("published_at").notNull(),
    feedId: uuid("feed_id").references(() => feeds.id, { onDelete: 'cascade'}).notNull(),
})

export type Post = typeof posts.$inferSelect;