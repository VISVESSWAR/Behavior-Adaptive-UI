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
   * Check if database connection is valid and open
   */
  isConnectionValid() {
    return this.db && !this.db.closed;
  }

  /**
   * Reconnect to database if connection is lost
   */
  async reconnect() {
    try {
      if (!this.isConnectionValid()) {
        console.log("[IndexedDB] Reconnecting to database...");
        await this.init();
        console.log("[IndexedDB] Reconnected successfully");
      }
    } catch (err) {
      console.error("[IndexedDB] Reconnection failed:", err);
      throw err;
    }
  }

  /**
   * Save a single transition with automatic reconnection
   */
  async saveTransition(transition) {
    if (!this.isConnectionValid()) {
      console.warn("[IndexedDB] Database not initialized or connection closed, attempting reconnection...");
      try {
        await this.reconnect();
      } catch (err) {
        console.error("[IndexedDB] Could not reconnect, skipping save:", err);
        return null;
      }
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(["transitions"], "readwrite");
        const store = tx.objectStore("transitions");
        const request = store.add({
          ...transition,
          savedAt: Date.now(),
        });

        request.onerror = () => {
          console.error("[IndexedDB] Failed to save transition:", request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          console.log(`[IndexedDB] Saved transition ID: ${request.result}`);
          resolve(request.result);
        };

        tx.onerror = () => {
          console.error("[IndexedDB] Transaction failed:", tx.error);
          reject(tx.error);
        };

        tx.onabort = () => {
          console.warn("[IndexedDB] Transaction aborted");
          reject(new Error("Transaction aborted"));
        };
      } catch (err) {
        console.error("[IndexedDB] Error creating transaction:", err);
        reject(err);
      }
    });
  }

  /**
   * Save multiple transitions (batch) with automatic reconnection
   */
  async saveTransitions(transitions) {
    if (!this.isConnectionValid()) {
      console.warn("[IndexedDB] Database not initialized or connection closed, attempting reconnection...");
      try {
        await this.reconnect();
      } catch (err) {
        console.error("[IndexedDB] Could not reconnect, skipping batch save:", err);
        return null;
      }
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(["transitions"], "readwrite");
        const store = tx.objectStore("transitions");
        let count = 0;
        let errors = [];

        transitions.forEach((transition) => {
          const request = store.add({
            ...transition,
            savedAt: Date.now(),
          });

          request.onsuccess = () => {
            count++;
          };

          request.onerror = () => {
            errors.push(request.error);
            console.error("[IndexedDB] Error saving transition in batch:", request.error);
          };
        });

        tx.oncomplete = () => {
          console.log(`[IndexedDB] Saved ${count}/${transitions.length} transitions in batch`);
          resolve(count);
        };

        tx.onerror = () => {
          console.error("[IndexedDB] Batch transaction failed:", tx.error);
          reject(tx.error);
        };

        tx.onabort = () => {
          console.warn("[IndexedDB] Batch transaction aborted");
          reject(new Error("Batch transaction aborted"));
        };
      } catch (err) {
        console.error("[IndexedDB] Error creating batch transaction:", err);
        reject(err);
      }
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
   * Get all transitions (entire dataset) with connection validation
   */
  async getAllTransitions() {
    // Check connection validity
    if (!this.isConnectionValid()) {
      console.warn("[IndexedDB] Database not initialized or connection closed, attempting reconnection...");
      try {
        await this.reconnect();
      } catch (err) {
        console.error("[IndexedDB] Failed to reconnect for getAllTransitions:", err);
        return [];
      }
    }

    return new Promise((resolve, reject) => {
      try {
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

        tx.onerror = () => {
          console.error("[IndexedDB] Transaction error in getAllTransitions:", tx.error);
          reject(tx.error);
        };
      } catch (err) {
        console.error("[IndexedDB] Error creating transaction for getAllTransitions:", err);
        reject(err);
      }
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
   * Export all transitions as CSV with connection validation
   * Format: matches dqn_state_cols_v2.json exactly
   * 
   * ⚠️ CRITICAL: Transitions store s and s_prime as ARRAYS, not objects
   * CSV must index into arrays: s[0], s[1], ... s[14]
   */
  async exportAllAsCSV() {
    // Check connection validity
    if (!this.isConnectionValid()) {
      console.warn("[IndexedDB] Database not initialized or connection closed, attempting reconnection...");
      try {
        await this.reconnect();
      } catch (err) {
        console.error("[IndexedDB] Failed to reconnect for CSV export:", err);
        return null;
      }
    }

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
    // ⚠️ CRITICAL: s and s_prime are ARRAYS not objects
    // Index by position: s[0], s[1], etc.
    const rows = transitions.map((t) => {
      if (!t.s || !t.s_prime) {
        console.warn("[IndexedDB] Skipping transition with missing state vectors");
        return null;
      }

      // s is an array of 15 values
      const stateValues = t.s.slice(0, 15);
      
      // s_prime is an array of 15 values
      const nextStateValues = t.s_prime.slice(0, 15);

      return [...stateValues, t.a, t.r, ...nextStateValues, t.done ? 1 : 0]
        .map((v) => (typeof v === "number" ? v.toFixed(6) : v))
        .join(",");
    }).filter(row => row !== null);

    const csv = [header.join(","), ...rows].join("\n");

    console.log(
      `[IndexedDB] Exported ${rows.length} transitions as CSV`,
    );
    return csv;
  }

  /**
   * Export all transitions as JSON with connection validation
   */
  async exportAllAsJSON() {
    // Check connection validity
    if (!this.isConnectionValid()) {
      console.warn("[IndexedDB] Database not initialized or connection closed, attempting reconnection...");
      try {
        await this.reconnect();
      } catch (err) {
        console.error("[IndexedDB] Failed to reconnect for JSON export:", err);
        return null;
      }
    }

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
          ? allTransitions[allTransitions.length - 1].metadata?.timestamp ||
            allTransitions[allTransitions.length - 1].timestamp
          : null,
    };

    return stats;
  }

  /**
   * Validate transition schema - detect data integrity issues
   * ⚠️ CRITICAL: Run this to diagnose why exports are failing
   */
  async validateTransitions() {
    const transitions = await this.getAllTransitions();
    
    if (transitions.length === 0) {
      return {
        valid: true,
        count: 0,
        reason: "No transitions to validate"
      };
    }

    const report = {
      total: transitions.length,
      valid: 0,
      invalid: 0,
      issues: [],
      sampleTransition: null,
    };

    // Check first few transitions for schema correctness
    for (let i = 0; i < Math.min(5, transitions.length); i++) {
      const t = transitions[i];

      if (i === 0) {
        report.sampleTransition = {
          keys: Object.keys(t),
          s_type: Array.isArray(t.s) ? "array" : typeof t.s,
          s_length: Array.isArray(t.s) ? t.s.length : "N/A",
          s_prime_type: Array.isArray(t.s_prime) ? "array" : typeof t.s_prime,
          s_prime_length: Array.isArray(t.s_prime) ? t.s_prime.length : "N/A",
          a_value: t.a,
          r_value: t.r,
          done_value: t.done,
        };
      }

      // Validate required fields
      const isValid =
        Array.isArray(t.s) &&
        t.s.length === 15 &&
        Array.isArray(t.s_prime) &&
        t.s_prime.length === 15 &&
        typeof t.a === "number" &&
        typeof t.r === "number" &&
        typeof t.done === "number";

      if (isValid) {
        report.valid++;
      } else {
        report.invalid++;
        if (report.issues.length < 5) {
          report.issues.push({
            index: i,
            problem: `s_array=${Array.isArray(t.s)}(len=${t.s?.length}), s_prime_array=${Array.isArray(t.s_prime)}(len=${t.s_prime?.length}), a=${typeof t.a}, r=${typeof t.r}`,
          });
        }
      }
    }

    return report;
  }

  /**
   * Print diagnostic info about stored data
   * ⚠️ CRITICAL: Run in browser console to debug collection issues
   * Usage: await dbManager.printDiagnostics()
   */
  async printDiagnostics() {
    console.log("\n" + "=".repeat(80));
    console.log("INDEXEDDB DIAGNOSTICS");
    console.log("=".repeat(80));

    // DB status
    console.log(`\n[DB STATUS]`);
    console.log(`  Database open: ${this.db ? "✓ YES" : "✗ NO"}`);
    console.log(`  Database name: ${this.dbName}`);
    console.log(`  Schema version: ${this.version}`);
    if (this.db && !this.db.closed) {
      console.log(
        `  Object stores: ${Array.from(this.db.objectStoreNames).join(", ")}`
      );
    }

    // Stats
    console.log(`\n[STATISTICS]`);
    const stats = await this.getStats();
    console.log(`  Transitions stored: ${stats.transitionCount}`);
    console.log(`  Sessions stored: ${stats.sessionCount}`);
    console.log(`  Total storage: ${(stats.storageSize / 1024).toFixed(2)} KB`);
    console.log(`  Last update: ${stats.lastUpdated ? new Date(stats.lastUpdated).toISOString() : "Never"}`);

    // Validation
    console.log(`\n[SCHEMA VALIDATION]`);
    const validation = await this.validateTransitions();
    console.log(`  Total transitions: ${validation.total}`);
    console.log(`  Valid schema: ${validation.valid}`);
    console.log(`  Invalid schema: ${validation.invalid}`);
    if (validation.sampleTransition) {
      console.log(`  Sample transition:`);
      console.log(`    - Keys: ${validation.sampleTransition.keys.join(", ")}`);
      console.log(`    - s: ${validation.sampleTransition.s_type} (length ${validation.sampleTransition.s_length})`);
      console.log(`    - s_prime: ${validation.sampleTransition.s_prime_type} (length ${validation.sampleTransition.s_prime_length})`);
      console.log(`    - action: ${validation.sampleTransition.a_value}`);
      console.log(`    - reward: ${validation.sampleTransition.r_value}`);
    }
    if (validation.issues.length > 0) {
      console.log(`  Issues found:`);
      validation.issues.forEach((issue) => {
        console.log(`    [${issue.index}] ${issue.problem}`);
      });
    }

    // Export test
    console.log(`\n[EXPORT TEST]`);
    try {
      const csv = await this.exportAllAsCSV();
      if (csv) {
        const lines = csv.split("\n");
        console.log(`  CSV export: ✓ SUCCESS`);
        console.log(`  CSV lines: ${lines.length} (1 header + ${lines.length - 1} rows)`);
        console.log(`  CSV size: ${(csv.length / 1024).toFixed(2)} KB`);
      } else {
        console.log(`  CSV export: ✗ FAILED (null result)`);
      }
    } catch (err) {
      console.log(`  CSV export: ✗ ERROR - ${err.message}`);
    }

    console.log("\n" + "=".repeat(80) + "\n");
  }
}

export default IndexedDBManager;
