import { setUser } from "./config";
import { CommandHandler, CommandRegistry, registerCommand, runCommand } from "./commands";
import { exit } from "node:process";
import { createUser, getUserByName } from "./db/queries/users"

async function loginHandler(cmdName: string, ...args: string[]) : Promise<void>
{
    if (args.length !== 1) {
        throw Error("Login expects argument {username: string}");
    }

    const userName: string | undefined = args.at(0);
    
    if (userName === undefined) {
        throw Error("Failed to get username from given argument");
    }

	let userCheck = await getUserByName(userName);

	if (userCheck.length === 0) {
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
	let userCheck = await getUserByName(newUserName);

	if (userCheck.length > 0) {
		throw Error(`Unable to register user as ${newUserName} is already registered`)
	}

	console.log(`Registering ${newUserName}...`)
	await createUser(newUserName);
	setUser(newUserName);
	console.log(`User ${newUserName} was created succesfully`)
}

async function main() {
	try {

		let registry: CommandRegistry = new Map<string, CommandHandler>();
		registerCommand(registry, "login", loginHandler);
		registerCommand(registry, "register", registerHandler);

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
