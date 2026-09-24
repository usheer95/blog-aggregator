import { setUser } from "./config";

export type CommandHandler = (cmdName: string, ...args: string[]) => void;
export type CommandRegistry = Map<string, CommandHandler>;

export function registerCommand(registry: CommandRegistry, cmdName: string, handler: CommandHandler) : void
{
    registry.set(cmdName, handler);
}

export function runCommand(registry: CommandRegistry, cmdName: string, ...args: string[]) : void 
{
    const handler = registry.get(cmdName);

    if (handler === undefined) {
        throw Error(`Command "${cmdName}" not registered`)
    }

    handler(cmdName, ...args);
}

