/**
 * 观察者的目的就是给需要变化的那个元素增加一个观察者，
 * 当数据变化后，执行对应的方法
 * 目的：用新值和老值进行比对，如果发生变化，就调用更新方法
 */

class Watcher {
  /**
   * 
   * @param {Object} vm MVVM实例
   * @param {StringorFunction} expOrFn 指令的值
   * @param {Function} cb 回调函数
   */
  constructor (vm, expOrFn, cb) {
    this.cb = cb
    this.vm = vm
    this.expOrFn = expOrFn
    this.depIds = {}
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      // 获取getter函数
      this.getter = this.parseGetter(expOrFn.trim())
    }
    // 此处为了触发属性的getter，从而在dep添加自己，结合Observer更易理解
    this.value = this.get()
  }

  update () {
    this.run() // 属性值变化收到通知
  }

  run () {
    var value = this.get() // 取到最新值
    var oldVal = this.value
    if (value !== oldVal) {
      this.value = value
      this.cb.call(this.vm, value, oldVal) // 执行Compile中绑定的回调，更新视图
    }
  }

  addDep (dep) {
    if (!this.depIds.hasOwnProperty(dep.id)) {
      dep.addSub(this)
      // 添加到到depIds
      this.depIds[dep.id] = dep
    }
  }

  get () {
    Dep.target = this  // 将当前订阅者指向自己
    var value = this.getter.call(this.vm, this.vm) // 触发getter，添加自己到属性订阅器Dep中
    Dep.target = null // 添加完毕，重置
    return value
  }

  /**
   * 获取v-指令、computed在data计算后的值
   * @param {String} exp 指令中的值
   */
  parseGetter (exp) {
    if (/[^\w.$]/.test(exp)) return

    var exps = exp.split('.')

    return function(obj) {
      for (var i = 0, len = exps.length; i < len; i++) {
        if (!obj) return
        obj = obj[exps[i]]
      }
      return obj
    }
  }
}