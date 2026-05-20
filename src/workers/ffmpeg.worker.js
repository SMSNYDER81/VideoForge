self.onmessage = async (event) => {
  const { type } = event.data

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

      setTimeout(() => {
        self.postMessage({
          type: 'EXPORT_COMPLETE'
        })
      }, 3000)

      break

    default:
      self.postMessage({
        type: 'UNKNOWN_ACTION'
      })
  }
}
