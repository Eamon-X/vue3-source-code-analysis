import { toReactive } from "./reactive";
import { activeEffect, trackEffect, triggerEffects } from "./effect";
import { createDep } from "./reactiveEffect";

export function ref(value) {
  return createRef(value);
}

function createRef(value) {
  return new RefImpl(value);
}

class RefImpl {
  public __v_isRef = true; // 增加ref标记，标识是 ref 对象
  private _value; // 用来保存ref的值的
  public dep; // 依赖集合：用于收集对应的effect

  // public rawValue 增加public属性，则会自动在实例上增加rawValue这个属性
  // rawValue 存储原始值，用于比对变化
  constructor(public rawValue) {
    this._value = toReactive(rawValue); // 如果值是对象，用 reactive 包裹
  }
  get value() {
    // 收集依赖（与 reactive 共享 targetMap）
    trackRefValue(this);
    return this._value;
  }
  set value(newValue) {
    if (newValue !== this.rawValue) {
      // 只有当值有变化才执行
      this._value = newValue;
      this.rawValue = newValue;
      // 触发更新
      triggerRefValue(this);
    }
  }
}
function trackRefValue(ref) {
  if (activeEffect) {
    trackEffect(
      activeEffect,
      (ref.dep = createDep(() => (ref.dep = undefined), "undefined"))
    );
  }
}
function triggerRefValue(ref) {
  const dep = ref.dep;
  if (dep) {
    triggerEffects(dep);
  }
}
