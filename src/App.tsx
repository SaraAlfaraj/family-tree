import { FamilyTreeProvider } from "./context/FamilyTreeContext";
import { useFamilyTree } from "./context/useFamilyTree";
import { FamilyTree } from "./components/Tree/FamilyTree";
import { DetailsPanel } from "./components/DetailsPanel/DetailsPanel";
import { SearchBar } from "./components/SearchBar/SearchBar";
import { formatArabicDate } from "./utils/date";

function AppShell() {
  const { graph } = useFamilyTree();
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-title">
          <h1>{graph.meta.title}</h1>
          {graph.meta.subtitle && <p className="subtitle">{graph.meta.subtitle}</p>}
        </div>
        <SearchBar />
        {graph.meta.lastUpdated && (
          <span className="last-updated">آخر تحديث: {formatArabicDate(graph.meta.lastUpdated)}</span>
        )}
      </header>
      <div className="app-body">
        <FamilyTree />
        <DetailsPanel />
      </div>
    </div>
  );
}

function App() {
  return (
    <FamilyTreeProvider>
      <AppShell />
    </FamilyTreeProvider>
  );
}

export default App;
