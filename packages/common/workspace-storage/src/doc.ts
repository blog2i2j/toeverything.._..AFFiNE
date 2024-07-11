import { mergeUpdates } from 'yjs';

import { Connection } from './connection';
import { type Lock, SingletonLocker } from './lock';

export interface DocRecord {
  workspaceId: string;
  docId: string;
  bin: Uint8Array;
  version: number;
}

export interface DocUpdate {
  bin: Uint8Array;
  version: number;
}

export interface WorkspaceDocStorageOptions {
  mergeUpdates?: (updates: Uint8Array[]) => Uint8Array;
}

export abstract class WorkspaceDocStorageAdapter extends Connection {
  private readonly locker = new SingletonLocker();

  constructor(protected readonly options: WorkspaceDocStorageOptions) {
    super();
  }

  // open apis
  async getDoc(workspaceId: string, docId: string): Promise<DocRecord | null> {
    using _lock = await this.lockDocForUpdate(workspaceId, docId);

    let snapshot = await this.getDocSnapshot(workspaceId, docId);
    const updates = await this.getDocPendingUpdates(workspaceId, docId);

    if (updates.length) {
      if (snapshot) {
        updates.unshift(snapshot);
      }

      snapshot = this.squash(updates);

      await this.setDocSnapshot(snapshot);
      await this.markUpdatesMerged(workspaceId, docId, snapshot.version);
    }

    return snapshot;
  }

  abstract pushDocUpdates(
    workspaceId: string,
    docId: string,
    updates: DocUpdate[]
  ): Promise<number>;
  abstract deleteDoc(workspaceId: string, docId: string): Promise<boolean>;
  abstract deleteWorkspace(workspaceId: string): Promise<void>;
  async rollbackDoc(
    workspaceId: string,
    docId: string,
    version: number
  ): Promise<void> {
    // using _lock = await this.lockDocForUpdate(workspaceId, docId);
    const toSnapshot = await this.getHistoryDocSnapshot(
      workspaceId,
      docId,
      version
    );
    if (!toSnapshot) {
      throw new Error('Can not find the version to rollback to.');
    }

    const fromSnapshot = await this.getDocSnapshot(workspaceId, docId);

    if (!fromSnapshot) {
      throw new Error('Can not find the current version of the doc.');
    }

    // recover
    await this.setDocSnapshot({
      ...toSnapshot,
      // deal with the version, maybe we need to lock snapshot for writing before starting rollback
      // version: fromSnapshot.version + 1,
      // bin: newBin
    });
  }

  abstract getDocVersions(
    workspaceId: string
  ): Promise<Record<string, number> | null>;
  abstract listDocHistories(
    workspaceId: string,
    docId: string,
    query: { skip?: number; limit?: number }
  ): Promise<DocRecord[]>;
  abstract getHistoryDocSnapshot(
    workspaceId: string,
    docId: string,
    version: number
  ): Promise<DocRecord | null>;

  // api for internal usage
  protected abstract getDocSnapshot(
    workspaceId: string,
    docId: string
  ): Promise<DocRecord | null>;
  protected abstract setDocSnapshot(snapshot: DocRecord): Promise<void>;
  abstract getDocPendingUpdates(
    workspaceId: string,
    docId: string
  ): Promise<DocRecord[]>;
  abstract markUpdatesMerged(
    workspaceId: string,
    docId: string,
    version: number
  ): Promise<number>;

  protected squash(updates: DocRecord[]): DocRecord {
    const merge = this.options?.mergeUpdates ?? mergeUpdates;
    const lastUpdate = updates.at(-1);
    if (!lastUpdate) {
      throw new Error('No updates to be squashed.');
    }

    // fast return
    if (updates.length === 1) {
      return lastUpdate;
    }

    const finalUpdate = merge(updates.map(u => u.bin));

    return {
      version: lastUpdate.version,
      workspaceId: lastUpdate.workspaceId,
      docId: lastUpdate.docId,
      bin: finalUpdate,
    };
  }

  protected async lockDocForUpdate(
    workspaceId: string,
    docId: string
  ): Promise<Lock> {
    return this.locker.lock(`workspace:${workspaceId}:update`, docId);
  }
}
