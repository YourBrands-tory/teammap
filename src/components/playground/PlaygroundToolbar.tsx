import TabBar from './TabBar';

interface Tab {
  id: string;
  name: string;
}

interface Props {
  tabs: Tab[];
  activeTab: number;
  onSelectTab: (i: number) => void;
  onDeleteTab: (i: number) => void;
  onAdd: () => void;
  onRename: () => void;
  onClear: () => void;
}

export default function PlaygroundToolbar({ tabs, activeTab, onSelectTab, onDeleteTab, onAdd, onRename, onClear }: Props) {
  return (
    <div className="pg-topbar">
      <TabBar tabs={tabs} activeTab={activeTab} onSelect={onSelectTab} onDelete={onDeleteTab} />
      <button className="btn btn-sm" onClick={onAdd}>+ Sheet</button>
      <button className="btn btn-sm" onClick={onRename}>Rename</button>
      <button className="btn btn-sm btn-d" onClick={onClear}>&#128465; Clear</button>
    </div>
  );
}
