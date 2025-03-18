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
class ReactiveEffect {
  _trackId = 0; // 用于记录当前effect执行了几次
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
      return this.fn(); // 执行传入的函数，并把返回值返回
    } finally {
      activeEffect = lastEffect; // 解决嵌套effect时的依赖关系混乱的问题
    }
  }
  // 停止侦听
  stop() {
    /* 从所有依赖中移除自身 */
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
  dep.set(effect, effect._trackId);
}
