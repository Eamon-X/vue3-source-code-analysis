import { activeEffect } from "./effect";

const targetMap = new WeakMap(); // 存放依赖收集的关系

/**
 * 用于创建Map
 * @param cleanup 这个是清理方法，用于清理不需要的属性
 * @param key 标记当前map属于哪个属性（源码没有）
 * @returns
 */
export const createDep = (cleanup, name) => {
  const dep = new Map() as any;
  dep.cleanup = cleanup;
  dep.name = name;
  return dep;
};
export function track(target, key) {
  // 有这个属性，证明这个key是在effect中访问的，没有则说明是在effect之外访问的，不用收集
  if (activeEffect) {
    console.log("track", target, key, activeEffect);

    let depsMap = targetMap.get(target);
    if (!depsMap) {
      // 没有收集过该对象，需要新增
      // 第一个参数 target 是键，通常代表一个被代理的对象；第二个参数就是 (depsMap = new Map()) 表达式的值，即新创建的 Map 对象。
      // (depsMap = new Map())这是一个赋值表达式，它先创建一个新的 Map 对象，接着把这个新对象赋值给变量 depsMap。赋值表达式的值就是赋值操作的右值，也就是新创建的 Map 对象。所以，这个表达式的值就是新创建的 Map 对象。
      targetMap.set(target, (depsMap = new Map()));
    }

    // 判断当前映射表是否存在当前属性，没有则新增
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, (dep = createDep(() => depsMap.delete(key), key))); // 后面用于清理不需要的属性
    }

    trackEffect(activeEffect, dep); // 将当前的effect放到dep（映射表）中，后续可以根据值的变化触发此dep中存放的effect
  }
}

// 需要记录的格式，记录每个属性收集的effect
// tarMap: {obj: {key: Map:{effectFn1, effectFn2}}
/*
{
    { name: "jw", age: 30 }: {
        name: [effectFn1, effectFn2],
        age: [effectFn1 ]
    }
}
*/
