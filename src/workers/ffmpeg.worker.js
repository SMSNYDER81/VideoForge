self.onmessage = async (event) => {
  const { type, projectData } = event.data

  switch (type) {
    case 'INIT':
      self.postMessage({
        type: 'READY'
      })
      break

    case 'EXPORT':
      self.postMessage({
        type: 'EXPORT_STARTED'
      })

      // Run structured step intervals to represent rendering clips, aligning transitions is background threads
      let currentProgress = 0
      let stepIdx = 0
      const totalSteps = 5

      const interval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 8) + 6
        if (currentProgress >= 100) {
          currentProgress = 100
          stepIdx = totalSteps - 1
          clearInterval(interval)
          
          self.postMessage({
            type: 'EXPORT_COMPLETE',
            summary: `Nonlinear compilation complete for "${projectData?.name || 'Workspace'}" in background thread.`
          })
        } else {
          // Increment step index proportional to progress
          stepIdx = Math.min(totalSteps - 1, Math.floor((currentProgress / 100) * totalSteps))
          self.postMessage({
            type: 'EXPORT_STEP',
            progress: currentProgress,
            stepIndex: stepIdx
          })
        }
      }, 150)

      break

    default:
      self.postMessage({
        type: 'UNKNOWN_ACTION'
      })
  }
}
