// IndexedDB wrapper for audio file storage
class AudioStorage {
  private dbName = "DreamClockAudio"
  private dbVersion = 1
  private storeName = "audioFiles"

  async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "name" })
        }
      }
    })
  }

  async storeAudioFile(name: string, file: File): Promise<string> {
    try {
      const db = await this.openDB()
      const transaction = db.transaction([this.storeName], "readwrite")
      const store = transaction.objectStore(this.storeName)

      // Store the actual file blob instead of base64
      const audioData = {
        name,
        file: file,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      }

      await new Promise((resolve, reject) => {
        const request = store.put(audioData)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      // Return a reference ID instead of the actual data
      return `audio-${name}-${Date.now()}`
    } catch (error) {
      console.error("Error storing audio file:", error)
      throw new Error("Failed to store audio file. Storage may be full.")
    }
  }

  async getAudioFile(name: string): Promise<string | null> {
    try {
      const db = await this.openDB()
      const transaction = db.transaction([this.storeName], "readonly")
      const store = transaction.objectStore(this.storeName)

      const result = await new Promise<any>((resolve, reject) => {
        const request = store.get(name)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      if (result && result.file) {
        // Convert file to blob URL for playback
        return URL.createObjectURL(result.file)
      }

      return null
    } catch (error) {
      console.error("Error retrieving audio file:", error)
      return null
    }
  }

  async getAllAudioFiles(): Promise<{ [key: string]: string }> {
    try {
      const db = await this.openDB()
      const transaction = db.transaction([this.storeName], "readonly")
      const store = transaction.objectStore(this.storeName)

      const result = await new Promise<any[]>((resolve, reject) => {
        const request = store.getAll()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      const audioFiles: { [key: string]: string } = {}
      for (const item of result) {
        if (item.file) {
          audioFiles[item.name] = URL.createObjectURL(item.file)
        }
      }

      return audioFiles
    } catch (error) {
      console.error("Error retrieving all audio files:", error)
      return {}
    }
  }

  async deleteAudioFile(name: string): Promise<void> {
    try {
      const db = await this.openDB()
      const transaction = db.transaction([this.storeName], "readwrite")
      const store = transaction.objectStore(this.storeName)

      await new Promise((resolve, reject) => {
        const request = store.delete(name)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error("Error deleting audio file:", error)
      throw new Error("Failed to delete audio file")
    }
  }

  async getStorageUsage(): Promise<{ used: number; available: number }> {
    try {
      if ("storage" in navigator && "estimate" in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        return {
          used: estimate.usage || 0,
          available: estimate.quota || 0,
        }
      }
    } catch (error) {
      console.error("Error getting storage usage:", error)
    }

    return { used: 0, available: 0 }
  }

  async clearAllAudioFiles(): Promise<void> {
    try {
      const db = await this.openDB()
      const transaction = db.transaction([this.storeName], "readwrite")
      const store = transaction.objectStore(this.storeName)

      await new Promise((resolve, reject) => {
        const request = store.clear()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error("Error clearing audio files:", error)
      throw new Error("Failed to clear audio files")
    }
  }
}

export const audioStorage = new AudioStorage()
