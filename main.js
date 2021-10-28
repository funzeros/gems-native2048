import { genDom, getDom, useStorage, randomArr } from "./utils/utils.js";
// 历史最高分存储和读取方法
const { save: saveBestScore, read: getBestScore } = useStorage(
  "_BEST_SCORE",
  0
);
// 游戏进度存储和读取方法
const { save: saveGame, read: getGame } = useStorage("_GAME_SAVE", {
  cells: [],
  score: 0,
});
// 基本配置
const defaultOptions = {
  // 基本分值
  baseValue: 2,
  // 宫格 类名
  gridName: "cell-grid",
  // 单元格类名
  cellName: "cell-item",
  // 宫格长宽
  gridWidth: 700,
  // 单元格间隔
  gap: 20,
};
// 方向键映射keyCode 大写
const KEY_MAP = {
  UP: "ARROWUP",
  LEFT: "ARROWLEFT",
  RIGHT: "ARROWRIGHT",
  DOWN: "ARROWDOWN",
};
//   主场景
class MainSence {
  // app dom实例
  senceIns;
  // 管理app下子元素
  childs = new Map();
  // 配置项
  options;
  // 单元格偏移量 一格宽度+间隔
  offset;
  // 最小索引 行/列
  min = 0;
  // 最大索引 行/列
  max = 3;
  // 操作防抖定时器
  timer;
  // 操作防抖标志位
  flag = false;
  // 是否移动过
  hasMove = false;
  // 本局分数
  score = 0;
  // 历史分数
  historyScore = 0;
  // 移动端是否触摸中
  hasTouch = false;
  // 触摸起始X
  touchX = 0;
  // 触摸起始Y
  touchY = 0;
  // 触摸是否移动
  hasTouchMove = false;
  constructor(options) {
    // 配置项导入
    this.options = options;
    // 执行游戏初始化
    this.init();
  }
  // 游戏初始化方法
  init() {
    // 获取历史最高分
    this.historyScore = getBestScore();
    // 判断设备宽度是否小于800px 主要用于移动端适配
    if (document.body.clientWidth < 800) {
      // 小于800视为移动端 直接对半砍
      this.options.gridWidth = 350;
      this.options.gap = 10;
      // 判断设备高度是否小于937 主要用于PC小屏适配
    } else if (document.body.clientHeight < 937) {
      // 根据937-240进行比例缩放
      const scale =
        Math.floor(((document.body.clientHeight - 240) / (937 - 240)) * 100) /
        100;
      this.options.gridWidth = Math.floor(scale * this.options.gridWidth);
      this.options.gap = Math.floor(scale * this.options.gap);
    }
    // 根据上面获得的值 设置css变量
    document.documentElement.style.setProperty(
      "--cell-gap",
      `${this.options.gap}px`
    );
    document.documentElement.style.setProperty(
      "--cell-grid-width",
      `${this.options.gridWidth}px`
    );
    const cellWidth = (this.options.gridWidth - 5 * this.options.gap) / 4;
    document.documentElement.style.setProperty(
      "--cell-width",
      `${cellWidth}px`
    );
    this.offset = cellWidth + this.options.gap;
    // PC方向键事件绑定
    document.addEventListener("keydown", (e) => {
      this._handleKeydown(e);
    });
    // 移动端触摸开始
    document.addEventListener("touchstart", (e) => {
      const { pageX, pageY } = e.touches[0];
      // 设置初始位置
      this.touchX = pageX;
      this.touchY = pageY;
      // 表示触摸中
      this.hasTouch = true;
    });
    // 移动端触摸移动 判断移动距离超过50px 进行对应的键盘操作
    document.addEventListener("touchmove", (e) => {
      // 如果已经移动过就跳出 确保每次触摸只进行一次单元格移动
      if (this.hasTouchMove) return;
      const { pageX, pageY } = e.touches[0];
      if (pageX - this.touchX > 50)
        this._handleKeydown({ code: KEY_MAP.RIGHT });
      else if (pageY - this.touchY > 50)
        this._handleKeydown({ code: KEY_MAP.DOWN });
      else if (pageX - this.touchX < -50)
        this._handleKeydown({ code: KEY_MAP.LEFT });
      else if (pageY - this.touchY < -50)
        this._handleKeydown({ code: KEY_MAP.UP });
    });
    // 触摸结束 恢复默认值
    document.addEventListener("touchend", () => {
      this.touchX = 0;
      this.touchY = 0;
      this.hasTouch = false;
      this.hasTouchMove = false;
    });
  }
  // 按键执行事件
  _handleKeydown({ code }) {
    // 表示触摸移动已经执行了一次操作 后续移动无效 直至下次触摸
    this.hasTouchMove = true;
    // code大写 防止因大小写出现兼容问题
    const UpperCode = code.toLocaleUpperCase();
    // 判断是否是上下左右 其他按键跳出
    if (!Object.values(KEY_MAP).includes(UpperCode)) return;
    // 防抖
    if (this.flag) return;
    this.flag = true;
    this.timer = setTimeout(() => {
      this.flag = false;
    }, 100);
    // 获取宫格
    const grid = this.grid();
    // 执行对应的宫格实例中的移动方法
    grid[UpperCode]();
    // 移动结束 如果本次没有单元格移动
    if (!this.hasMove) {
      // 并且当前没有剩余单元格空间的则表示游戏结束
      if (!grid.getRemainCellName().length) {
        alert("game over");
        // 清除单元格
        grid.clear();
        // 重新开始游戏
        this.gameStart();
        // 进度保存
        this.save();
      }
      return;
    }
    // 否则游戏继续 生成一个新的单元格
    this.genRandomCell();
    // 恢复标志 表示可以进行下次移动
    this.hasMove = false;
    // 重置单元格状态 主要是合并状态
    grid.refreshCell();
    // 渲染分数
    this.renderScore();
    // 进度保存
    this.save();
  }
  // 游戏开始
  gameStart(game = { cells: [], score: 0 }) {
    // 设置和渲染分数
    this.score = game.score;
    this.renderScore();
    // 如果传入了单元格记录则渲染记录主要用于恢复进度
    if (game.cells.length) {
      game.cells.forEach(({ name, level }) => {
        this.genCell(name, level);
      });
      return;
    }
    // 否则渲染3个随机单元格
    new Array(3).fill(0).forEach(() => {
      this.genRandomCell();
    });
  }
  // 挂载
  mount(selector) {
    // 获取app dom
    this.senceIns = getDom(selector);
    // 生成三个系统DOM并挂载
    const oNewGame = genDom({
      className: ["new-game-btn"],
      dataValue: "重新开局",
    });
    const oScoerPanel = genDom({
      className: ["score-panel"],
      dataValue: "本局分数",
      level: 0,
    });
    const oScoerHistory = genDom({
      className: ["score-panel"],
      dataValue: "历史最高",
      level: this.historyScore,
    });
    this.append({ name: "scorePanel", ins: oScoerPanel });
    this.append({ name: "scoreHistory", ins: oScoerHistory });
    this.append({ name: "newGameBtn", ins: oNewGame });
    // 生成宫格
    const cellGrid = new CellGrid({
      name: this.options.gridName,
      sence: this,
    });
    // 重开游戏绑定事件
    oNewGame.addEventListener("click", () => {
      // 清空单元格
      cellGrid.clear();
      // 开始游戏
      this.gameStart();
      // 进度保存
      this.save();
    });
    // 挂载宫格
    this.append(cellGrid);
    // 读取游戏进度
    const game = getGame();
    // 游戏开始
    this.gameStart(game);
  }
  // 加分
  addScore(score) {
    this.score += score;
  }
  // 渲染分数
  renderScore() {
    const scorePanel = this.childs.get("scorePanel");
    const scoreHistory = this.childs.get("scoreHistory");
    scorePanel.ins.dataset.level = this.score;
    // 如果超过历史分则渲染历史分并保存
    if (this.score > this.historyScore) {
      this.historyScore = this.score;
      scoreHistory.ins.dataset.level = this.historyScore;
      saveBestScore(this.historyScore);
    }
  }
  // 游戏进度保存
  save() {
    const cells = Array.from(this.grid().cellMap, ([name, cell]) => {
      return {
        name,
        level: cell.level,
      };
    });
    saveGame({
      cells,
      score: this.score,
    });
  }
  // app 子元素追加管理
  append(...childList) {
    childList.forEach((child) => {
      this.childs.set(child.name, child);
      this.senceIns.appendChild(child.ins);
    });
  }
  // 获取子元素宫格
  grid() {
    return this.childs.get(this.options.gridName);
  }
  // 生成随机单元格
  genRandomCell() {
    // 获取宫格
    const grid = this.grid();
    // 获取宫格内剩余单元格空间
    const list = grid.getRemainCellName();
    // 不足则return
    if (!list.length) return;
    // 否则随机取一个
    const name = randomArr(list);
    // 十分之一概率是一级单元格（4）否则零级单元格（2）
    const level = Math.random() < 0.1 ? 1 : 0;
    // 生成单元格
    this.genCell(name, level);
  }
  // 渲染单元格并追加 name是x-y从何可以确定位置
  genCell(name, level) {
    const grid = this.grid();
    const cell = new Cell({
      baseValue: this.options.baseValue,
      className: this.options.cellName,
      sence: this,
      grid,
      name,
      level,
    });
    grid.append(cell);
  }
}

