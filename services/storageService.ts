
import { SavedSession, TopicId, VocabularyItem } from "../types";

const DB_NAME = 'chokai_master_db';
const DB_VERSION = 3; // Incremented version to ensure clean slate if needed or migration
const STORE_SESSIONS = 'sessions';
const STORE_FAVORITES = 'favorites';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Sessions Store
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        const store = db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' });
        store.createIndex('topicId', 'topicId', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Favorites Store
      if (!db.objectStoreNames.contains(STORE_FAVORITES)) {
        // Use word as key for simplicity
        db.createObjectStore(STORE_FAVORITES, { keyPath: 'word' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

// --- Sessions ---

export const saveSession = async (session: SavedSession): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_SESSIONS, 'readwrite');
    const store = transaction.objectStore(STORE_SESSIONS);
    const request = store.put(session);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Update an existing session (e.g. adding audio cache)
export const updateSession = async (session: SavedSession): Promise<void> => {
  return saveSession(session); // put() overwrites if key exists
};

export const getSessionsByTopic = async (topicId: TopicId): Promise<SavedSession[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_SESSIONS, 'readonly');
    const store = transaction.objectStore(STORE_SESSIONS);
    const index = store.index('topicId');
    const request = index.getAll(topicId);

    request.onsuccess = () => {
      // Sort by newest first
      const results = request.result as SavedSession[];
      results.sort((a, b) => b.createdAt - a.createdAt);
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
};

export const getSessionCounts = async (): Promise<Record<string, number>> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_SESSIONS, 'readonly');
    const store = transaction.objectStore(STORE_SESSIONS);
    const request = store.getAll(); // Get all to count, or use cursor for efficiency if large

    request.onsuccess = () => {
      const sessions = request.result as SavedSession[];
      const counts: Record<string, number> = {};
      sessions.forEach(s => {
        counts[s.topicId] = (counts[s.topicId] || 0) + 1;
      });
      resolve(counts);
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteSession = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_SESSIONS, 'readwrite');
    const store = transaction.objectStore(STORE_SESSIONS);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// --- Favorites ---

export const saveFavorite = async (item: VocabularyItem): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_FAVORITES, 'readwrite');
    const store = transaction.objectStore(STORE_FAVORITES);
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const removeFavorite = async (word: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_FAVORITES, 'readwrite');
    const store = transaction.objectStore(STORE_FAVORITES);
    const request = store.delete(word);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getFavorites = async (): Promise<VocabularyItem[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_FAVORITES, 'readonly');
    const store = transaction.objectStore(STORE_FAVORITES);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};
