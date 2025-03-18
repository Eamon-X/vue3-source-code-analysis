import { track } from "./reactiveEffect";

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
    // 当取值的时候应该让响应式属性和effect映射起来

    // TODO：依赖收集
    track(target, key); // 收集这个对象上的这个属性，与effect关联起来，以便属性变化（set）时，可以执行effect里的fn函数

    return Reflect.get(target, key, receiver);
  },
  set(target, key, value, receiver) {
    // 找到属性，让对应的effect重新执行

    // TODO：触发更新
    return Reflect.set(target, key, value, receiver);
  },
};
