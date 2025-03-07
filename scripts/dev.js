//这个文件会帮我们打包 packages下的模块，最终打包出js文件
//node dev.js (要打包的名字 -f 打包的格式) === argv.slice(2)
import minimist from "minimist"; // minimist 是用来解析命令行参数，如果不用会怎么样？
import { fileURLToPath } from "url";
import { resolve, dirname } from "path";
import { createRequire } from "module";
import esbuild from "esbuild"; //esbuild 是一个js库的打包工具，主要是开发用。生产环境一般使用rollup
//node中的命令函参数通过process 来获取 process.argv
const args = minimist(process.argv.slice(2));

const target = args._[0] || "reactivity"; // 打包哪个项目
const format = args.f || "iife"; // 打包后的模块化规范：iife 代表立即执行函数，打包出来后是(function(){})()

console.log(args); // { _: [ 'reactivity' ], f: 'esm' }
console.log(target, format); // reactivity esm

// esm使用commonjs变量
// node中esm模块没有 __dirname，所以需要手动指定
const __filename = fileURLToPath(import.meta.url); // 获取文件的绝对路径 由file:/// 开头
const __dirname = dirname(__filename);
console.log(__filename); // D:\xxx\vue3-source-code-analysis\scripts\dev.js
console.log(__dirname); // D:\xxx\vue3-source-code-analysis\scripts

// node中esm模块没有 require，所以需要手动指定
const require = createRequire(import.meta.url); // 参数为基准路径
// 入口文件，根据命令行提供的路径来进行解析
const ertry = resolve(__dirname, `../packages/${target}/src/index.ts`);
const pkg = require(`../packages/${target}/package.json`); // 这是一个json文件，所以pkg就是一个对象
// 根据需要进行打包
esbuild
  .context({
    entryPoints: [ertry], // 入口
    bundle: true, // reactivity引用了shared，会打包到一起
    platform: "browser", // 打包给浏览器使用
    sourcemap: true, // 可以调试源码
    format, // cjs（module.export） esm（import export） iife（立即执行函数，需要指定globalName）
    globalName: pkg.buildOptions?.name, // 指定全局的变量名字，从package.json中获取
    outfile: resolve(
      __dirname,
      `../packages/${target}/dist/${target}-${format}.js`
    ), // 出口
  })
  .then((ctx) => {
    console.log(`${target}构建成功`);
    return ctx.watch(); // 监控入口文件持续进行打包处理
  });
