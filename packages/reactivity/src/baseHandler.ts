import { isObject } from "@vue/shared";
import { track, trigger } from "./reactiveEffect";
import { reactive } from "./reactive";

export enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive", // 去这个名字是为了尽量复杂，基本唯一
}

// proxy需要搭配Reflect使用
export const mutableHandlers: ProxyHandler<any> = {
  get(target, key, receiver) {
    // 数据劫持，如果key是__v_isReactive，则返回true
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }
    // 依赖收集：当取值的时候应该让响应式属性和effect映射起来
    track(target, key); // 收集这个对象上的这个属性，与effect关联起来，以便属性变化（set）时，可以执行effect里的fn函数
    const res = Reflect.get(target, key, receiver);
    if (isObject(res)) {
      // 深度代理：当取到的值是对象时，需要对这个对象再进行代理，递归代理
      return reactive(res);
    }
    return res;
  },
  set(target, key, value, receiver) {
    let oldValue = target[key]; // 旧值
    let result = Reflect.set(target, key, value, receiver); // 注意要在拿到旧值后再set
    // 触发更新：找到属性，让对应的effect重新执行
    if (oldValue !== value) {
      // 如果新值和旧值不相等，才触发更新
      trigger(target, key, value, oldValue); // 要触发的是哪个对象，哪个属性，旧值是多少，新值是多少
    }

    return result;
  },
};
