import { isObject } from "@vue/shared";
import { mutableHandlers, ReactiveFlags } from "./baseHandler";

// 用于级联我们的代理后的结果，可以复用
// WeakMap 弱引用，防止内存泄漏
const reactiveMap = new WeakMap();

function createReactiveObject(target) {
  // Proxy 接收 Object
  if (!isObject(target)) return target;

  // 如果已经代理过，则直接返回
  // 这是在尝试取出数据的IS_REACTIVE变量，这会导致调用get方法，如果有get方法，则相当于已经代理过，避免重复代理
  if (target[ReactiveFlags.IS_REACTIVE]) return target;
  // 如果有缓存，直接返回
  //   const existProxy = reactiveMap.get(target);
  //   if(existProxy) return existProxy;
  if (reactiveMap.has(target)) return reactiveMap.get(target);
  const proxy = new Proxy(target, mutableHandlers);
  // 根据对象缓存代理后的结果
  reactiveMap.set(target, proxy);
  return proxy;
}

// 1. 如果对象已经被代理过了，不重复代理
// 2. 如果已经是代理对象，不重复代理

export function reactive(target) {
  return createReactiveObject(target);
}

export function toReactive(value) {
  // 如果传入的是对象，则通过reactive代理
  return isObject(value) ? reactive(value) : value;
}
