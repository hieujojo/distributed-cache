/**
 * Unit tests cho PubSub
 */

import { PubSub } from '../../src/pubsub/pubsub';

describe('PubSub', () => {
  let pubsub: PubSub;

  beforeEach(() => {
    pubsub = new PubSub();
  });

  describe('Constructor', () => {
    it('should create PubSub instance', () => {
      expect(pubsub).toBeDefined();
      expect(pubsub.getChannelCount()).toBe(0);
    });
  });

  describe('subscribe()', () => {
    it('should subscribe to channel', () => {
      const handler = jest.fn();

      pubsub.subscribe('test', handler);

      expect(pubsub.getChannelCount()).toBe(1);
      expect(pubsub.getSubscriberCount('test')).toBe(1);
    });

    it('should return unsubscribe function', () => {
      const handler = jest.fn();

      const unsubscribe = pubsub.subscribe('test', handler);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should allow multiple subscribers on same channel', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      pubsub.subscribe('test', handler1);
      pubsub.subscribe('test', handler2);

      expect(pubsub.getSubscriberCount('test')).toBe(2);
    });
  });

  describe('unsubscribe()', () => {
    it('should unsubscribe from channel', () => {
      const handler = jest.fn();

      pubsub.subscribe('test', handler);
      expect(pubsub.getSubscriberCount('test')).toBe(1);

      pubsub.unsubscribe('test', handler);
      expect(pubsub.getSubscriberCount('test')).toBe(0);
    });

    it('should remove channel if no subscribers left', () => {
      const handler = jest.fn();

      pubsub.subscribe('test', handler);
      expect(pubsub.getChannelCount()).toBe(1);

      pubsub.unsubscribe('test', handler);
      expect(pubsub.getChannelCount()).toBe(0);
    });

    it('should handle unsubscribe from non-existing channel', () => {
      const handler = jest.fn();

      // Không throw error
      expect(() => {
        pubsub.unsubscribe('non-existing', handler);
      }).not.toThrow();
    });
  });

  describe('publish()', () => {
    it('should call handler when publish', () => {
      const handler = jest.fn();

      pubsub.subscribe('test', handler);
      pubsub.publish('test', { message: 'hello' });

      expect(handler).toHaveBeenCalledWith({ message: 'hello' });
    });

    it('should call all handlers on channel', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      pubsub.subscribe('test', handler1);
      pubsub.subscribe('test', handler2);
      pubsub.publish('test', 'data');

      expect(handler1).toHaveBeenCalledWith('data');
      expect(handler2).toHaveBeenCalledWith('data');
    });

    it('should not call handlers on other channels', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      pubsub.subscribe('channel-1', handler1);
      pubsub.subscribe('channel-2', handler2);
      pubsub.publish('channel-1', 'data');

      expect(handler1).toHaveBeenCalledWith('data');
      expect(handler2).not.toHaveBeenCalled();
    });

    it('should not throw if no subscribers', () => {
      expect(() => {
        pubsub.publish('non-existing', 'data');
      }).not.toThrow();
    });

    it('should handle handler errors gracefully', () => {
      const errorHandler = jest.fn(() => {
        throw new Error('Handler error');
      });
      const goodHandler = jest.fn();

      pubsub.subscribe('test', errorHandler);
      pubsub.subscribe('test', goodHandler);

      // Không throw error
      expect(() => {
        pubsub.publish('test', 'data');
      }).not.toThrow();

      // Handler tốt vẫn được gọi
      expect(goodHandler).toHaveBeenCalledWith('data');
    });
  });

  describe('getChannels()', () => {
    it('should return empty array when no channels', () => {
      const channels = pubsub.getChannels();

      expect(channels).toEqual([]);
    });

    it('should return all channels with subscriber count', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      pubsub.subscribe('channel-1', handler1);
      pubsub.subscribe('channel-2', handler1);
      pubsub.subscribe('channel-2', handler2);

      const channels = pubsub.getChannels();

      expect(channels).toHaveLength(2);
      expect(channels.find(c => c.name === 'channel-1')).toEqual({
        name: 'channel-1',
        subscriberCount: 1,
      });
      expect(channels.find(c => c.name === 'channel-2')).toEqual({
        name: 'channel-2',
        subscriberCount: 2,
      });
    });
  });

  describe('clear()', () => {
    it('should clear all channels', () => {
      pubsub.subscribe('test', jest.fn());
      pubsub.subscribe('test2', jest.fn());

      pubsub.clear();

      expect(pubsub.getChannelCount()).toBe(0);
    });
  });

  describe('Unsubscribe via returned function', () => {
    it('should unsubscribe when calling returned function', () => {
      const handler = jest.fn();

      const unsubscribe = pubsub.subscribe('test', handler);
      expect(pubsub.getSubscriberCount('test')).toBe(1);

      unsubscribe();
      expect(pubsub.getSubscriberCount('test')).toBe(0);
    });
  });
});
