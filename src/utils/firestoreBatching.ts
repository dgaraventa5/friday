import type { Task } from '../types/task';

export const MAX_BATCH_WRITE_OPERATIONS = 500;

export type TaskWriteOperation =
  | { type: 'delete'; docId: string }
  | { type: 'set'; task: Task };

type Batch = {
  delete: (ref: unknown) => void;
  set: (ref: unknown, data: unknown, options: { merge: boolean }) => void;
  commit: () => Promise<void>;
};

type CommitOptions = {
  createBatch: () => Batch;
  getDeleteRef: (docId: string) => unknown;
  getSetRef: (taskId: string) => unknown;
  toFirestoreTask: (task: Task) => Record<string, unknown>;
  chunkSize?: number;
};

export const commitTaskOperationsInChunks = async (
  operations: TaskWriteOperation[],
  { createBatch, getDeleteRef, getSetRef, toFirestoreTask, chunkSize }: CommitOptions,
): Promise<void> => {
  if (operations.length === 0) {
    return;
  }

  const effectiveChunkSize = Math.min(
    chunkSize ?? MAX_BATCH_WRITE_OPERATIONS,
    MAX_BATCH_WRITE_OPERATIONS,
  );

  for (let index = 0; index < operations.length; index += effectiveChunkSize) {
    const batch = createBatch();
    const slice = operations.slice(index, index + effectiveChunkSize);

    slice.forEach((operation) => {
      if (operation.type === 'delete') {
        batch.delete(getDeleteRef(operation.docId));
        return;
      }

      const ref = getSetRef(operation.task.id);
      const payload = toFirestoreTask(operation.task);
      batch.set(ref, payload, { merge: true });
    });

    await batch.commit();
  }
};
