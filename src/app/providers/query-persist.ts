import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { storage } from '@/shared/lib/storage'

export const queryPersister = createAsyncStoragePersister({
  storage: {
    getItem: (key) => Promise.resolve(storage.getItem(key)),
    setItem: (key, value) => {
      storage.setItem(key, value)
      return Promise.resolve()
    },
    removeItem: (key) => {
      storage.removeItem(key)
      return Promise.resolve()
    },
  },
})

import { env } from '@/app/config/env'

export const queryPersistBuster = env.appVersion
