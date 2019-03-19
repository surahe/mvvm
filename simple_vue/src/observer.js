/**
 * 添加到每个观察对象的Observer类
 * 添加后，观察者将目标对象的属性键转换为收集依赖关系和调度更新的getter / setter
 */
class Observer {
  constructor (data) {
    this.data = data
    this.walk(data)
  }
  /**
   * 遍历每个属性并将其转换为getter / setter
   * 仅当值类型为Object时才应调用此方法
   */
  walk (data) {
    Object.keys(data).forEach(key => {
      defineReactive(data, key, data[key])
    })
  }
}

/**
 * 为对象定义响应式属性
 * @param {Object} obj
 * @param {String} key
 * @param {*} value 
 */
function defineReactive (obj, key, value) {
  // 初始化 Dep 对象的实例
  const dep = new Dep()
  // 对子对象递归调用 observe 方法
  let childOb =  observe(value)

  // 给 obj 的属性 key 添加 getter 和 setter
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: false,
    get () {
      if (Dep.target) {
        dep.depend()
      }
      return value
    },
    set (newValue) {
      if (newValue === value) {
        return
      }
      value = newValue
      // 新的值是object的话，进行监听
      childObj = observe(newValue)
      dep.notify()
    }
  })
}

function observe(value, vm) {
  if (!value || typeof value !== 'object') {
    return
  }

  return new Observer(value)
}


let uid = 0;
/**
 * 消息订阅器
 */
class Dep {
  constructor () {
    this.id = uid++
    this.subs = []
  }

  // 将watcher实例添加到Dep实例
  addSub (sub) {
    this.subs.push(sub)
  }

  // 将Dep实例添加到当前Watcher实例
  depend () {
    Dep.target.addDep(this)
  }

  removeSub (sub) {
    var index = this.subs.indexOf(sub)
    if (index != -1) {
      this.subs.splice(index, 1)
    }
  }

  // 通知所有订阅者
  notify () {
    this.subs.forEach(sub => {
      sub.update()
    })
  }
}

Dep.target = null