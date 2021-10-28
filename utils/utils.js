const defaultOptions = {
  tag: "div",
  className: [],
};
/**
 * 构造DOM
 * @param {*} options
 * @returns dom
 */
export const genDom = (options) => {
  const finOptions = { ...defaultOptions, ...options };
  const { tag, className, dataValue, level } = finOptions;
  const oDom = document.createElement(tag);
  className.length && oDom.classList.add(...className);
  dataValue && (oDom.dataset.value = dataValue);
  String(level) && (oDom.dataset.level = level);
  return oDom;
};

/**
 * 获取DOM
 * @param {string} selector
 */
export const getDom = (selector) => {
  const oDom = document.querySelector(selector);
  return oDom;
};

/**
 * random整数
 */
export const random = (min, max) => {
  return Math.round(Math.random() * max + min);
};

/**
 * 数组随机
 */
export const randomArr = (arr) => {
  return arr[Math.floor(Math.random() * arr.length)];
};

/**
 * 本地存储
 */
export const useStorage = (name, defaultValue) => {
  return {
    save(data) {
      localStorage.setItem(name, JSON.stringify(data));
    },
    read() {
      const item = localStorage.getItem(name);
      return item ? JSON.parse(item) : defaultValue;
    },
  };
};
