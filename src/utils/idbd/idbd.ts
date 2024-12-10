import { v4 as uuidv4 } from 'uuid';

let database: IDBDatabase | null = null;

type TxState = 'none' | 'pending' | 'complete';

const DATABASE_NAME = 'kavachat';
const DATABASE_VERSION = 1;
const IMAGE_STORE_NAME = 'image';

let initPromise: Promise<IDBDatabase> | null = null;

export const idbGet = async (): Promise<IDBDatabase> => {
  if (database) {
    return database;
  }

  // if this function is called twice or more and a promise is already
  // created return that instead of trying to open a the database again (which would fail)
  if (initPromise) {
    return initPromise;
  }

  // when opening the database there are two paths
  // 1. the database is already created and no upgradeneeded event is fired
  // 2. the database is new and an upgradeneeded is fired along with
  //    an implicit 'versionchange' transaction with readwrite permission
  //    this is when we set up the object store for the images
  const req: IDBOpenDBRequest = window.indexedDB.open(
    DATABASE_NAME,
    DATABASE_VERSION,
  );

  let txState: TxState = 'none';

  initPromise = new Promise<IDBDatabase>((resolve, reject) => {
    req.addEventListener('success', () => {
      database = req.result; // results now hold the IDBDatabase on success
      if (txState === 'none') resolve(database); // resolve only if no 'versionchange' tx was created
    });

    req.addEventListener('error', () => {
      reject(
        new Error(
          `indexedDB: request failed to open database. name:${DATABASE_NAME} version:${DATABASE_VERSION}`,
        ),
      );
    });

    req.addEventListener('upgradeneeded', (ev) => {
      // @ts-expect-error
      const db: IDBDatabase = ev.target.result;
      // @ts-expect-error
      const tx: IDBTransaction = ev.target.transaction;

      if (db && tx) {
        txState = 'pending';
        database = db;
      }

      // create the image object store
      db.createObjectStore(IMAGE_STORE_NAME, {
        keyPath: 'id',
      });

      tx.addEventListener('complete', () => {
        txState = 'complete';
        resolve(db); // resolve here in case of a transaction
      });

      tx.addEventListener('error', () => {
        reject(
          new Error(
            `indexedDB: transaction failed to create database object store: ${IMAGE_STORE_NAME} db_name:${DATABASE_NAME} version:${DATABASE_VERSION}`,
          ),
        );
      });

    });
  });

  return initPromise;
};

export const saveImage = async (base64ImgData: string) : Promise<string> => {
  const db = await idbGet();

  const tx = db.transaction(IMAGE_STORE_NAME, 'readwrite');

  const store = tx.objectStore(IMAGE_STORE_NAME);

  const req = store.add({
    id: uuidv4(),
    data: base64ImgData,
  });


  return new Promise((resolve, reject) => {
    let isSaved = false;

    tx.addEventListener('complete', () => {
      if (isSaved) {
        resolve(req.result as unknown as string);
      } else {
        reject(new Error(`indexedDB: request to save image failed`));
      }
    });

    tx.addEventListener('error', () => {
      reject(new Error(`indexedDB: transaction to save image failed`));
    });

    req.addEventListener('success', () => {
      isSaved = true;
    });

    req.addEventListener('error', () => {
      reject(new Error(`indexedDB: request to save image failed`));
    });
  });
};

export const getImage = async (
  id: string,
): Promise<{ id: string; data: string } | undefined> => {
  const db = await idbGet();

  const tx = db.transaction(IMAGE_STORE_NAME, 'readonly');

  const store = tx.objectStore(IMAGE_STORE_NAME);

  const req = store.get(id);



  return new Promise((resolve, reject) => {
    tx.addEventListener('complete', () => {
      resolve(req.result);
    });

    tx.addEventListener('error', () => {
      reject(new Error(`indexedDB: transaction to get image ${id} failed`));
    });

    req.addEventListener('error', () => {
      reject(new Error(`indexedDB: request to get image ${id} failed`));
    });
  });
};
