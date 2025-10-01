import { DocumentData, Timestamp } from 'firebase/firestore';

const convertTimestamps = <T>(obj: T): T => {
  if (obj === null || obj === undefined) return obj;

  if (obj instanceof Timestamp) {
    return obj.toDate() as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => convertTimestamps(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};

    Object.keys(obj as Record<string, unknown>).forEach((key) => {
      const value = (obj as Record<string, unknown>)[key];
      result[key] = convertTimestamps(value);
    });

    return result as T;
  }

  return obj;
};

const prepareForFirestore = <T>(obj: T): DocumentData => {
  if (obj === null || obj === undefined) {
    return obj as unknown as DocumentData;
  }

  if (obj instanceof Date) {
    return Timestamp.fromDate(obj) as unknown as DocumentData;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => prepareForFirestore(item)) as unknown as DocumentData;
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};

    Object.keys(obj as Record<string, unknown>).forEach((key) => {
      const value = (obj as Record<string, unknown>)[key];

      if (value === undefined) {
        delete result[key];
      } else {
        result[key] = prepareForFirestore(value);
      }
    });

    return result as DocumentData;
  }

  return obj as unknown as DocumentData;
};

export { convertTimestamps, prepareForFirestore };
