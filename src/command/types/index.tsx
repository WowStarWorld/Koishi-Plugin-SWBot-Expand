import { Argv, segment } from "koishi";
import json5 from "json5";
import { getContext } from "../../index";
import _ from "lodash";

let ctx = getContext();
let swbot = ctx.swbot.core;

type Player = import("koishi-plugin-swbot/src/core/index").Player;
type Item = import("koishi-plugin-swbot/src/core/index").Item;
type NBTCompound = import("koishi-plugin-swbot/src/core/index").NBTCompound;

declare module 'koishi' {
    namespace Argv {
        interface Domain {
            "玩家标识": Player;
            "物品标识": Item;
            "数据标签": NBTCompound;
            "正整数": number;
        }
    }
}

Argv.createDomain(
    "玩家标识",
    (source, session) => {
        let id: string;
        let platform: string;
        let element = segment.parse(source)[0];
        if (element.type == "at") {
            id = element.attrs.id;
            platform = session.platform;
        } else {
            try {
                let identifier = swbot.Identifier.parse(String(element));
                id = identifier.path;
                platform = identifier.namespace;
            } catch { throw new Error("无效玩家标识。"); }
        }
        if (typeof id == "undefined" || typeof platform == "undefined") throw new Error("无效玩家标识。");
        try {
            return new swbot.Player(id, platform);
        } catch { throw new Error("无效玩家标识。"); }
    }
);

Argv.createDomain(
    "物品标识",
    (source, session) => {
        let item = swbot.Item.findByIdentifier(source);
        if (item) return item;
        else throw new Error("未知物品。");
    }
);

Argv.createDomain(
    "数据标签",
    (source, session) => {
        try {
            return json5.parse(source);
        } catch {
            throw new Error("应为数据标签。");
        }
    }
);

Argv.createDomain(
    "正整数",
    (source, session) => {
        let int = _.toInteger(source);
        if (int < 1) throw new Error("应为正整数");
        return int;
    }
);

