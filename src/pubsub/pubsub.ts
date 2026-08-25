/**
 * Pub/Sub - Event-driven messaging cho distributed cache
 *
 * Cho phép nodes thông báo cho nhau khi data thay đổi
 * → Cache invalidation tự động
 */

/** Event handler type */
export type EventHandler = (data: unknown) => void;

/** Channel info */
export interface Channel {
  /** Tên channel */
  name: string;
  /** Số subscribers */
  subscriberCount: number;
}

/**
 * PubSub - Publish/Subscribe messaging
 */
export class PubSub {
  /** Map<channel, Set<EventHandler>> */
  private channels: Map<string, Set<EventHandler>>;
  /** Map<EventHandler, Set<channel>> để unsubscribe */
  private subscriptions: Map<EventHandler, Set<string>>;

  constructor() {
    this.channels = new Map();
    this.subscriptions = new Map();
  }

  /**
   * Subscribe vào channel
   * @param channel - Tên channel
   * @param handler - Function xử lý event
   * @returns Unsubscribe function
   */
  subscribe(channel: string, handler: EventHandler): () => void {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }

    this.channels.get(channel)!.add(handler);

    // Track subscriptions để unsubscribe sau
    if (!this.subscriptions.has(handler)) {
      this.subscriptions.set(handler, new Set());
    }
    this.subscriptions.get(handler)!.add(channel);

    // Trả về unsubscribe function
    return () => {
      this.unsubscribe(channel, handler);
    };
  }

  /**
   * Unsubscribe khỏi channel
   */
  unsubscribe(channel: string, handler: EventHandler): void {
    const handlers = this.channels.get(channel);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.channels.delete(channel);
      }
    }

    const channels = this.subscriptions.get(handler);
    if (channels) {
      channels.delete(channel);
      if (channels.size === 0) {
        this.subscriptions.delete(handler);
      }
    }
  }

  /**
   * Publish message đến channel
   * @param channel - Tên channel
   * @param data - Dữ liệu gửi
   */
  publish(channel: string, data: unknown): void {
    const handlers = this.channels.get(channel);
    if (!handlers) return;

    for (const handler of handlers) {
      try {
        handler(data);
      } catch {
        // Bỏ qua lỗi trong handler
      }
    }
  }

  /**
   * Lấy tất cả channels
   */
  getChannels(): Channel[] {
    const result: Channel[] = [];
    for (const [name, handlers] of this.channels) {
      result.push({ name, subscriberCount: handlers.size });
    }
    return result;
  }

  /**
   * Lấy số channels
   */
  getChannelCount(): number {
    return this.channels.size;
  }

  /**
   * Lấy số subscribers của channel
   */
  getSubscriberCount(channel: string): number {
    return this.channels.get(channel)?.size ?? 0;
  }

  /**
   * Clear tất cả channels
   */
  clear(): void {
    this.channels.clear();
    this.subscriptions.clear();
  }
}
