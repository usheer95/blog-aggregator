import { readConfig, setUser } from "./config";
import { CommandHandler, CommandRegistry, registerCommand, runCommand } from "./commands";
import { exit } from "node:process";
import { createUser, deleteAllUsers, getAllUsers, getUserByID, getUserByName } from "./db/queries/users"
import { fetchRSSFeed, RSSFeed } from "./rss";
import { createFeed, getAllFeeds, getFeedByUrl } from "./db/queries/feeds";
import { Feed, User, users } from "./db/schema";
import { ar } from "zod/v4/locales";
import { createFeedFollow, getFeedFollowsForUser } from "./db/queries/feedFollow";

async function loginHandler(cmdName: string, ...args: string[]) : Promise<void>
{
    if (args.length !== 1) {
        throw Error("Login expects argument {username: string}");
    }

    const userName: string | undefined = args.at(0);
    
    if (userName === undefined) {
        throw Error("Failed to get username from given argument");
    }

	const user = await getUserByName(userName);
	if (user === undefined) {
		throw Error("Unable to login as user is not registered in the database");
	}
	
    setUser(userName);
    console.log(`User ${userName} login successful`);
}

async function registerHandler(cmdName: string, ...args: string[]) : Promise<void>
{
	let newUserName = args.at(0);

	if (newUserName === undefined) {
		throw Error("Register command expects a name to register")
	}

	// Check if user already exists 
	let userCheck: User | undefined = await getUserByName(newUserName);

	if (userCheck !== undefined) {
		throw Error(`Unable to register user as ${newUserName} is already registered`)
	}

	console.log(`Registering ${newUserName}...`)
	await createUser(newUserName);
	setUser(newUserName);
	console.log(`User ${newUserName} was created succesfully`)
}

async function resetHandler(cmdName: string, ...args: string[]) : Promise<void>
{
	console.log("Reseting database");
	console.log("Removing all users from user table...")
	await deleteAllUsers();
	console.log("All users removed")
}

async function usersHandler(cmdName: string, ...args: string[]) : Promise<void>
{
	const allUsers = await getAllUsers();
	const config = readConfig();
	
	allUsers.forEach(element => {
		console.log(`* ${element.name} ${config.currentUserName === element.name ? "(current)" : ""}`)
	});
}

async function aggHandler(cmdName: string, ...args: string[]) : Promise<void>
{
	const feed: RSSFeed = await fetchRSSFeed("https://www.wagslane.dev/index.xml");

	console.log(JSON.stringify(feed, null, 4))
}

async function addFeedHandler(cmdName: string, ...args: string[]) : Promise<void>
{
	if (args.length != 2) {
		throw new Error("Add feed expects two args {name: string} and {url: string}");
	}

	const currentUserName: string = readConfig().currentUserName;
	let currentUser = await getUserByName(currentUserName);

	if (currentUser === undefined) {
		throw new Error("Unable to retreive current user from db")
	}

	const name = args.at(0) as string;
	const url = args.at(1) as string;

	console.log("Adding new feed...");
	const createdFeed = await createFeed(name, url, currentUser.id);

	if (createdFeed === undefined) {
		console.log("Failed to add new feed.");
	} else {
		console.log("New feed added succesfully");
		await createFeedFollow(createdFeed.userId, createdFeed.id);
		printFeed(createdFeed, currentUser);
	}
}

async function feedsHandler(cmdName: string, ...args: string[]) : Promise<void>
{
	const allFeeds = await getAllFeeds();

	for (const feed of allFeeds) {
		const user: User | undefined = await getUserByID(feed.userId);
		if (user !== undefined) {
			printFeed(feed, user);
		} else {
			throw new Error("Failed to get user from feed user id");
		}
	}
}

async function followHandler(cmdName: string, ...args: string[]) : Promise<void>
{
	// Check url arg is there
	if(args.length !== 1) {
		throw new Error("follow expects args {url: string}");
	}

	const url: string | undefined = args.at(0);
	if (url === undefined) {
		throw new Error("url is undefined");
	}

	// Does the feed exist to be able to follow?
	const feed: Feed | undefined = await getFeedByUrl(url);
	if (feed === undefined) { 
		throw new Error("Unable to follow as feed does not exist");
	}

	const currentUserName: string = readConfig().currentUserName;
	const currentUser: User | undefined = await getUserByName(currentUserName);
	
	if (currentUser === undefined) {
		throw new Error("Unable to follow a feed a no user logged");
	}

	const createdFollow = await createFeedFollow(currentUser.id, feed.id);
	console.log(`Created new follow for ${createdFollow.userName} -> ${createdFollow.feedName}`);
}

async function followingHandler(cmdName: string, ...args: string[]) : Promise<void>
{
	const currentUserName: string = readConfig().currentUserName;
	const currentUser: User | undefined = await getUserByName(currentUserName);
	
	if (currentUser === undefined) {
		throw new Error("Unable to get following list no user logged");
	}

	const following = await getFeedFollowsForUser(currentUser.id);

	console.log("Following:")
	for(const follow of following) {
		console.log(`* ${follow.feedName}`);
	}
}

function printFeed(feed: Feed, user: User) 
{
	console.log(`User: ${user.name} | Feed: ${feed.name} , ${feed.url}`);
}

async function main() 
{
	try {

		let registry: CommandRegistry = new Map<string, CommandHandler>();
		registerCommand(registry, "login", loginHandler);
		registerCommand(registry, "register", registerHandler);
		registerCommand(registry, "reset", resetHandler);
		registerCommand(registry, "users", usersHandler);
		registerCommand(registry, "agg", aggHandler);
		registerCommand(registry, "addfeed", addFeedHandler);
		registerCommand(registry, "feeds", feedsHandler);
		registerCommand(registry, "follow", followHandler);
		registerCommand(registry, "following", followingHandler);

		const cmdName = process.argv.at(2);
		if (cmdName === undefined) {
			throw Error("No command given");
		}

		const args = process.argv.slice(3);
		await runCommand(registry, cmdName, ...args);
		
		process.exit(0);

	} catch (error) {
		console.log(String(error))
		exit(1)
	}
}

main();
