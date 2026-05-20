import Dexie from 'dexie'

export const db = new Dexie('clipforge-db')

db.version(1).stores({
  projects: '++id, name, updatedAt',
  media: '++id, type, name',
  sessions: '++id, projectId'
})
