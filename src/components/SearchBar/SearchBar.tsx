import { useMemo, useState } from "react";
import { useFamilyTree } from "../../context/useFamilyTree";
import { fullName } from "../../utils/buildGraph";
import { matchesQuery } from "../../utils/arabicSearch";
import styles from "./SearchBar.module.css";

export function SearchBar() {
  const { graph, focusOn } = useFamilyTree();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return [...graph.people.values()]
      .filter((person) => matchesQuery(fullName(person), query))
      .slice(0, 8);
  }, [graph, query]);

  return (
    <div className={styles.wrapper}>
      <input
        className={styles.input}
        type="search"
        placeholder="ابحث عن اسم..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 150)}
      />
      {isFocused && query.trim() && (
        <div className={styles.results}>
          {results.length === 0 ? (
            <div className={styles.noResults}>لا توجد نتائج</div>
          ) : (
            results.map((person) => (
              <button
                key={person.id}
                className={styles.resultItem}
                onClick={() => {
                  focusOn(person.id);
                  setQuery("");
                }}
              >
                {fullName(person)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
