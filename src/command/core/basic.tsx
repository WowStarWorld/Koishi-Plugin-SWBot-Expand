import { getContext } from "../../index";
import "koishi-plugin-puppeteer";
import _ from "lodash";

let ctx = getContext();
let swbot = ctx.swbot.core;

type Recipe = import("koishi-plugin-swbot/src/core").Recipe;

export const giveCommand = ctx.command(
    "给予 <玩家:玩家标识> <物品:物品标识> <数量:正整数> [标签:数据标签]", "给予玩家物品",  {authority: 4}
).option(
    "强制", "强制给予"
).action(
    async argv => {
        let [player, item, amount, nbt] = argv.args;
        if (!_.isPlainObject(nbt)) nbt = {};
        if (!player || !item || typeof amount != "number") return "缺失参数。";
        let stack = new swbot.ItemStack(String(item.id), amount, nbt);
        let result = await player?.give(stack, argv.options["强制"] ? new swbot.CommandEvent(argv) : undefined);
        if (result) return `成功给予 ${await player.getNameWithIdentifier(argv.session)} ${await stack.getNameWithIdentifier(player, new swbot.CommandEvent(argv))}。`;
        else return "给予失败";
    }
);

export const dropCommand = ctx.command(
    "丢弃 <物品槽:正整数> [数量:正整数]", "丢弃玩家物品"
).option(
    "强制", "强制丢弃", {authority: 4}
).option(
    "玩家", "<玩家:玩家标识> 目标玩家", {authority: 4}
).action(
    async argv => {
        let player = argv.options?.["玩家"] ?? argv.session.swbot.player;
        let slot = argv.args?.[0];
        let amount = argv.args?.[1];
        if (!player || typeof slot != "number") return "无效参数。";
        let inventory = (await player.getInventory());
        if (!amount) amount = inventory?.[slot - 1].count;
        let stack = inventory[slot - 1];
        if (!stack) return `物品不存在！`;
        player.drop(stack.id, amount, stack.nbt, argv.options["强制"] ? new swbot.CommandEvent(argv) : undefined);
        return `丢弃了 ${await player.getNameWithIdentifier(argv.session)} 的 ${await new swbot.ItemStack(stack.id, amount, stack.nbt).getNameWithIdentifier(player, new swbot.CommandEvent(argv))}。`;
    }
);

export const inventoryCommand = ctx.command("物品栏 <页:正整数>", "查看物品栏").option(
    "玩家", "<玩家:玩家标识> 查看其他玩家物品栏"
).action(
    async argv => {
        let player = argv.options["玩家"] ?? argv.session.swbot.player;
        let inventory = await player.getInventory();
        let pageIndex = argv.args[0] ?? 1;
        let pages = _.chunk(inventory, 10);
        let page = pages[pageIndex - 1];
        if (!pages.length) return `物品栏为空！`;
        if (!page) return `页 ${pageIndex} 不存在！`;
        return `${
                await player.getNameWithIdentifier(argv.session)
        } 的 物品栏 (${pageIndex}/${pages.length})\n————————\n${
                (await Promise.all(page.map(async (i, index) => "[" + String(index + ((pageIndex - 1) * 10) + 1) + "] " + await i.getNameWithIdentifier(player, new swbot.CommandEvent(argv))))).join("\n")
        }\n————————`;
    }
);

export const craftCommand = ctx.command(
    "合成 <物品:物品标识> [方案:正整数] [数量:正整数]", "合成物品"
).option("页", "<页:正整数>").action(
    async argv => {
        let id = argv.args[0];
        let plan = argv.args[1];
        let amount = argv.args[2];
        let player = argv.session.swbot.player;
        if (!id) return "缺失参数。";
        let recipes = swbot.Recipe.findByResult(id.id);
        if (!plan) {
            let pageIndex = argv.options["页"] ?? 1;
            let pages = _.chunk(recipes, 10);
            if (!pages.length) return `未找到。`;
            let page = pages[pageIndex - 1];
            if (!page) return `页 ${pageIndex} 不存在。`;
            let recipeToString = async (i: Recipe, index: number) => {
                return `[${(pageIndex - 1) * 10 + index + 1}] ${await i.result.getNameWithIdentifier()}\n${(await Promise.all(i.recipe().recipes.map(async i => await new swbot.ItemStack(i.id, i.count, i.nbt).getNameWithIdentifier(argv.session.swbot.player)))).join("\n")}`;
            };
            return `${await id.getName(argv.session.swbot.player)} 的 配方 (${pageIndex}/${pages.length})\n————————\n${(await Promise.all(page.map(recipeToString))).join("\n\n")}\n————————`;
        } else if (typeof amount == "number") {
            let recipe = recipes[plan - 1];
            let result = await recipe.craft(player, amount, new swbot.CommandEvent(argv));
            if (result.type == "insufficient.items") {
                return `材料不足，缺少 ${await result.require.getNameWithIdentifier(player, argv.session)}。`;
            } else if (result.type == "success") {
                return <template>
                    {`合成 ${await result.result.getNameWithIdentifier(player, argv.session)} 成功，消耗了\n————————\n`}
                    {(await Promise.all(result.recipes.map(i => new swbot.ItemStack(i.id, i.count, i.nbt ?? {}).getNameWithIdentifier(player, argv.session)))).join("\n")}
                    {`\n————————`}
                </template>;
            }
        } else {
            return "无效参数。";
        }
    }
);
