import { useEffect } from 'react'
import { db } from '../storage/db'

export default function useAutosave(project) {
  useEffect(() => {
    if (!project) return

    const saveProject = async () => {
      // Filter out functions from the store object as they cannot be cloned for IndexedDB
      const projectData = Object.entries(project).reduce((acc, [key, value]) => {
        if (typeof value !== 'function') {
          acc[key] = value
        }
        return acc
      }, {})

      await db.projects.put({
        id: 1,
        name: project.projectName,
        data: projectData,
        updatedAt: new Date().toISOString()
      })
    }

    const timeout = setTimeout(saveProject, 1200)

    return () => clearTimeout(timeout)
  }, [project])
}
