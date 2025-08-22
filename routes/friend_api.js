/**
 * 将API开放出去
 */

const friend_api = require("../utils/Rssleancloud");
const Router = require("koa-router");
const friendApiRouter = new Router();

friendApiRouter.get("/query", async (ctx) => {
    ctx.body = await friend_api.get_query();
});

friendApiRouter.post("/create", async (ctx) => {
    const { name, link, rss, avatar, descr } = ctx.request.body || {};
    if (!name || !link || !rss) {
        ctx.body = { code: 400, msg: "参数缺失" };
        return;
    }
    ctx.body = await friend_api.get_create(name, link, rss, avatar, descr);
});

friendApiRouter.post("/update", async (ctx) => {
    const { name, link, rss, avatar, descr } = ctx.request.body || {};
    if (!name || !link || !rss) {
        ctx.body = { code: 400, msg: "参数缺失" };
        return;
    }
    ctx.body = await friend_api.get_update(name, link, rss, avatar, descr);
});

friendApiRouter.post("/delete", async (ctx) => {
    const { id } = ctx.request.body || {};
    if (!id) {
        ctx.body = { code: 400, msg: "参数缺失" };
        return;
    }
    ctx.body = await friend_api.get_del(id);
});

module.exports = friendApiRouter;
