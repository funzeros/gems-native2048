import { genDom, getDom, random } from "./utils/utils.js";

// 基本配置
const defaultOptions = {
  baseValue: 2,
  gridName: "cell-grid",
  cellName: "cell-item",
  gridWidth: 700,
  gap: 20,
};
//   主场景
class MainSence {
  senceIns;
  //   子元素Map
  childs = new Map();
  options;
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
    document.documentElement.style.setProperty(
      "--cell-width",
      `${(this.options.gridWidth - 5 * this.options.gap) / 4}px`
    );
  }
  mount(selector) {
    this.senceIns = getDom(selector);
    const cellGrid = new CellGrid({
      name: this.options.gridName,
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
    const cell = new Cell({
      value: this.options.baseValue,
      className: this.options.cellName,
    });
    this.grid().append(cell);
  }
}

// 宫格
class CellGrid {
  name;
  ins;
  cellMap = new Map();
  constructor({ name }) {
    this.name = name;
    this.ins = genDom({ className: [name] });
  }
  append(child) {
    // this.cellMap.set()
    this.ins.appendChild(child.ins);
  }
}

// 单元格
class Cell {
  static min = 0;
  static max = 3;
  ins;
  value;
  x = 0;
  y = 0;
  level = 1;
  className;
  constructor({ value, className }) {
    this.value = value;
    this.className = className;
    this.ins = genDom({ className: [className, `${className}-${this.level}`] });
    this.randomPos();
  }
  randomPos() {
    const { min, max } = Cell;
    this.y = random(min, max);
    this.x = random(min, max);
    this.changePos(this.x, this.y);
  }
  changePos(x, y) {
    // this.ins.style.transform=`translate(${x*}px,${y}px)`
  }
}

const mainSence = new MainSence(defaultOptions);
mainSence.mount("#app");
