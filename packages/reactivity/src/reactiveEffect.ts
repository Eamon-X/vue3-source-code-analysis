import { activeEffect } from "./effect";

export function track(target, key) {
  // 有这个属性，证明这个key是在effect中访问的，没有则说明是在effect之外访问的，不用收集
  if (activeEffect) {
    console.log("track", target, key, activeEffect);
  }
}

// 需要记录的格式，记录每个属性收集的effect
/*
{
    { name: "jw", age: 30 }: {
        name: [effectFn1, effectFn2],
        age: [effectFn1 ]
    }
}
*/
