/**
 * IndexedDB Manager for DQN Training Data
 * Stores collected transitions persistently in browser
 * Format: JSON (as per DQN spec)
 */

class IndexedDBManager {
  constructor(dbName = "dqn_ui_data", version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  /**
   * Initialize IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error("[IndexedDB] Failed to open database");
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("[IndexedDB] Database initialized");
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains("transitions")) {
          const transStore = db.createObjectStore("transitions", {
            keyPath: "id",
            autoIncrement: true,
          });
          transStore.createIndex("sessionId", "sessionId", { unique: false });
          transStore.createIndex("timestamp", "timestamp", { unique: false });
          console.log("[IndexedDB] Created 'transitions' store");
        }

        if (!db.objectStoreNames.contains("sessions")) {
          const sessionStore = db.createObjectStore("sessions", {
            keyPath: "sessionId",
            unique: true,
          });
          sessionStore.createIndex("timestamp", "timestamp", { unique: false });
          console.log("[IndexedDB] Created 'sessions' store");
        }

        if (!db.objectStoreNames.contains("exports")) {
          const exportStore = db.createObjectStore("exports", {
            keyPath: "id",
            autoIncrement: true,
          });
          exportStore.createIndex("timestamp", "timestamp", { unique: false });
          console.log("[IndexedDB] Created 'exports' store");
        }
      };
    });
  }

  /**
   * Save a single transition
   */
  async saveTransition(transition) {
    if (!this.db) {
      console.warn("[IndexedDB] Database not initialized");
      return null;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(["transitions"], "readwrite");
      const store = tx.objectStore("transitions");
      const request = store.add({
        ...transition,
        savedAt: Date.now(),
      });

      request.onerror = () => {
        console.error("[IndexedDB] Failed to save transition");
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log(`[IndexedDB] Saved transition ID: ${request.result}`);
        resolve(request.result);
      };
    });
  }

  /**
   * Save multiple transitions (batch)
   */
  async saveTransitions(transitions) {
    if (!this.db) {
      console.warn("[IndexedDB] Database not initialized");
      return null;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(["transitions"], "readwrite");
      const store = tx.objectStore("transitions");
      let count = 0;

      transitions.forEach((transition) => {
        const request = store.add({
          ...transition,
          savedAt: Date.now(),
        });

        request.onsuccess = () => {
          count++;
        };

        request.onerror = () => {
          console.error("[IndexedDB] Error saving transition in batch");
        };
      });

      tx.oncomplete = () => {
        console.log(`[IndexedDB] Saved ${count} transitions in batch`);
        resolve(count);
      };

      tx.onerror = () => {
        reject(tx.error);
      };
    });
  }

  /**
   * Save session metadata
   */
  async saveSession(sessionData) {
    if (!this.db) {
      console.warn("[IndexedDB] Database not initialized");
      return null;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(["sessions"], "readwrite");
      const store = tx.objectStore("sessions");
      const request = store.put({
        ...sessionData,
        savedAt: Date.now(),
      });

      request.onerror = () => {
        console.error("[IndexedDB] Failed to save session");
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log(`[IndexedDB] Saved session: ${sessionData.sessionId}`);
        resolve(request.result);
      };
    });
  }

  /**
   * Get all transitions for a session
   */
  async getSessionTransitions(sessionId) {
    if (!this.db) {
      console.warn("[IndexedDB] Database not initialized");
      return [];
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(["transitions"], "readonly");
      const store = tx.objectStore("transitions");
      const index = store.index("sessionId");
      const request = index.getAll(sessionId);

      request.onerror = () => {
        console.error("[IndexedDB] Failed to retrieve transitions");
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log(
          `[IndexedDB] Retrieved ${request.result.length} transitions for session ${sessionId}`,
        );
        resolve(request.result);
      };
    });
  }

  /**
   * Get all transitions (entire dataset)
   */
  async getAllTransitions() {
    if (!this.db) {
      console.warn("[IndexedDB] Database not initialized");
      return [];
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(["transitions"], "readonly");
      const store = tx.objectStore("transitions");
      const request = store.getAll();

      request.onerror = () => {
        console.error("[IndexedDB] Failed to retrieve all transitions");
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log(
          `[IndexedDB] Retrieved ${request.result.length} total transitions`,
        );
        resolve(request.result);
      };
    });
  }

  /**
   * Get all records (alias for getAllTransitions)
   * Used for generic data retrieval
   */
  async getAll() {
    return this.getAllTransitions();
  }

  /**
   * Get all sessions
   */
  async getAllSessions() {
    if (!this.db) {
      console.warn("[IndexedDB] Database not initialized");
      return [];
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(["sessions"], "readonly");
      const store = tx.objectStore("sessions");
      const request = store.getAll();

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  /**
   * Export all transitions as CSV
   * Format: matches dqn_state_cols_v2.json exactly
   */
  async exportAllAsCSV() {
    const transitions = await this.getAllTransitions();

    if (transitions.length === 0) {
      console.warn("[IndexedDB] No transitions to export");
      return null;
    }

    // CSV header
    const stateColumns = [
      "s_session_duration",
      "s_total_distance",
      "s_num_actions",
      "s_num_clicks",
      "s_mean_time_per_action",
      "s_vel_mean",
      "s_vel_std",
      "s_accel_mean",
      "s_accel_std",
      "s_curve_mean",
      "s_curve_std",
      "s_jerk_mean",
      "s_persona_novice_old",
      "s_persona_intermediate",
      "s_persona_expert",
    ];

    const nextStateColumns = stateColumns.map((col) => `next_${col}`);
    const header = [
      ...stateColumns,
      "action",
      "reward",
      ...nextStateColumns,
      "done",
    ];

    // CSV rows
    const rows = transitions.map((t) => {
      const stateValues = stateColumns.map((col) => t.state[col] || 0);
      const nextStateValues = nextStateColumns.map(
        (col) => t.next_state[col.replace("next_", "")] || 0,
      );

      return [...stateValues, t.action, t.reward, ...nextStateValues, t.done]
        .map((v) => (typeof v === "number" ? v.toFixed(6) : v))
        .join(",");
    });

    const csv = [header.join(","), ...rows].join("\n");

    console.log(
      `[IndexedDB] Exported ${transitions.length} transitions as CSV`,
    );
    return csv;
  }

  /**
   * Export all transitions as JSON
   */
  async exportAllAsJSON() {
    const transitions = await this.getAllTransitions();
    const sessions = await this.getAllSessions();

    const data = {
      exportedAt: new Date().toISOString(),
      transitionCount: transitions.length,
      sessionCount: sessions.length,
      transitions,
      sessions,
    };

    console.log("[IndexedDB] Exported all data as JSON");
    return data;
  }

  /**
   * Clear all transitions (careful!)
   */
  async clearTransitions() {
    if (!this.db) {
      console.warn("[IndexedDB] Database not initialized");
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(["transitions"], "readwrite");
      const store = tx.objectStore("transitions");
      const request = store.clear();

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log("[IndexedDB] Cleared all transitions");
        resolve();
      };
    });
  }

  /**
   * Get database statistics
   */
  async getStats() {
    const allTransitions = await this.getAllTransitions();
    const allSessions = await this.getAllSessions();

    const stats = {
      transitionCount: allTransitions.length,
      sessionCount: allSessions.length,
      storageSize: allTransitions.reduce(
        (sum, t) => sum + JSON.stringify(t).length,
        0,
      ),
      lastUpdated:
        allTransitions.length > 0
          ? allTransitions[allTransitions.length - 1].timestamp
          : null,
    };

    return stats;
  }
}

export default IndexedDBManager;
