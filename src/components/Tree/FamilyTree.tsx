import { useEffect, useMemo, useRef, useState } from "react";
import { select } from "d3-selection";
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from "d3-zoom";
import "d3-transition";
import { useFamilyTree } from "../../context/useFamilyTree";
import { computeLayout } from "../../utils/layout";
import { PersonCard } from "../PersonCard/PersonCard";
import { Connectors } from "./Connectors";
import "./FamilyTree.css";

export function FamilyTree() {
  const { graph, collapsedIds, selectedId, focusToken } = useFamilyTree();
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const zoomBehaviorRef = useRef<ZoomBehavior<HTMLDivElement, unknown> | null>(null);
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);

  const layout = useMemo(() => computeLayout(graph, collapsedIds), [graph, collapsedIds]);

  const getFitScale = () => {
    const viewport = viewportRef.current;
    if (!viewport || layout.width === 0) return 1;
    const { width, height } = viewport.getBoundingClientRect();
    return Math.min(1, width / layout.width, height / layout.height) || 1;
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const behavior = zoom<HTMLDivElement, unknown>()
      .scaleExtent([0.05, 2])
      .on("zoom", (event) => setTransform(event.transform));

    zoomBehaviorRef.current = behavior;
    select(viewport).call(behavior);

    return () => {
      select(viewport).on(".zoom", null);
    };
  }, []);

  // لا تسمح بتصغير الشجرة إلى ما هو أصغر من حجمها الكامل داخل الشاشة (وإلا تصبح غير مرئية عمليًا).
  useEffect(() => {
    zoomBehaviorRef.current?.scaleExtent([Math.min(getFitScale(), 1), 2]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout.width, layout.height]);

  const centerView = (animate: boolean) => {
    const viewport = viewportRef.current;
    const behavior = zoomBehaviorRef.current;
    if (!viewport || !behavior || layout.width === 0) return;
    const { width, height } = viewport.getBoundingClientRect();
    const scale = getFitScale();
    const next = zoomIdentity
      .translate(width / 2 - (layout.width / 2) * scale, Math.min(60, height / 4))
      .scale(scale);
    const target = animate ? select(viewport).transition().duration(400) : select(viewport);
    target.call(behavior.transform, next);
  };

  const zoomBy = (factor: number) => {
    const viewport = viewportRef.current;
    const behavior = zoomBehaviorRef.current;
    if (!viewport || !behavior) return;
    select(viewport).transition().duration(200).call(behavior.scaleBy, factor);
  };

  // مركز الشجرة أول ظهور لها.
  useEffect(() => {
    centerView(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const behavior = zoomBehaviorRef.current;
    if (!viewport || !behavior || !selectedId) return;
    const node = layout.nodes.find((n) => n.id === selectedId);
    if (!node) return;
    const { width, height } = viewport.getBoundingClientRect();
    const targetK = Math.max(transform.k, 0.8);
    // في وضع الجوال تحتل لوحة التفاصيل أسفل الشاشة، فنُبقي البطاقة قرب الأعلى
    // ليظل كلاهما ظاهرًا في آن واحد بدل تمركزها خلف اللوحة.
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const verticalAnchor = isMobile ? height * 0.22 : height / 2;
    const next = zoomIdentity
      .translate(width / 2 - node.x * targetK, verticalAnchor - node.y * targetK)
      .scale(targetK);
    select(viewport).transition().duration(500).call(behavior.transform, next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusToken]);

  return (
    <div className="tree-viewport" ref={viewportRef}>
      <div
        className="tree-content"
        ref={contentRef}
        style={{
          width: layout.width,
          height: layout.height,
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
        }}
      >
        <Connectors nodes={layout.nodes} links={layout.links} />
        {layout.nodes.map((node) => {
          const person = graph.people.get(node.id);
          if (!person) return null;
          return (
            <PersonCard
              key={node.id}
              person={person}
              x={node.x}
              y={node.y}
              hasChildren={node.hasChildren}
              collapsed={node.collapsed}
              chipSpouseIds={node.chipSpouseIds}
            />
          );
        })}
      </div>
      <div className="tree-controls">
        <button type="button" onClick={() => zoomBy(1.3)} aria-label="تكبير" title="تكبير">
          +
        </button>
        <button type="button" onClick={() => zoomBy(1 / 1.3)} aria-label="تصغير" title="تصغير">
          −
        </button>
        <button type="button" onClick={() => centerView(true)} aria-label="إعادة توسيط" title="إعادة توسيط">
          ⌖
        </button>
      </div>
    </div>
  );
}
