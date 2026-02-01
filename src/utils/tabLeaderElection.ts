/**
 * Tab Leader Election Utility
 *
 * Ensures only one browser tab performs expensive operations (like token refresh)
 * at a time, preventing race conditions in multi-tab scenarios.
 *
 * Uses localStorage with timestamps and heartbeats for leader election:
 * - Tabs compete to become leader by writing their ID + timestamp
 * - Leader maintains heartbeat to prove it's still alive
 * - If leader stops heartbeating, other tabs can take over
 * - Non-leader tabs listen for leader broadcasts
 *
 * @example
 * ```typescript
 * const leader = new TabLeaderElection('token-refresh');
 *
 * // Only perform token refresh if this tab is the leader
 * if (leader.isLeader()) {
 *   await refreshToken();
 *   leader.broadcast('refreshed'); // Notify other tabs
 * }
 *
 * // Listen for leader broadcasts in non-leader tabs
 * leader.onBroadcast((message) => {
 *   if (message === 'refreshed') {
 *     // Token was refreshed by leader, update local state
 *   }
 * });
 *
 * // Cleanup on unmount
 * leader.destroy();
 * ```
 */

const LEADER_HEARTBEAT_INTERVAL = 3000; // 3 seconds
const LEADER_TIMEOUT = 10000; // 10 seconds - if no heartbeat, leader is dead
const ELECTION_JITTER_MAX = 500; // Random delay to prevent thundering herd

interface LeaderData {
  tabId: string;
  timestamp: number;
  heartbeat: number;
}

type BroadcastCallback = (message: string) => void;

export class TabLeaderElection {
  private readonly key: string;
  private readonly broadcastKey: string;
  private readonly tabId: string;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: BroadcastCallback[] = [];
  private storageListener: ((e: StorageEvent) => void) | null = null;
  private destroyed = false;

  constructor(namespace: string) {
    this.key = `tab-leader-${namespace}`;
    this.broadcastKey = `tab-broadcast-${namespace}`;
    this.tabId = this.generateTabId();

    // Setup storage listener for broadcasts
    if (typeof window !== "undefined") {
      this.storageListener = (e: StorageEvent) => {
        if (e.key === this.broadcastKey && e.newValue) {
          this.notifyListeners(e.newValue);
        }
      };
      window.addEventListener("storage", this.storageListener);
    }
  }

  /**
   * Generate a unique tab ID
   */
  private generateTabId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current leader data from localStorage
   */
  private getLeaderData(): LeaderData | null {
    if (typeof window === "undefined") return null;

    try {
      const data = localStorage.getItem(this.key);
      if (!data) return null;
      return JSON.parse(data) as LeaderData;
    } catch {
      return null;
    }
  }

  /**
   * Set this tab as leader
   */
  private setAsLeader(): void {
    if (typeof window === "undefined" || this.destroyed) return;

    const leaderData: LeaderData = {
      tabId: this.tabId,
      timestamp: Date.now(),
      heartbeat: Date.now(),
    };

    try {
      localStorage.setItem(this.key, JSON.stringify(leaderData));
    } catch (error) {
      // localStorage might be full or disabled
      console.warn("[TabLeaderElection] Failed to set leader:", error);
    }
  }

  /**
   * Update heartbeat to prove this leader is still alive
   */
  private updateHeartbeat(): void {
    if (typeof window === "undefined" || this.destroyed) return;

    const leader = this.getLeaderData();
    if (leader && leader.tabId === this.tabId) {
      leader.heartbeat = Date.now();
      try {
        localStorage.setItem(this.key, JSON.stringify(leader));
      } catch {
        // Ignore storage errors
      }
    }
  }

  /**
   * Start heartbeat interval when becoming leader
   */
  private startHeartbeat(): void {
    this.stopHeartbeat(); // Clear any existing
    this.heartbeatInterval = setInterval(() => {
      if (this.isLeader()) {
        this.updateHeartbeat();
      } else {
        // Lost leadership, stop heartbeating
        this.stopHeartbeat();
      }
    }, LEADER_HEARTBEAT_INTERVAL);
  }

