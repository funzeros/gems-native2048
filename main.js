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
  constructor(options) {
    this.options = options;
    this.init();
  }
  init() {
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
  }
  _handleKeydown({ code }) {
    const UpperCode = code.toLocaleUpperCase();
    if (!Object.values(KEY_MAP).includes(UpperCode)) return;
    if (this.flag) return;
    this.flag = true;
    this.timer = setTimeout(() => {
      this.flag = false;
    }, 100);
    this.grid()[UpperCode]();
    if (!this.hasMove) return;
    console.log(2);
    this.hasMove = false;
  }

  mount(selector) {
    this.senceIns = getDom(selector);
    const cellGrid = new CellGrid({
      name: this.options.gridName,
      sence: this,
    });
    this.append(cellGrid);
    this.genCell();
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
    const cell = new Cell({
      baseValue: this.options.baseValue,
      className: this.options.cellName,
      sence: this,
      grid,
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
  constructor({ baseValue, className, sence, grid }) {
    this.baseValue = baseValue;
    this.className = className;
    this.sence = sence;
    this.grid = grid;
    this.ins = genDom({
      className: [className, `${className}-${this.level}`],
      dataValue: this.getScore(),
    });
    this.randomPos();
  }
  getScore() {
    return this.baseValue * 2 ** this.level;
  }
  randomPos() {
    this.name = randomArr(this.grid.getRemainCellName());
    const [x, y] = this.name.split("-");
    this.y = +y;
    this.x = +x;
    this.birth();
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
  reRender() {
    this.ins.style.transform = `translate(${this.x * this.sence.offset}px,${
      this.y * this.sence.offset
    }px)`;
    const newName = this.getName();
    this.grid.changeChild(this.name, newName);
    this.name = newName;
  }
  getName() {
    return `${this.x}-${this.y}`;
  }
  down() {
    const newY = this.y + 1;
    if (newY > this.sence.max) return;
    if (this.grid.hasCellByXY(this.x, newY)) {
      // 存在
    } else {
      // 不存在
      this.y = newY;
      if (this.y < this.sence.max) return this.down();
    }
    this.reRender();
  }
  up() {
    const newY = this.y - 1;
    if (newY < this.sence.min) return;
    if (this.grid.hasCellByXY(this.x, newY)) {
      // 存在
    } else {
      // 不存在
      this.y = newY;
      if (this.y > this.sence.min) return this.up();
    }
    this.reRender();
  }
  right() {
    const newX = this.x + 1;
    if (newX > this.sence.max) return;
    if (this.grid.hasCellByXY(newX, this.y)) {
      // 存在
    } else {
      // 不存在
      this.x = newX;
      if (this.x < this.sence.max) return this.right();
    }
    this.reRender();
  }
  left() {
    const newX = this.x - 1;
    if (newX < this.sence.min) return;
    if (this.grid.hasCellByXY(newX, this.y)) {
      // 存在
    } else {
      // 不存在
      this.x = newX;
      if (this.x > this.sence.min) return this.left();
    }
    this.reRender();
  }
}

const mainSence = new MainSence(defaultOptions);
mainSence.mount("#app");
