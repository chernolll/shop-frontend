/**
 * 树形结构通用工具函数（从 @vben-core/shared/utils 精简移植）
 */

/** 递归映射树节点 */
function mapTree<T extends { children?: T[] }, R extends { children?: R[] }>(
  tree: T[],
  callback: (node: T) => R,
): R[] {
  return tree.map((node) => {
    const mapped = callback(node);
    if (node.children && node.children.length > 0) {
      mapped.children = mapTree(node.children, callback);
    }
    return mapped;
  });
}

/** 递归过滤树节点（保留该分支上所有满足条件的节点） */
function filterTree<T extends { children?: T[] }>(
  tree: T[],
  predicate: (node: T) => boolean,
): T[] {
  return tree
    .filter((element) => predicate(element))
    .map((node) => {
      const filteredNode = { ...node };
      if (node.children && node.children.length > 0) {
        filteredNode.children = filterTree(node.children, predicate);
      }
      return filteredNode;
    });
}

/** 递归排序树节点 */
function sortTree<T extends { children?: T[] }>(
  tree: T[],
  compareFn: (a: T, b: T) => number,
): T[] {
  const sorted = [...tree].toSorted(compareFn);
  return sorted.map((node) => {
    if (node.children && node.children.length > 0) {
      return { ...node, children: sortTree(node.children, compareFn) };
    }
    return node;
  });
}

/** 深度遍历收集所有节点的某个字段值 */
function traverseTreeValues<T, V>(
  tree: T[] | undefined,
  getValue: (node: T) => V,
): V[] {
  const result: V[] = [];
  if (!tree) return result;

  for (const node of tree) {
    result.push(getValue(node));
    const children = (node as Record<string, unknown>).children as
      | T[]
      | undefined;
    if (children) {
      result.push(...traverseTreeValues(children, getValue));
    }
  }
  return result;
}

export { filterTree, mapTree, sortTree, traverseTreeValues };
