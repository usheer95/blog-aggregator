import { readConfig, setUser } from "./config";
import { CommandHandler, CommandRegistry, registerCommand, runCommand, UserCommandHandler } from "./commands";
import { exit } from "node:process";
import { createUser, deleteAllUsers, getAllUsers, getUserByID, getUserByName } from "./db/queries/users"
import { createFeed, getAllFeeds, getFeedByUrl } from "./db/queries/feeds";
import { Feed, User } from "./db/schema";
import { createFeedFollow, deleteFeedFollow, getFeedFollowsForUser } from "./db/queries/feedFollow";
import { aggregateFeed, AggResult} from "./aggregate-feed";
import { RSSItem } from "./rss";
import { resolve } from "node:dns";
import { int, number, record } from "zod";
import { ar } from "zod/v4/locales";

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

function parseDuration(duration: string) : number
{
	const regex = /^(\d+)(ms|s|m|h)$/;
	const match = duration.match(regex);

	if(!match) {
		throw new Error("Invalid duration given. Expected forms [1s, 1m, 1h] etc...");
	}

	const time = match[1];
	if (!time) {
		throw new Error("Failed to parse the duration value")
	}

	const convertedtime: number = Number(time);
	if (Number.isNaN(convertedtime)) {
		throw new Error("Failed to parse the duration value")
	}

	const unitOfTime = match[2];
	if (!unitOfTime) {
		throw new Error("Failed to parse the unit of time for given duration")
	}

	const unitOfTimeToMillisecondsMultiplier: Record<string, number> = {
		"ms": 1,
		"s": 1000,
		"m": 60000,
		"h": 3600000,
	};

	const unitOfTimeMultiplier = unitOfTimeToMillisecondsMultiplier[unitOfTime];
	if(!unitOfTimeMultiplier) {
		throw new Error("Failed to parse the unit of time for given duration")
	}

	const durationInMilliseconds = convertedtime * unitOfTimeMultiplier;
	
	return durationInMilliseconds;
}

async function aggHandler(cmdName: string, ...args: string[]) : Promise<void>
{
	if (args.length != 1) {
		throw new Error("agg command expects 1 argument {time_between_requests}")
	}

	const duration: string | undefined = args.at(0);

	if (!duration) {
		throw new Error("time_between_requests is undefined");
	}

	const intervalTimeMs: number = parseDuration(duration);

	const interval = setInterval(() => {
		aggregateFeed().catch((error: any) => console.log(error));
	}, intervalTimeMs);

	await new Promise<void>((resolve) => {
		process.on("SIGINT", () => {
			console.log("Shutting down feed aggregator...");
			clearInterval(interval);
			resolve();
		})
	});
}

async function addFeedHandler(cmdName: string, user: User, ...args: string[]) : Promise<void>
{
	if (args.length != 2) {
		throw new Error("Add feed expects two args {name: string} and {url: string}");
	}

	const name = args.at(0) as string;
	const url = args.at(1) as string;

	const createdFeed = await createFeed(name, url, user.id);

	if (!createdFeed) {
		console.log("Failed to add new feed.");
	} else {
		console.log("New feed added succesfully");
		await createFeedFollow(createdFeed.userId, createdFeed.id);
		printFeed(createdFeed, user);
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

async function followHandler(cmdName: string, user: User, ...args: string[]) : Promise<void>
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

	const createdFollow = await createFeedFollow(user.id, feed.id);
	console.log(`Created new follow for ${createdFollow.userName} -> ${createdFollow.feedName}`);
}

async function followingHandler(cmdName: string, user: User, ...args: string[]) : Promise<void>
{
	const following = await getFeedFollowsForUser(user.id);

	console.log("Following:")
	for(const follow of following) {
		console.log(`* ${follow.feedName}`);
	}
}

async function unfollowHandler(cmdName: string, user: User, ...args: string[]) : Promise<void>
{
	if(args.length !== 1) {
		throw new Error("follow expects args {url: string}");
	}

	const url: string | undefined = args.at(0);
	if (url === undefined) {
		throw new Error("url is undefined");
	}	

	await deleteFeedFollow(user.id, url);
	console.log(`unfollowed from ${url}`);
}

function printFeed(feed: Feed, user: User) 
{
	console.log(`User: ${user.name} | Feed: ${feed.name} , ${feed.url}`);
}

function middlewareLoggedIn(handler: UserCommandHandler) : CommandHandler
{

	return async function (cmdName, ...args) {
		const loggedInUserName: string = readConfig().currentUserName;
		let loggedInUser = await getUserByName(loggedInUserName);

		if (!loggedInUser) {
			throw new Error("No user currently logged in")
		}

		await handler(cmdName, loggedInUser, ...args);
	};
}

async function main() 
{
	try {

		let registry: CommandRegistry = new Map<string, CommandHandler>();
		registerCommand(registry, "login", loginHandler);
		registerCommand(registry, "register", registerHandler);
		registerCommand(registry, "reset", resetHandler);
		registerCommand(registry, "users", usersHandler);
		registerCommand(registry, "feeds", feedsHandler);

		registerCommand(registry, "agg", aggHandler);

		registerCommand(registry, "addfeed", middlewareLoggedIn(addFeedHandler));
		registerCommand(registry, "follow", middlewareLoggedIn(followHandler));
		registerCommand(registry, "following", middlewareLoggedIn(followingHandler));
		registerCommand(registry, "unfollow", middlewareLoggedIn(unfollowHandler));

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
