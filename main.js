import { genDom, getDom, random, randomArr } from "./utils/utils.js";

// 基本配置
const defaultOptions = {
  baseValue: 2,
  gridName: "cell-grid",
  cellName: "cell-item",
  gridWidth: 700,
  gap: 20,
};
const KEY_MAP = {
  UP: "ARROWUP",
  LEFT: "ARROWLEFT",
  RIGHT: "ARROWRIGHT",
  DOWN: "ARROWDOWN",
};
//   主场景
class MainSence {
  senceIns;
  childs = new Map();
  options;
  offset;
  min = 0;
  max = 3;
  timer;
  flag = false;
  hasMove = false;
  score = 0;
  hasTouch = false;
  touchX = 0;
  touchY = 0;
  hasTouchMove = false;
  constructor(options) {
    this.options = options;
    this.init();
  }
  init() {
    if (document.body.clientWidth < 800) {
      this.options.gridWidth = 350;
      this.options.gap = 10;
    }
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
    document.addEventListener("keydown", (e) => {
      this._handleKeydown(e);
    });
    document.addEventListener("touchstart", (e) => {
      const { pageX, pageY } = e.touches[0];
      this.touchX = pageX;
      this.touchY = pageY;
      this.hasTouch = true;
    });
    document.addEventListener("touchmove", (e) => {
      if (this.hasTouchMove) return;
      const { pageX, pageY } = e.touches[0];
      if (pageX - this.touchX > 50)
        this._handleKeydown({ code: KEY_MAP.RIGHT });
      if (pageY - this.touchY > 50) this._handleKeydown({ code: KEY_MAP.DOWN });
      if (pageX - this.touchX < -50)
        this._handleKeydown({ code: KEY_MAP.LEFT });
      if (pageY - this.touchY < -50) this._handleKeydown({ code: KEY_MAP.UP });
    });
    document.addEventListener("touchend", () => {
      this.touchX = 0;
      this.touchY = 0;
      this.hasTouch = false;
      this.hasTouchMove = false;
    });
  }
  _handleKeydown({ code }) {
    this.hasTouchMove = true;
    const UpperCode = code.toLocaleUpperCase();
    if (!Object.values(KEY_MAP).includes(UpperCode)) return;
    if (this.flag) return;
    this.flag = true;
    this.timer = setTimeout(() => {
      this.flag = false;
    }, 100);
    const grid = this.grid();
    grid[UpperCode]();
    if (!this.hasMove) {
      if (!grid.getRemainCellName().length) {
        alert("game over");
        grid.clear();
        this.gameStart();
      }
      return;
    }
    this.genCell();
    this.hasMove = false;
    grid.refreshCell();
    this.renderScore();
  }
  gameStart() {
    this.score = 0;
    this.renderScore();
    new Array(3).fill(0).forEach(() => {
      this.genCell();
    });
  }
  mount(selector) {
    this.senceIns = getDom(selector);
    const oNewGame = genDom({
      className: ["new-game-btn"],
      dataValue: "新游戏",
    });
    const oScoerPanel = genDom({
      className: ["score-panel"],
      dataValue: "分数",
      level: 0,
    });
    this.append({ name: "scorePanel", ins: oScoerPanel });
    this.append({ name: "newGameBtn", ins: oNewGame });
    //
    const cellGrid = new CellGrid({
      name: this.options.gridName,
      sence: this,
    });
    oNewGame.addEventListener("click", () => {
      cellGrid.clear();
      this.gameStart();
    });
    this.append(cellGrid);
    this.gameStart();
  }
  addScore(score) {
    this.score += score;
  }
  renderScore() {
    const scorePanel = this.childs.get("scorePanel");
    scorePanel.ins.dataset.level = this.score;
  }
  append(...childList) {
    childList.forEach((child) => {
      this.childs.set(child.name, child);
      this.senceIns.appendChild(child.ins);
    });
  }
  grid() {
    return this.childs.get(this.options.gridName);
  }
  genCell() {
    const grid = this.grid();
    const list = grid.getRemainCellName();
    if (!list.length) return;
    const name = randomArr(list);
    const level = Math.random() < 0.1 ? 1 : 0;
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
  name;
  ins;
  sence;
  cellMap = new Map();
  allCellName;
  constructor({ name, sence }) {
    this.name = name;
    this.sence = sence;
    this.ins = genDom({ className: [name] });
    this.allCellName = this.getAllCellName();
  }
  clear() {
    this.cellMap.clear();
    this.ins.innerHTML = "";
  }
  append(child) {
    this.cellMap.set(child.getName(), child);
    this.ins.appendChild(child.ins);
  }
  getAllCellName() {
    const names = [];
    for (let y = this.sence.max; y >= this.sence.min; y--) {
      for (let x = this.sence.max; x >= this.sence.min; x--) {
        names.push(this.genName(x, y));
      }
    }
    return names;
  }
  getRemainCellName() {
    return this.allCellName.filter((m) => {
      return !this.cellMap.has(m);
    });
  }
  genName(x, y) {
    return `${x}-${y}`;
  }
  hasCellByXY(x, y) {
    return this.cellMap.has(this.genName(x, y));
  }
  getCellByXY(x, y) {
    return this.cellMap.get(this.genName(x, y));
  }
  changeChild(oldName, newName) {
    this.cellMap.set(newName, this.cellMap.get(oldName));
    this.cellMap.delete(oldName);
    this.sence.hasMove = true;
  }
  destroyCell(name, ins) {
    this.cellMap.delete(name);
    this.sence.hasMove = true;
    setTimeout(() => {
      this.ins.removeChild(ins);
    }, 100);
  }
  refreshCell() {
    this.cellMap.forEach((m) => {
      m.hasMerge && (m.hasMerge = false);
    });
  }
  [KEY_MAP.DOWN]() {
    let mount = 0;
    for (let y = this.sence.max - 1; y >= this.sence.min; y--) {
      for (let x = this.sence.max; x >= this.sence.min; x--) {
        if (!this.hasCellByXY(x, y)) continue;
        const cell = this.getCellByXY(x, y);
        cell.down();
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
  ins;
  baseValue;
  x = 0;
  y = 0;
  level = 0;
  className;
  sence;
  grid;
  name;
  hasMerge = false;
  constructor({ baseValue, className, sence, grid, name, level = 0 }) {
    this.baseValue = baseValue;
    this.className = className;
    this.sence = sence;
    this.grid = grid;
    this.name = name;
    this.level = level;
    this.ins = genDom({
      className: [className],
      dataValue: this.getScore(),
      level,
    });
    this.genPos(name);
  }
  getScore() {
    return this.baseValue * 2 ** this.level;
  }
  genPos(name) {
    const [x, y] = name.split("-");
    this.y = +y;
    this.x = +x;
    this.birth();
  }
  upLevel() {
    ++this.level;
    const score = this.getScore();
    this.ins.dataset.value = score;
    this.ins.dataset.level = this.level;
    this.hasMerge = true;
    this.sence.addScore(score);
  }
  birth() {
    const { x, y } = this;
    this.ins.style.transform = `translate(${x * this.sence.offset}px,${
      y * this.sence.offset
    }px) scale(0)`;
    requestAnimationFrame(() => {
      this.ins.style.transform = `translate(${x * this.sence.offset}px,${
        y * this.sence.offset
      }px) scale(1)`;
    });
  }
  reRender(burned = false) {
    this.ins.style.transform = `translate(${this.x * this.sence.offset}px,${
      this.y * this.sence.offset
    }px)`;
    if (burned) {
      this.grid.destroyCell(this.name, this.ins);
      return;
    }
    const newName = this.getName();
    this.grid.changeChild(this.name, newName);
    this.name = newName;
  }
  getName() {
    return `${this.x}-${this.y}`;
  }
  down(isFist = true) {
    const newY = this.y + 1;
    if (newY > this.sence.max) return;
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
      if (this.y < this.sence.max) return this.down(false);
    }
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
