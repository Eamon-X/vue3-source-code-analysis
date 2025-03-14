import { isObject } from "@vue/shared";

export function reactive(target) {
  return createReactiveObject(target);
}

// 用于级联我们的代理后的结果，可以复用
// WeakMap 弱引用，防止内存泄漏
const reactiveMap = new WeakMap();

enum ReactiveFlags {
    IS_REACTIVE = "__v_isReactive", // 去这个名字是为了尽量复杂，基本唯一
}

const mutableHandlers: ProxyHandler<any> = {
  get(target, key, receiver) {
    // 数据劫持，如果key是__v_isReactive，则返回true
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }
  },
  set(target, key, value, receiver) {
    return true;
  },
};
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

// 1. 保证数据不被重复代理
// 2. 如果对象已经被代理过了，不重复代理