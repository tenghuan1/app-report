// BEM CSS 类名生成工具
// 命名空间: pharmacy
// b: block, 格式: pharmacy-block
// e: element, 格式: pharmacy-block_element
// m: modifier, 格式: pharmacy-block--modifier 或 pharmacy-block_element--modifier

const NAMESPACE = 'pharmacy'

/**
 * 生成 Block 类名
 * @param {string} block - 块名
 * @returns {string} - 完整类名
 */
export const b = (block) => {
  return `${NAMESPACE}-${block}`
}

/**
 * 生成 Element 类名
 * @param {string} block - 块名
 * @param {string} element - 元素名
 * @returns {string} - 完整类名
 */
export const e = (block, element) => {
  return `${NAMESPACE}-${block}_${element}`
}

/**
 * 生成 Modifier 类名
 * @param {string} block - 块名
 * @param {string} modifier - 修饰符名
 * @returns {string} - 完整类名
 */
export const m = (block, modifier) => {
  return `${NAMESPACE}-${block}--${modifier}`
}

/**
 * 生成 Element + Modifier 类名
 * @param {string} block - 块名
 * @param {string} element - 元素名
 * @param {string} modifier - 修饰符名
 * @returns {string} - 完整类名
 */
export const em = (block, element, modifier) => {
  return `${NAMESPACE}-${block}_${element}--${modifier}`
}

/**
 * 组合多个类名
 * @param {...string} classes - 类名数组
 * @returns {string} - 组合后的类名字符串
 */
export const cls = (...classes) => {
  return classes.filter(Boolean).join(' ')
}

// 默认导出
export default {
  b,
  e,
  m,
  em,
  cls
}