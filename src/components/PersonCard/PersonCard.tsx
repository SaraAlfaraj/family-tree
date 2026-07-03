import { useFamilyTree } from "../../context/useFamilyTree";
import { deceasedWord, fullName } from "../../utils/buildGraph";
import type { Person } from "../../types";
import { ChevronLeftIcon, ExpandMoreIcon } from "../icons";
import styles from "./PersonCard.module.css";

interface PersonCardProps {
  person: Person;
  x: number;
  y: number;
  hasChildren: boolean;
  collapsed: boolean;
  chipSpouseIds: string[];
}

export function PersonCard({ person, x, y, hasChildren, collapsed, chipSpouseIds }: PersonCardProps) {
  const { graph, selectedId, focusOn, toggleCollapse } = useFamilyTree();

  const restOfName = [person.fatherName, person.grandfatherName, person.familyName]
    .filter(Boolean)
    .join(" ");

  const bg = person.gender === "male" ? "var(--color-male-bg)" : "var(--color-female-bg)";

  return (
    <div
      className={`${styles.card} ${selectedId === person.id ? styles.selected : ""}`}
      style={{ left: x, top: y, ["--bg" as string]: bg }}
      onClick={() => focusOn(person.id)}
      role="button"
      tabIndex={0}
      aria-label={fullName(person)}
    >
      {hasChildren && (
        <span
          className={styles.toggleIcon}
          onClick={(e) => {
            e.stopPropagation();
            toggleCollapse(person.id);
          }}
          title={collapsed ? "توسيع الأبناء" : "طي الأبناء"}
        >
          {collapsed ? <ChevronLeftIcon /> : <ExpandMoreIcon />}
        </span>
      )}
      <div className={styles.firstName}>{person.firstName}</div>
      {restOfName && <div className={styles.restOfName}>{restOfName}</div>}
      {(!person.alive || chipSpouseIds.length > 0) && (
        <div className={styles.tagsRow}>
          {!person.alive && (
            <span className={styles.deceasedTag}>
              {deceasedWord(person)}{person.deathYear ? ` ${person.deathYear}` : ""}
            </span>
          )}
          {chipSpouseIds.map((spouseId) => {
            const spouse = graph.people.get(spouseId);
            if (!spouse) return null;
            const relationWord = person.gender === "female" ? "زوجها" : "زوجته";
            return (
              <span
                key={spouseId}
                className={styles.chip}
                onClick={(e) => {
                  e.stopPropagation();
                  focusOn(spouseId);
                }}
              >
                {relationWord}: {spouse.firstName} ↗
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
