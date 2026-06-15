interface Tab {
  id: string;
  name: string;
}

interface Props {
  tabs: Tab[];
  activeTab: number;
  onSelect: (i: number) => void;
  onDelete: (i: number) => void;
}

export default function TabBar({ tabs, activeTab, onSelect, onDelete }: Props) {
  return (
    <div className="pg-tabs">
      {tabs.map((t, i) => (
        <div key={t.id} className={`pg-tab-btn${activeTab === i ? ' active' : ''}`} onClick={() => onSelect(i)}>
          <span>{t.name}</span>
          <button className="del-tab" onClick={e => { e.stopPropagation(); onDelete(i); }}>&#10005;</button>
        </div>
      ))}
    </div>
  );
}
