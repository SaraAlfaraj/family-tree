import { linkVertical } from "d3-shape";
import { CARD_HEIGHT, type LayoutLink, type LayoutNode } from "../../utils/layout";

interface ConnectorsProps {
  nodes: LayoutNode[];
  links: LayoutLink[];
}

interface Point {
  x: number;
  y: number;
}

const parentChildLink = linkVertical<{ source: Point; target: Point }, Point>()
  .x((d) => d.x)
  .y((d) => d.y);

export function Connectors({ nodes, links }: ConnectorsProps) {
  const byId = new Map(nodes.map((n) => [n.id, n]));

  return (
    <svg className="connectors-layer">
      <g>
        {links.map((link) => {
          const parent = byId.get(link.parentId);
          const child = byId.get(link.childId);
          if (!parent || !child) return null;
          const path = parentChildLink({
            source: { x: parent.x, y: parent.y + CARD_HEIGHT },
            target: { x: child.x, y: child.y },
          });
          return <path key={`${link.parentId}-${link.childId}`} d={path ?? undefined} className="tree-link" />;
        })}
      </g>
    </svg>
  );
}
