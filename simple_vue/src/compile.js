class Compile {
  constructor(el, vm) {
    this.$el = this.isElementNode(el) ? el : document.querySelector(el)
    this.$vm = vm
    if (this.$el) {
      // 将el中的内容放到 fragment
      this.$fragment = this.node2fragment(this.$el)
      // 编译fragment
      this.init()
      // 将编译后的fragment插入到$el
      this.$el.appendChild(this.$fragment);
    }
  }

  // 将节点的子节点插入到DocumentFragments，返回DocumentFragments
  node2fragment (el) {
    let fragment = document.createDocumentFragment()
    let firstChild
    while (firstChild = el.firstChild) {
      fragment.append(firstChild)
    }
    return fragment
  }

  // 编译
  init () {
    this.compileElement(this.$fragment)
  }

  // 编译元素节点
  compileElement (node) {
    let childNodes = node.childNodes
    Array.from(childNodes).forEach(node => {
      var text = node.textContent
      var reg = /\{\{(.*)\}\}/  // {{}} 模板
      if (this.isElementNode(node)) {
        this.compile(node)
      }
      else if (this.isTextNode(node) && reg.test(text)) {
        this.compileText(node, RegExp.$1)
      }
      // 遍历编译子节点
      if (node.childNodes && node.childNodes.length) {
        this.compileElement(node)
      }
    })
  }

  compile (node) {
    let attrs = node.attributes
    Array.from(attrs).forEach(attr => {
      let attrName = attr.name
      if (this.isDirective(attrName)) {
        // 获取指令的值
        let exp = attr.value
        // 解构负值，将v-model中的model截取处理
        let [,dir] = attrName.split('-')
        // 事件指令, 如 v-on:click
        if (this.isEventDirective(dir)) {
          compileUtil.eventHandler(node, this.$vm, exp, dir)
        // 普通指令
        } else {
          compileUtil[dir] && compileUtil[dir](node, this.$vm, exp)
        }

        node.removeAttribute(attrName)
      }
    })
  }

  // 编译文本节点
  compileText (node, exp) {
    compileUtil.text(node, this.$vm, exp)
  }

  isDirective (attr) {
    return attr.indexOf('v-') == 0;
  }

  isEventDirective (dir) {
    return dir.indexOf('on') === 0
  }

  isElementNode (node) {
    return node.nodeType == 1
  }

  isTextNode (node) {
    return node.nodeType == 3
  }
}

// 指令处理集合
var compileUtil = {
  text: function(node, vm, exp) {
    this.bind(node, vm, exp, 'text')
  },

  html: function(node, vm, exp) {
    this.bind(node, vm, exp, 'html')
  },

  model: function(node, vm, exp) {
    this.bind(node, vm, exp, 'model')

    var that = this
    var val = this._getVMVal(vm, exp)
  
    node.addEventListener('input', function(e) {
        var newValue = e.target.value;
        if (val === newValue) {
            return;
        }

        that._setVMVal(vm, exp, newValue)
        val = newValue
    })
  },

  class: function(node, vm, exp) {
    this.bind(node, vm, exp, 'class')
  },

  /**
   * 初始化视图并实例化Watcher
   * @param {DOM} node 元素节点
   * @param {Object} vm MVVM实例
   * @param {*} exp 指令的值
   * @param {String} dir 指令名
   */
  bind: function(node, vm, exp, dir) {
    // 获取对应命令的更新函数
    var updaterFn = updater[dir + 'Updater']

    // 第一次初始化视图
    updaterFn && updaterFn(node, this._getVMVal(vm, exp))

    // 实例化订阅者，此操作会在对应的属性消息订阅器中添加了该订阅者watcher
    new Watcher(vm, exp, function(value, oldValue) {
      // 一旦属性值有变化，会收到通知执行此更新函数，更新视图
      updaterFn && updaterFn(node, value, oldValue)
    })
  },

  // 事件处理
  eventHandler: function(node, vm, exp, dir) {
    var eventType = dir.split(':')[1]
    var fn = vm.$options.methods && vm.$options.methods[exp]

    if (eventType && fn) {
      node.addEventListener(eventType, fn.bind(vm), false)
    }
  },

  /**
   * 
   * @param {Object} vm MVVM实例
   * @param {*} exp 指令的值
   */
  _getVMVal: function(vm, exp) {
    var val = vm
    var exp = exp.split('.')
    exp.forEach(function(k) {
        val = val[k]
    });
    return val
  },

  _setVMVal: function(vm, exp, value) {
    var val = vm
    var exp = exp.split('.')
    exp.forEach(function(k, i) {
        // 非最后一个key，更新val的值
        if (i < exp.length - 1) {
            val = val[k]
        } else {
            val[k] = value
        }
    })
  }
}

// 更新函数
var updater = {
  textUpdater: function(node, value) {
    node.textContent = typeof value == 'undefined' ? '' : value
  },

  htmlUpdater: function(node, value) {
    node.innerHTML = typeof value == 'undefined' ? '' : value
  },

  classUpdater: function(node, value, oldValue) {
    var className = node.className;
    className = className.replace(oldValue, '').replace(/\s$/, '')

    var space = className && String(value) ? ' ' : ''

    node.className = className + space + value
  },

  modelUpdater: function(node, value, oldValue) {
    node.value = typeof value == 'undefined' ? '' : value
  }
}