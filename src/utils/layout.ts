import { hierarchy, tree, type HierarchyPointNode } from "d3-hierarchy";
import type { FamilyGraph, Person } from "../types";
import { hasFamilyCard, isBloodDescendant } from "./buildGraph";

export const CARD_WIDTH = 176;
export const CARD_HEIGHT = 88;
const H_GAP = 40;
const V_GAP = 120;
const NODE_DX = CARD_WIDTH + H_GAP;
const NODE_DY = CARD_HEIGHT + V_GAP;

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  hasChildren: boolean;
  collapsed: boolean;
  /** أزواج من نسل العائلة (زواج أقارب): تُرسم شارة رابطة تنقل لمكانهم الأصلي. */
  chipSpouseIds: string[];
}

export interface LayoutLink {
  parentId: string;
  childId: string;
}

export interface TreeLayout {
  nodes: LayoutNode[];
  links: LayoutLink[];
  width: number;
  height: number;
}

function chipSpouses(graph: FamilyGraph, person: Person): string[] {
  return person.spouses.filter((id) => isBloodDescendant(graph, id));
}

/** الأبناء الذين تُعرض لهم بطاقات فعليًا في الشجرة (ينتهي اسمهم باسم عائلة الجذر). */
export function treeChildren(graph: FamilyGraph, person: Person): Person[] {
  return person.children
    .map((id) => graph.people.get(id))
    .filter((p): p is Person => !!p && hasFamilyCard(graph, p.id));
}

/**
 * الحالة الافتراضية عند أول تحميل: تظل أول `visibleLevels` مستويات ظاهرة
 * (الجذر = المستوى الأول)، وتُطوى العقد عند آخر مستوى ظاهر لإخفاء ما بعدها.
 */
export function computeDefaultCollapsedIds(graph: FamilyGraph, visibleLevels: number): Set<string> {
  const collapsed = new Set<string>();
  const root = graph.people.get(graph.meta.rootId);
  if (!root) return collapsed;

  const walk = (person: Person, depth: number) => {
    const kids = treeChildren(graph, person);
    if (depth === visibleLevels - 1) {
      if (kids.length > 0) collapsed.add(person.id);
      return;
    }
    kids.forEach((kid) => walk(kid, depth + 1));
  };

  walk(root, 0);
  return collapsed;
}

export function computeLayout(graph: FamilyGraph, collapsedIds: Set<string>): TreeLayout {
  const root = graph.people.get(graph.meta.rootId);
  if (!root) return { nodes: [], links: [], width: 0, height: 0 };

  const hierarchyRoot = hierarchy<Person>(root, (person) => {
    if (collapsedIds.has(person.id)) return undefined;
    return treeChildren(graph, person);
  });

  const layoutTree = tree<Person>()
    .nodeSize([NODE_DX, NODE_DY])
    .separation((a, b) => (a.parent === b.parent ? 1 : 1.4));

  const positioned = layoutTree(hierarchyRoot);
  const points = positioned.descendants() as HierarchyPointNode<Person>[];

  const nodes: LayoutNode[] = points.map((point) => ({
    id: point.data.id,
    x: point.x,
    y: point.y,
    hasChildren: treeChildren(graph, point.data).length > 0,
    collapsed: collapsedIds.has(point.data.id),
    chipSpouseIds: chipSpouses(graph, point.data),
  }));

  const links: LayoutLink[] = points
    .filter((point) => point.parent)
    .map((point) => ({ parentId: point.parent!.data.id, childId: point.data.id }));

  const PADDING = H_GAP;
  const minX = Math.min(...nodes.map((n) => n.x - CARD_WIDTH / 2));
  const maxX = Math.max(...nodes.map((n) => n.x + CARD_WIDTH / 2));
  const maxY = Math.max(...nodes.map((n) => n.y), 0);

  const offsetX = PADDING - minX;
  for (const node of nodes) {
    node.x += offsetX;
    node.y += PADDING;
  }

  return {
    nodes,
    links,
    width: maxX - minX + PADDING * 2,
    height: maxY + CARD_HEIGHT + PADDING * 2,
  };
}