// 宫格
class CellGrid {
  // 宫格名称
  name;
  // 宫格dom
  ins;
  // 主场景
  sence;
  // 单元格管理Map
  cellMap = new Map();
  // 所有单元格空间数组
  allCellName;
  constructor({ name, sence }) {
    this.name = name;
    this.sence = sence;
    // 生成实例
    this.ins = genDom({ className: [name] });
    // 获取所有单元格空间数组
    this.allCellName = this.getAllCellName();
  }
  // 清楚单元格们
  clear() {
    this.cellMap.clear();
    this.ins.innerHTML = "";
  }
  // 追加单元格
  append(child) {
    this.cellMap.set(child.getName(), child);
    this.ins.appendChild(child.ins);
  }
  // 获取所有单元格空间数组 行列 0-3 循环生成x-y字符串数组
  getAllCellName() {
    const names = [];
    for (let y = this.sence.max; y >= this.sence.min; y--) {
      for (let x = this.sence.max; x >= this.sence.min; x--) {
        names.push(this.genName(x, y));
      }
    }
    return names;
  }
  // 获取剩余的单元格空间数组
  getRemainCellName() {
    // 对所有单元格空间数组进行过滤 如果cellMap里已存在就去除
    return this.allCellName.filter((m) => {
      return !this.cellMap.has(m);
    });
  }
  // 生成x-y名称
  genName(x, y) {
    return `${x}-${y}`;
  }
  // 通过xy判断单元格是否存在
  hasCellByXY(x, y) {
    return this.cellMap.has(this.genName(x, y));
  }
  // 通过xy获取单元格
  getCellByXY(x, y) {
    return this.cellMap.get(this.genName(x, y));
  }
  // 修改单元格在cellMap中的名字 并且告知主场景有单元格完成了移动
  changeChild(oldName, newName) {
    this.cellMap.set(newName, this.cellMap.get(oldName));
    this.cellMap.delete(oldName);
    this.sence.hasMove = true;
  }
  // 销毁单元格 用2个同级单元格合并后 100ms动画后销毁移动过去的那个
  destroyCell(name, ins) {
    this.cellMap.delete(name);
    this.sence.hasMove = true;
    setTimeout(() => {
      this.ins.removeChild(ins);
    }, 100);
  }
  // 重置单元格状态 目前只用于重置合并状态，使得下次可以正常合并
  refreshCell() {
    this.cellMap.forEach((m) => {
      m.hasMerge && (m.hasMerge = false);
    });
  }
  // 键盘事件 只注释一个其他同理
  [KEY_MAP.DOWN]() {
    // 计数 用于提前跳出
    let mount = 0;
    // 如向下时 从下数倒数第二排开始依次先执行 左右随意，确保 靠下的单元格 优先合并 靠的上的单元格也可以在下方单元格移动后 正确的多格移动
    for (let y = this.sence.max - 1; y >= this.sence.min; y--) {
      for (let x = this.sence.max; x >= this.sence.min; x--) {
        // 判断当前位置是否存在单元格否则下轮循环
        if (!this.hasCellByXY(x, y)) continue;
        // 存在则获取 执行单元格的移动方法
        const cell = this.getCellByXY(x, y);
        cell.down();
        // 有单元格则计数+1 当然技术和单元格总数相同时跳出 因为后续循环无意义
        if (++mount >= this.cellMap.size) return;
      }
    }
  }
  [KEY_MAP.LEFT]() {
    let mount = 0;
    for (let x = this.sence.min + 1; x <= this.sence.max; x++) {
      for (let y = this.sence.max; y >= this.sence.min; y--) {
        if (!this.hasCellByXY(x, y)) continue;
        const cell = this.getCellByXY(x, y);
        cell.left();
        if (++mount >= this.cellMap.size) return;
      }
    }
  }
  [KEY_MAP.RIGHT]() {
    let mount = 0;
    for (let x = this.sence.max - 1; x >= this.sence.min; x--) {
      for (let y = this.sence.max; y >= this.sence.min; y--) {
        if (!this.hasCellByXY(x, y)) continue;
        const cell = this.getCellByXY(x, y);
        cell.right();
        if (++mount >= this.cellMap.size) return;
      }
    }
  }
  [KEY_MAP.UP]() {
    let mount = 0;
    for (let y = this.sence.min + 1; y <= this.sence.max; y++) {
      for (let x = this.sence.max; x >= this.sence.min; x--) {
        if (!this.hasCellByXY(x, y)) continue;
        const cell = this.getCellByXY(x, y);
        cell.up();
        if (++mount >= this.cellMap.size) return;
      }
    }
  }
}

