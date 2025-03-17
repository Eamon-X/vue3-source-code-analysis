export function effect(fn, options?) {
  // 创建一个响应式effect，数据变化后可以重新执行

  // 创建一个effect，只要依赖的属性变化了，就要重新执行回调
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });

  // 默认先执行一次
  _effect.run();
}
