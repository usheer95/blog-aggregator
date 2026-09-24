import { readConfig, setUser } from "./config";

function main() {
	try {
		// Set the username in the config
		setUser("Alastair");

		// Print out the config
		const config = readConfig();
		console.log(`Config ${JSON.stringify(config, null, 4)}`)
	} catch (error) {
		console.log(`Error: ${String(error)}`)
	}
}

main();
