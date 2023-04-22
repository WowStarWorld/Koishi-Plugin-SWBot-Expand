// noinspection JSUnresolvedLibraryURL

import { getContext } from "../../index";
import "koishi-plugin-puppeteer";
import _ from "lodash";

let ctx = getContext();
let swbot = ctx.swbot.core;


export const giveCommand = ctx.command(
    "给予 <玩家:玩家标识> <物品:物品标识> <数量:正整数> [标签:数据标签]", "给予玩家物品",  {authority: 4}
).option("强制", "强制给予").action(
    async argv => {
            let [player, item, amount, nbt] = argv.args;
            if (!_.isPlainObject(nbt)) nbt = {};
            if (!player || !item || typeof amount != "number") return "缺失参数。";
            let stack = new swbot.ItemStack(String(item.id), amount, nbt);
            let result = await player?.give(stack, argv.options["强制"] ? new swbot.CommandEvent(argv) : undefined);
            if (result) return `成功给予 ${player.getNameWithIdentifier(argv.session)} ${stack.toString(player, new swbot.CommandEvent(argv))}。`;
            else return "给予失败";
    }
);
