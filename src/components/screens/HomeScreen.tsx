import type { Collection } from "../../lib/collection";
import BackupReminder from "../BackupReminder";
import ResourceLibrary from "../ResourceLibrary";
type Props = { collection: Collection; reminderVisible: boolean; onDownload: () => void; onRemindLater: () => void; onSelect: (id: string | null) => void; onActions: (id: string) => void; onOpenResult: (id: string, path: string[]) => void; onImport: () => void; onReorder: (id: string, target: number) => void };
export default function HomeScreen({ collection, reminderVisible, onDownload, onRemindLater, onSelect, onActions, onOpenResult, onImport, onReorder }: Props) {
  return <>
          {reminderVisible && <BackupReminder onDownload={onDownload} onLater={onRemindLater} />}
          <ResourceLibrary collection={collection} onOpen={onSelect} onActions={onActions} onOpenResult={onOpenResult} onCreate={() => onSelect(null)} onImport={onImport} onReorder={onReorder} />
  </>;

}
