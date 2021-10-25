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
  const { tag, className } = finOptions;
  const oDom = document.createElement(tag);
  className.length && oDom.classList.add(...className);
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
