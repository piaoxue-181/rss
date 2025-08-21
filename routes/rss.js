/**
 * 爬取RSS订阅
 */

const { get, set } = require("../utils/cacheData");
const { get_query } = require("../utils/Rssleancloud");
const Parser = require('rss-parser');
const Router = require("koa-router");
const cheerio = require('cheerio');
const axios = require('axios'); // 新增
const rssRouter = new Router();

const parser = new Parser({
  requestOptions: {
    timeout: 5000,
  },
  customFetch: async (url, _options) => {
    const res = await axios.get(url, { timeout: 5000, responseType: 'text' });
    return {
      ok: true,
      status: res.status,
      text: async () => res.data,
    };
  }
});

async function getFaviconPathFromHtml(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    // 查找 rel 为 icon 的 link 标签
    const iconLink = $('link[rel="icon"], link[rel="shortcut icon"]').attr('href');
    if (iconLink) {
      return new URL(iconLink, url).href; // 拼接完整 URL
    }
    // 未找到则返回默认路径
    return new URL('/favicon.ico', url).href;
  } catch (error) {
    console.error('解析 HTML 失败：', error.message);
    return new URL('/favicon.ico', url).href;
  }
}

// 提取URL中的主域名
function getDomainFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function sortByGmtDate(items, dateField = 'date', ascending = true) {
  return [...items].sort((a, b) => {
    const timeA = a[dateField] ? new Date(a[dateField]).getTime() : 0;
    const timeB = b[dateField] ? new Date(b[dateField]).getTime() : 0;
    return ascending ? timeA - timeB : timeB - timeA;
  });
}

// 新增：获取 favicon 并转为 base64
async function getFaviconBase64(url) {
  try {
    const faviconUrl = await getFaviconPathFromHtml(url);
    const response = await axios.get(faviconUrl, { responseType: 'arraybuffer', timeout: 5000 });
    const contentType = response.headers['content-type'] || 'image/x-icon';
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    // 获取失败返回空字符串
    return '';
  }
}

rssRouter.get("/rss", async (ctx) => {
  const { limit = 36 } = ctx.query;
  const cacheKey = "rss_list_cache";
  const url_list = await get_query();
  let data = await get(cacheKey);
  if (data) {
    ctx.body = data.slice(0, limit);
    return;
  }

  // 并发抓取所有源
  const results = await Promise.allSettled(
    url_list.map(async url => {
      const feed = await parser.parseURL(url["rss"]);
      // 获取站点favicon并转为base64
      let faviconBase64 = '';
      try {
        faviconBase64 = await getFaviconBase64(url["rss"]);
      } catch {
        faviconBase64 = '';
      }
      return feed.items.map(item => ({
        "title": item.title || '',
        "auther": feed.title || '',
        "date": item.pubDate ? formatDateToCST(item.pubDate) : '',
        "link": item.link || '',
        "domain": getDomainFromUrl(item.link || ''),
        "image_ico": faviconBase64,
        "content": item.contentSnippet
          ? item.contentSnippet.replace(/</g, '&lt;').replace(/>/g, '&gt;').substring(0, 200) + '...'
          : (item.content
              ? item.content
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/&lt;[^&gt;]+&gt;/g, '')
                  .substring(0, 200) + '...'
              : ''),
      }));
    })
  );

  let rss_list = [];
  for (const r of results) {
    if (r.status === 'fulfilled') {
      rss_list.push(...r.value);
    }
  }

  let rss_list_new = sortByGmtDate(rss_list, 'date', false);
  await set(cacheKey, rss_list_new, 60 * 60 * 24);
  ctx.body = rss_list_new.slice(0, limit);
});


// 格式化为 2025-06-24 21:16:16（东八区）
function formatDateToCST(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  // 转为东八区
  const cstDate = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const pad = n => n.toString().padStart(2, '0');
  return `${cstDate.getFullYear()}-${pad(cstDate.getMonth() + 1)}-${pad(cstDate.getDate())} ${pad(cstDate.getHours())}:${pad(cstDate.getMinutes())}:${pad(cstDate.getSeconds())}`;
}

module.exports = rssRouter;
