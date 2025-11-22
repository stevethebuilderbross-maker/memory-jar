
export interface MemorySymbol {
  id: string;
  symbol: string; // Emoji or short text icon
  meaning: string; // The full semantic meaning
  triggers: string[]; // List of words that trigger this memory
  timestamp: number;
}

const STORAGE_KEY = 'memory_jar_symbols_v1';
const BACKUP_KEY = 'memory_jar_symbols_backup';

export const MemoryService = {
  // Called on app start to ensure data integrity
  init() {
    try {
      const primary = localStorage.getItem(STORAGE_KEY);
      const backup = localStorage.getItem(BACKUP_KEY);

      // CASE 1: Update wiped primary, but backup exists -> RESTORE
      if (!primary && backup) {
        console.warn("[Memory Vault] Primary storage missing. Restoring from backup...");
        localStorage.setItem(STORAGE_KEY, backup);
      } 
      // CASE 2: Primary exists, backup missing -> BACKUP
      else if (primary && !backup) {
        console.log("[Memory Vault] Creating missing backup...");
        localStorage.setItem(BACKUP_KEY, primary);
      }
      // CASE 3: Both exist -> Sync if needed (simplified to just logging for now)
      else if (primary && backup) {
        console.log("[Memory Vault] Integrity check passed. Memories secure.");
      }
    } catch (e) {
      console.error("[Memory Vault] Initialization error:", e);
    }
  },

  getMemories(): MemorySymbol[] {
    try {
      // Try Primary
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
      
      // Fallback to Backup if Primary is corrupt/empty
      const backup = localStorage.getItem(BACKUP_KEY);
      if (backup) {
        const parsed = JSON.parse(backup);
        if (Array.isArray(parsed)) {
            // Auto-repair primary
            localStorage.setItem(STORAGE_KEY, backup);
            return parsed;
        }
      }
      
      return [];
    } catch (e) {
      console.error("Failed to load memories", e);
      return [];
    }
  },

  saveMemory(symbol: string, meaning: string, triggers: string[] = []): MemorySymbol {
    const memories = this.getMemories();
    
    // Check for duplicates to avoid spamming
    const exists = memories.find(m => m.meaning.toLowerCase().includes(meaning.toLowerCase()) || meaning.toLowerCase().includes(m.meaning.toLowerCase()));
    
    if (exists) {
        console.log("Memory already exists, updating timestamp:", meaning);
        exists.timestamp = Date.now(); // Update 'last recalled' time
        // Merge triggers if new ones are found
        const uniqueTriggers = new Set([...(exists.triggers || []), ...triggers]);
        exists.triggers = Array.from(uniqueTriggers);
        
        this.persist(memories);
        return exists;
    }

    const newMemory: MemorySymbol = {
      id: crypto.randomUUID(),
      symbol,
      meaning,
      triggers,
      timestamp: Date.now()
    };

    const updated = [...memories, newMemory];
    this.persist(updated);
    return newMemory;
  },

  // Internal helper to save to both locations
  persist(memories: MemorySymbol[]) {
    const json = JSON.stringify(memories);
    localStorage.setItem(STORAGE_KEY, json);
    localStorage.setItem(BACKUP_KEY, json);
  },

  clearMemories() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(BACKUP_KEY);
  },

  // Generates the prompt context string for the AI
  getContextString(): string {
    const memories = this.getMemories();
    
    if (memories.length === 0) {
        return `
        [MEMORY SYSTEM: EMPTY]
        No past memories found. Start fresh, but be ready to save important new details using the 'save_memory_symbol' tool.
        `;
    }

    // Format with dates to emphasize persistence
    return `
    ================================================================
    🧠 LONG-TERM MEMORY BANK (ASSOCIATIVE RECALL ENABLED)
    ================================================================
    The following are established facts and stories about the user.
    Pay attention to the [TRIGGERS]. If the user mentions these words, you must recall the associated memory.

    ${memories.map(m => `
    • [${m.symbol}] MEMORY: "${m.meaning}"
      TRIGGERS: ${(m.triggers || []).join(', ')}
      LEARNED: ${new Date(m.timestamp).toLocaleDateString()}
    `).join('')}
    
    INSTRUCTION: 
    1. Scan user speech for TRIGGERS.
    2. If a trigger (e.g. "fish") matches a memory (e.g. "lost fishing pole"), explicitly mention it: "That reminds me of when you lost your dad's pole..."
    ================================================================
    `;
  }
};
