export function effect(fn, options?) {
  // 创建一个响应式effect，数据变化后可以重新执行

  // 创建一个effect，只要依赖的属性变化了，就要重新执行回调
  const _effect = new ReactiveEffect(fn, () => {
    // scheduler
    _effect.run();
  });

  // 默认先执行一次
  _effect.run();
}
export let activeEffect; // 解决嵌套effect时的依赖关系混乱的问题
function preCleanEffect(effect: ReactiveEffect) {
  effect._depsLength = 0;
  effect._trackId++; // 每次执行effect，trackId自增，如果当前同一个effect执行， id就是相同的
  // 清空依赖
  for (let i = 0; i < effect._depsLength; i++) {
    effect.deps[i].delete(effect);
  }
}

function postCleanEffect(effect: ReactiveEffect) {
  if (effect.deps.length > effect._depsLength) {
    // 遍历effect.deps，将effect从所有依赖中移除
    for (let i = effect._depsLength; i < effect.deps.length; i++) {
      cleanDepEffect(effect.deps[i], effect); // 删除映射表中多余的effect
    }
    effect.deps.length = effect._depsLength; // 更新依赖列表的长度
  }
}
class ReactiveEffect {
  _trackId = 0; // 用于记录当前effect执行了几次（防止一个属性在当前effect中多次收集依赖，确保只收集一次）
  deps = []; // 用于记录存放了哪些依赖
  _depsLength = 0; // 用于记录当前effect依赖的个数
  public active = true; // 控制创建的effect是否是响应式的，effectScope.stop() 停止所有的effect 不参加响应式处理
  // fn是用户编写的函数
  // 如果fn中依赖的数据发生变化后，就重新调用scheduler，即重新执行run函数
  constructor(public fn, public scheduler) {}
  run() {
    // 让fn执行
    if (!this.active) {
      return this.fn(); // 不是响应式的，直接执行fn，其他什么都不做
    }
    let lastEffect = activeEffect;
    try {
      // 创建effect的时候，会执行fn，即用户编写的函数
      // 当用户编写的函数中，读取了响应式属性的时候，就会执行get方法
      // get方法中会收集依赖
      activeEffect = this; // 解决嵌套effect时的依赖关系混乱的问题

      // effect重新执行前，需要将上一次的依赖清空
      preCleanEffect(this);
      return this.fn(); // 执行传入的函数，并把返回值返回
    } finally {
      postCleanEffect(this);
      activeEffect = lastEffect; // 解决嵌套effect时的依赖关系混乱的问题
    }
  }
  // 停止侦听
  stop() {
    /* 从所有依赖中移除自身 */
  }
}

function cleanDepEffect(dep, effect) {
  dep.delete(effect);
  if (dep.size === 0) {
    dep.cleanup(); // 如果map为空，则删除这个属性
  }
}

/**
 * 将当前的 effect 添加到依赖集合中，用于建立响应式关系。
 *
 * @param effect 当前的 ReactiveEffect 实例，表示需要被追踪的副作用函数。
 * @param dep 依赖集合（通常是一个 WeakMap 或 Map 的值），用于存储所有相关的 effect。
 *
 * 功能：
 * - 将 effect 和其对应的唯一标识 `_trackId` 记录到依赖集合 `dep` 中。
 * - 确保当依赖的数据发生变化时，能够通过 `dep` 找到并触发相关的 effect。
 * - 使用 `dep.set(effect, effect._trackId)` 来记录 effect 的执行次数或状态，避免重复添加相同的 effect。
 */
export function trackEffect(effect, dep) {
  // 需要重新收集依赖，将不需要的移除掉
  if (dep.get(effect) !== effect._trackId) {
    // 优化多余的收集
    dep.set(effect, effect._trackId); // 记录 effect 到依赖集合(收集器)中
    let oldDep = effect.deps[effect._depsLength];
    // 拿到上一次依赖的最后一个和这次的比较
    if (oldDep !== dep) {
      if (oldDep) {
        // 删除老的依赖
        cleanDepEffect(oldDep, effect);
      }
      // 记录新的依赖
      effect.deps[effect._depsLength++] = dep; // 永远按照本次最新的属性和顺序来存放（反向记录，用于 cleanup）
    } else {
      effect._depsLength++;
    }
  }

  // // 双向记忆
  // dep.set(effect, effect._trackId); // 记录 effect 到依赖集合(收集器)中
  // // 记录effect里有哪些收集器
  // effect.deps[effect._depsLength++] = dep; // （反向记录，用于 cleanup）
}

/**
 * 触发依赖项中的所有副作用函数
 *
 * 此函数通过遍历给定的依赖项数组，并执行其中的每一个副作用函数，来实现响应式更新
 * 它主要用于在数据变化时，执行相关的更新操作，以保持视图和状态的一致性
 *
 * @param dep 一个包含所有相关副作用函数的数组当依赖项中的任何一个值发生变化时，所有副作用函数都会被触发
 */
export function triggerEffects(dep) {
  for (const effect of dep.keys()) {
    if (effect.scheduler) {
      effect.scheduler(); // 相当于 effect.run();
    }
  }
}
