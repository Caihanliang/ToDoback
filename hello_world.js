/**
 * 原始示例文件：简易超文本传输协议服务器
 * 当前项目已改用 app.js 作为正式入口，本文件仅作参考保留。
 */

// 引入 Node.js 内置的 http 模块
var http = require('http');

// 创建服务器：收到请求时返回「Hello World!」页面
http.createServer(function (req, res) {
  // 设置响应头：状态码 200，内容类型为超文本标记语言
  res.writeHead(200, {'Content-Type': 'text/html'});
  // 结束响应并返回页面内容
  res.end('Hello World!');
}).listen(8080, () => {
  // 监听 8080 端口成功后打印提示
  console.log('Server running at http://0.0.0.0:8080/');
});
