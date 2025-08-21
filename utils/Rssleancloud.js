// 切换到 Friend 应用（仅切换配置，不初始化）
const AV = require('leancloud-storage');

// 初始化 LeanCloud 连接
AV.init({
  appId: process.env.APP_ID_FRIEND,
  appKey: process.env.APP_KEY_FRIEND,
  serverURLs: process.env.SERVERURL_FRIEND,
});

/**
 * 创建并保存一条数据
 */
const get_create = async function createData(name, link, rss, avatar, descr) {
  try {
    const Friend = AV.Object.extend('Friend');
    const friend = new Friend();
    
    friend.set('name', name);
    friend.set('link', link);
    friend.set('rss', rss);
    friend.set('avatar', avatar);
    friend.set('descr', descr);
    
    const result = await friend.save();
    console.log('数据创建成功，ID:', result.id);
    return result;
  } catch (error) {
    console.error('创建数据失败:', error);
    return null; // 确保始终返回一个值
  }
}

/**
 * 查询数据 - 修复版
 */
const get_query = async function queryData() {
  try {
    const query = new AV.Query('Friend');
    query.descending('time'); // 按时间降序排序
    const results = await query.find();
    
    console.log(`查询到 ${results.length} 条数据:`);
    
    // 使用 map 替代 forEach，因为 map 会返回新数组
    const list_get = results.map(item => ({
      "id": item.id,
      "name": item.get('name'),
      "link": item.get('link'),
      "rss": item.get("rss"),
      "avatar": item.get('avatar'), // 修复：之前错误地获取了 'status'
      "descr": item.get('descr'),   // 修复：之前错误地获取了 'priority'
      "time": item.get("time")
    }));
    
    // 移除了错误的 Promise 处理逻辑，因为查询结果不是 Promise 数组
    return list_get;
  } catch (error) {
    console.error('查询数据失败:', error);
    return []; // 错误时返回空数组，避免 undefined
  }
}

/**
 * 更新数据
 */
const get_update = async function updateData(objectId, name, link, rss, avatar, descr) {
  try {
    const friend = AV.Object.createWithoutData('Friend', objectId);
    friend.set('name', name);
    friend.set('link', link);
    friend.set('rss', rss);
    friend.set('avatar', avatar);
    friend.set('descr', descr);    
    const result = await friend.save();
    console.log(`ID为 ${objectId} 的数据更新成功`);
    return result;
  } catch (error) {
    console.error('更新数据失败:', error);
    return null;
  }
}

/**
 * 删除数据
 */
const get_del = async function deleteData(objectId) {
  try {
    const friend = AV.Object.createWithoutData('Friend', objectId);
    await friend.destroy();
    console.log(`ID为 ${objectId} 的数据删除成功`);
    return true;
  } catch (error) {
    console.error('删除数据失败:', error);
    return false;
  }
}

module.exports = {
  get_create,
  get_query,
  get_update,
  get_del
};
