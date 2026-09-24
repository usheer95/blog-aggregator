import fs, { write } from "fs"; // Imports file system related functions i.e read, write 
import os, { homedir } from "os"; // Imports operating system level functions such as getting the home dir path
import path from "path"; // Imports path related functions to help work with file and directory paths
import z, { ZodSafeParseError, ZodSafeParseResult } from "zod";

const CONFIG_INDENTATION = 4;

class ConfigValidationError extends Error
{
    constructor(message: string){
        super(message);
        this.name = "ConfigValidationError";
    }
}

// Define a zod scheme object for validation
const ConfigSchema = z.object({
    dbUrl: z.string(),
    currentUserName: z.string()
}).strict();

// Infer a Typescript type from the zod schema
// - Removes the need to duplicate a definition of the type
type Config = z.infer<typeof ConfigSchema>;

// Helper methods
function getConfigPath() : string
{
    var pathToConfigFile = path.join(os.homedir(), ".gatorconfig.json")
    return pathToConfigFile; 
}

function writeConfig(config: Config) : void
{
    let json: string = JSON.stringify(config, null, CONFIG_INDENTATION);
    fs.writeFileSync(getConfigPath(), json);
}

function validateConfig(rawConfig: any) : Config
{
    const parseResult = ConfigSchema.safeParse(rawConfig);

    if (parseResult.success) {
        return parseResult.data as Config;
    }

    throw new ConfigValidationError(`Failed to parse config file - ${parseResult.error.message}`);
}

export function setUser(username: string) 
{
    let currentConfig: Config = readConfig();
    currentConfig.currentUserName = username;
    writeConfig(currentConfig)
}

export function readConfig() : Config
{
    let rawConfig: string = fs.readFileSync(getConfigPath(), {encoding: "utf-8"}).toString();
    let parsedConfig: any = JSON.parse(rawConfig);
    let validatedConfig: Config = validateConfig(parsedConfig);
    return validatedConfig;
}


