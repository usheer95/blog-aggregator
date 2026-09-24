import { readConfig, setUser } from "./config";
import { CommandHandler, CommandRegistry, registerCommand, runCommand } from "./commands";
import { exit } from "node:process";

function loginHandler(cmdName: string, ...args: string[]) : void
{
    if (args.length !== 1) {
        throw Error("Login expects argument {username}");
    }

    const userName: string | undefined = args.at(0);
    
    if (userName === undefined) {
        throw Error("Failed to get username from given argument");
    }

    setUser(userName);
    console.log(`User ${userName} login successful`);
}

function main() {
	try {

		let registry: CommandRegistry = new Map<string, CommandHandler>();
		registerCommand(registry, "login", loginHandler)

		const cmdName = process.argv.at(2);
		if (cmdName === undefined) {
			throw Error("No command given")
		}

		const args = process.argv.slice(3);
		runCommand(registry, cmdName, ...args)

	} catch (error) {
		console.log(`Error: ${String(error)}`)
		exit(1)
	}
}

main();
