import { useEffect, useMemo, useState, type ReactNode } from "react";
import familyData from "../../data/people.json";
import { buildFamilyGraph } from "../utils/buildGraph";
import { computeDefaultCollapsedIds, treeChildren } from "../utils/layout";
import type { FamilyData, FamilyGraph } from "../types";
import { FamilyTreeContext, type FamilyTreeContextValue } from "./useFamilyTree";

/** عدد المستويات الظاهرة افتراضيًا عند أول تحميل (الجذر يُحتسب مستوى أول). */
const DEFAULT_VISIBLE_LEVELS = 3;

/** يوسّع سلسلة أسلاف الشخص المحدَّد عبر الرابط حتى تبقى بطاقته ظاهرة رغم الطي الافتراضي. */
function expandAncestorsOf(graph: FamilyGraph, collapsed: Set<string>, id: string | null): Set<string> {
  if (!id) return collapsed;
  const next = new Set(collapsed);
  let current = graph.people.get(id);
  while (current) {
    const parentId: string | undefined = current.parents[0];
    if (!parentId) break;
    next.delete(parentId);
    current = graph.people.get(parentId);
  }
  return next;
}

function idFromHash(): string | null {
  const match = window.location.hash.match(/^#\/id\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function FamilyTreeProvider({ children }: { children: ReactNode }) {
  const graph = useMemo(() => buildFamilyGraph(familyData as FamilyData), []);
  const [selectedId, setSelectedIdState] = useState<string | null>(() => idFromHash());
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() =>
    expandAncestorsOf(graph, computeDefaultCollapsedIds(graph, DEFAULT_VISIBLE_LEVELS), idFromHash()),
  );
  const [focusToken, setFocusToken] = useState(() => (idFromHash() ? 1 : 0));
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const onHashChange = () => {
      const id = idFromHash();
      if (id && graph.people.has(id)) {
        setSelectedIdState(id);
        setFocusToken((n) => n + 1);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [graph]);

  const setSelectedId = (id: string | null) => {
    setSelectedIdState(id);
    window.location.hash = id ? `#/id/${encodeURIComponent(id)}` : "";
  };

  const focusOn = (id: string) => {
    setHistory((prev) => (selectedId && selectedId !== id ? [...prev, selectedId] : prev));
    setSelectedId(id);
    setFocusToken((n) => n + 1);
  };

  const goBack = () => {
    if (history.length === 0) return;
    const previousId = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setSelectedId(previousId);
    setFocusToken((n) => n + 1);
  };

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        // عند التوسيع: أضف أبناء هذه البطاقة (إن كان لهم أبناء) مطويّين افتراضيًا،
        // بحيث يظهر مستوى واحد فقط في كل مرة بدل كشف الفروع كلها دفعة واحدة.
        const person = graph.people.get(id);
        if (person) {
          for (const child of treeChildren(graph, person)) {
            if (treeChildren(graph, child).length > 0) next.add(child.id);
          }
        }
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const value: FamilyTreeContextValue = {
    graph,
    selectedId,
    setSelectedId,
    collapsedIds,
    toggleCollapse,
    focusToken,
    focusOn,
    canGoBack: history.length > 0,
    goBack,
  };

  return <FamilyTreeContext.Provider value={value}>{children}</FamilyTreeContext.Provider>;
}