  /**
   * Stop heartbeat interval
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Check if current leader is still alive (recent heartbeat)
   */
  private isLeaderAlive(leader: LeaderData): boolean {
    const now = Date.now();
    return now - leader.heartbeat < LEADER_TIMEOUT;
  }

  /**
   * Check if this tab is the current leader
   *
   * If there's no leader or the leader is dead, this tab will
   * attempt to become leader (with jitter to prevent thundering herd).
   */
  isLeader(): boolean {
    if (typeof window === "undefined" || this.destroyed) return false;

    const leader = this.getLeaderData();

    // No leader - try to become one
    if (!leader) {
      this.setAsLeader();
      this.startHeartbeat();
      return true;
    }

    // We are already the leader
    if (leader.tabId === this.tabId) {
      return true;
    }

    // Check if current leader is dead
    if (!this.isLeaderAlive(leader)) {
      // Leader is dead - try to take over with jitter
      const jitter = Math.random() * ELECTION_JITTER_MAX;
      setTimeout(() => {
        // Double-check before taking over
        const currentLeader = this.getLeaderData();
        if (!currentLeader || !this.isLeaderAlive(currentLeader)) {
          this.setAsLeader();
          this.startHeartbeat();
        }
      }, jitter);
      return false; // Return false now, will become leader on next check
    }

    // Another tab is the active leader
    return false;
  }

  /**
   * Try to become leader immediately (for urgent operations)
   *
   * @returns true if this tab became the leader, false otherwise
   */
  tryBecomeLeader(): boolean {
    if (typeof window === "undefined" || this.destroyed) return false;

    const leader = this.getLeaderData();

    // No leader or dead leader - take over
    if (!leader || !this.isLeaderAlive(leader)) {
      this.setAsLeader();
      this.startHeartbeat();
      return true;
    }

    // We're already leader
    if (leader.tabId === this.tabId) {
      return true;
    }

    return false;
  }

  /**
   * Broadcast a message to all other tabs
   */
  broadcast(message: string): void {
    if (typeof window === "undefined" || this.destroyed) return;

    try {
      // Use localStorage to broadcast - other tabs will receive via storage event
      localStorage.setItem(this.broadcastKey, `${Date.now()}:${message}`);
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Register a callback for broadcast messages from other tabs
   */
  onBroadcast(callback: BroadcastCallback): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of a broadcast
   */
  private notifyListeners(rawMessage: string): void {
    // Extract message (format: "timestamp:message")
    const colonIndex = rawMessage.indexOf(":");
    const message = colonIndex > -1 ? rawMessage.substring(colonIndex + 1) : rawMessage;

    for (const listener of this.listeners) {
      try {
        listener(message);
      } catch (error) {
        console.error("[TabLeaderElection] Listener error:", error);
      }
    }
  }

  /**
   * Resign from leadership (if currently leader)
   */
  resign(): void {
    if (typeof window === "undefined" || this.destroyed) return;

    this.stopHeartbeat();

    const leader = this.getLeaderData();
    if (leader && leader.tabId === this.tabId) {
      try {
        localStorage.removeItem(this.key);
      } catch {
        // Ignore storage errors
      }
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.destroyed = true;
    this.resign();
    this.listeners = [];

    if (this.storageListener && typeof window !== "undefined") {
      window.removeEventListener("storage", this.storageListener);
      this.storageListener = null;
    }
  }
}

/**
 * Create a singleton tab leader instance for a given namespace
 */
const leaders = new Map<string, TabLeaderElection>();

export function getTabLeader(namespace: string): TabLeaderElection {
  if (!leaders.has(namespace)) {
    leaders.set(namespace, new TabLeaderElection(namespace));
  }
  return leaders.get(namespace)!;
}