// 单元格
class Cell {
  // 单元格实例
  ins;
  // 基准分数
  baseValue;
  // 单元格xy位置
  x = 0;
  y = 0;
  // 单元格等级
  level = 0;
  // 单元格类名
  className;
  // 主场景
  sence;
  // 宫格
  grid;
  // 单元名称
  name;
  // 是否合并过
  hasMerge = false;
  constructor({ baseValue, className, sence, grid, name, level = 0 }) {
    // 一些属性赋值
    this.baseValue = baseValue;
    this.className = className;
    this.sence = sence;
    this.grid = grid;
    this.name = name;
    this.level = level;
    // 生成DOM
    this.ins = genDom({
      className: [className],
      dataValue: this.getScore(),
      level,
    });
    // 赋值坐标
    this.genPos(name);
  }
  // 计算分数 基准分数乘2的等级次方
  getScore() {
    return this.baseValue * 2 ** this.level;
  }
  // 从名字解析坐标
  genPos(name) {
    const [x, y] = name.split("-");
    this.y = +y;
    this.x = +x;
    // 单元格诞生
    this.birth();
  }
  // 单元格合并升级
  upLevel() {
    // 升级
    ++this.level;
    // 计算分数
    const score = this.getScore();
    // 修改dataset
    this.ins.dataset.value = score;
    this.ins.dataset.level = this.level;
    // 表示单元格已合并 防止一轮内多次合并
    this.hasMerge = true;
    // 主场景加分
    this.sence.addScore(score);
  }
  // 单元格初始位置和出生动画 没什么好说的
  birth() {
    const { x, y } = this;
    this.ins.style.transform = `translate(${x * this.sence.offset}px,${
      y * this.sence.offset
    }px) scale(0)`;
    // 在下一个绘制周期绘制新的样式从而正确播放过渡动画
    requestAnimationFrame(() => {
      this.ins.style.transform = `translate(${x * this.sence.offset}px,${
        y * this.sence.offset
      }px) scale(1)`;
    });
  }
  // 单元格重绘 参数是否销毁
  reRender(burned = false) {
    this.ins.style.transform = `translate(${this.x * this.sence.offset}px,${
      this.y * this.sence.offset
    }px)`;
    // 如果销毁则执行grid的销毁方法
    if (burned) {
      this.grid.destroyCell(this.name, this.ins);
      return;
    }
    // 否则执行grid的修改单元格名称方法 从而正确的获取新的空间和其他单元格判断
    const newName = this.getName();
    this.grid.changeChild(this.name, newName);
    this.name = newName;
  }
  // 通过xy获取单元格名称
  getName() {
    return `${this.x}-${this.y}`;
  }
  // 单元格移动方法 只注释一个其他同理 参数 是否首次执行
  down(isFist = true) {
    // 如 向下 则临时Y 为基础Y+1
    const newY = this.y + 1;
    // 边界判断
    if (newY > this.sence.max) return;
    // 不是边界则判断下方是否有元素
    if (this.grid.hasCellByXY(this.x, newY)) {
      // 如果有则获取
      const cell = this.grid.getCellByXY(this.x, newY);
      // 判断是否同级
      if (cell.level === this.level) {
        // 如果同级则判断目标元素是否已合并
        if (cell.hasMerge) {
          // 如果已合并 则判断是否首次执行 是则跳出 否则就目前进度渲染
          if (isFist) return;
          return this.reRender();
        }
        // 如果目标元素没合并过 则升级
        cell.upLevel();
        // 将临时坐标赋值给实例坐标
        this.y = newY;
        // 并进行销毁渲染
        this.reRender(true);
        return;
      }
      // 如果不是同级并且是首次则跳出
      if (isFist) return;
    } else {
      // 如果下方没元素则先预移动 单不渲染
      this.y = newY;
      // 判断如果还没到边界就继续移动
      if (this.y < this.sence.max) return this.down(false);
    }
    // 其他情况渲染
    this.reRender();
  }
  up(isFist = true) {
    const newY = this.y - 1;
    if (newY < this.sence.min) return;
    if (this.grid.hasCellByXY(this.x, newY)) {
      const cell = this.grid.getCellByXY(this.x, newY);
      if (cell.level === this.level) {
        if (cell.hasMerge) return this.reRender();
        cell.upLevel();
        this.y = newY;
        this.reRender(true);
        return;
      }
      if (isFist) return;
    } else {
      this.y = newY;
      if (this.y > this.sence.min) return this.up(false);
    }
    this.reRender();
  }
  right(isFist = true) {
    const newX = this.x + 1;
    if (newX > this.sence.max) return;
    if (this.grid.hasCellByXY(newX, this.y)) {
      const cell = this.grid.getCellByXY(newX, this.y);
      if (cell.level === this.level) {
        if (cell.hasMerge) return this.reRender();
        cell.upLevel();
        this.x = newX;
        this.reRender(true);
        return;
      }
      if (isFist) return;
    } else {
      this.x = newX;
      if (this.x < this.sence.max) return this.right(false);
    }
    this.reRender();
  }
  left(isFist = true) {
    const newX = this.x - 1;
    if (newX < this.sence.min) return;
    if (this.grid.hasCellByXY(newX, this.y)) {
      const cell = this.grid.getCellByXY(newX, this.y);
      if (cell.level === this.level) {
        if (cell.hasMerge) return this.reRender();
        cell.upLevel();
        this.x = newX;
        this.reRender(true);
        return;
      }
      if (isFist) return;
    } else {
      this.x = newX;
      if (this.x > this.sence.min) return this.left(false);
    }
    this.reRender();
  }
}

const mainSence = new MainSence(defaultOptions);
mainSence.mount("#app");
