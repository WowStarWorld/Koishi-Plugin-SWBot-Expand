import { Context, Schema } from 'koishi';

import "koishi-plugin-swbot/src/index";

export const name = 'swbot-expand';
export const using = ["swbot", "puppeteer"];

export interface Config {}

export const Config: Schema<Config> = Schema.object({});

let config: Config;
let context: Context;

export function getConfig () { return config; }
export function getContext () { return context; }

export function apply (ctx: Context, cfg: Config) {
    context = ctx;
    config = cfg;
    require("./command");
}
