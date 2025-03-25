import { activeEffect, trackEffect, triggerEffects } from "./effect";

const targetMap = new WeakMap(); // 存放依赖收集的关系

// type Dep = Map<ReactiveEffect, number> // 依赖集合
// type TargetMap = WeakMap<Object, Map<string, Dep>> // 全局依赖存储
/**
 * 用于创建Map
 * @param cleanup 这个是清理方法，用于清理不需要的属性
 * @param name 标记当前map属于哪个属性（源码没有）
 * @returns
 */
export const createDep = (cleanup, name) => {
  const dep = new Map() as any; // 创建的收集器还是一个map
  dep.cleanup = cleanup; // 清理方法
  dep.name = name; // 自定义标识，标记当前map服务于哪个属性
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

    console.log("targetMap", targetMap);
  }
}

// 需要记录的格式，记录每个属性收集的effect
// tarMap: {obj: (Map){key: (Map){effectFn1, effectFn2}}
/*
{
    { name: "jw", age: 30 }: {
        name: [effectFn1, effectFn2],
        age: [effectFn1 ]
    }
}
*/

/**
 * 触发与目标对象特定属性相关的所有 effect 函数
 *
 * 当目标对象的某个属性被修改时，会调用此方法来通知所有依赖该属性的 effect 函数重新执行。
 *
 * @param target - 被代理的目标对象
 * @param key - 被修改的属性键
 * @param newValue - 属性的新值
 * @param oldValue - 属性的旧值
 */
export function trigger(target, key, newValue, oldValue) {
  console.log("触发更新", target, key, newValue, oldValue);
  // 从 targetMap 中获取与目标对象相关的依赖映射表
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    // 如果没有找到依赖映射表，说明没有 effect 依赖该对象，直接返回
    return;
  }

  // 获取与特定属性相关的依赖集合
  const dep = depsMap.get(key);
  if (!dep) {
    // 如果没有找到依赖集合，说明没有 effect 依赖该属性，直接返回
    return;
  }

  // 找到修改的属性对应的effect，遍历依赖集合中的所有 effect 函数并执行
  triggerEffects(dep);
}
