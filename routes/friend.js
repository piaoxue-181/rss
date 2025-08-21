/**
 * 获取友链
 */

const { get_query } = require("../utils/Rssleancloud");
const Router = require("koa-router");
const friendRouter = new Router();

friendRouter.get("/friend", async (ctx) => {
    let friend_list = await get_query();
    // 修复map方法的使用，使用箭头函数作为回调
    ctx.body = friend_list.map(friend => ({
        "name": friend.name,
        "link": friend.link,
        "avatar": friend.avatar,
        "descr": friend.descr
    }));
});

module.exports = friendRouter;
