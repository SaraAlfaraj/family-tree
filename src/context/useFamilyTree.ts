import { createContext, useContext } from "react";
import type { FamilyGraph } from "../types";

export interface FamilyTreeContextValue {
  graph: FamilyGraph;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  collapsedIds: Set<string>;
  toggleCollapse: (id: string) => void;
  /** رقم يتغيّر في كل مرة يجب فيها على الشجرة الانتقال/التكبير نحو selectedId. */
  focusToken: number;
  focusOn: (id: string) => void;
  canGoBack: boolean;
  goBack: () => void;
}

export const FamilyTreeContext = createContext<FamilyTreeContextValue | null>(null);

export function useFamilyTree(): FamilyTreeContextValue {
  const ctx = useContext(FamilyTreeContext);
  if (!ctx) throw new Error("useFamilyTree يجب أن يُستخدم داخل FamilyTreeProvider");
  return ctx;
}
