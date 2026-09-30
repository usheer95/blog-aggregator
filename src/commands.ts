import { User } from "./db/schema";

export type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;
export type CommandRegistry = Map<string, CommandHandler>;

export type UserCommandHandler = (cmdName: string, user: User, ...args: string[]) => Promise<void>;

export function registerCommand(registry: CommandRegistry, cmdName: string, handler: CommandHandler) : void
{
    registry.set(cmdName, handler);
}

export async function runCommand(registry: CommandRegistry, cmdName: string, ...args: string[]) : Promise<void> 
{
    const handler = registry.get(cmdName);

    if (handler === undefined) {
        throw Error(`Command "${cmdName}" not registered`)
    }

    return await handler(cmdName, ...args);
}

