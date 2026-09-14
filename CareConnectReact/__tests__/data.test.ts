/**
 * Unit tests for shared data helpers (src/constants/data.ts).
 */
import {
  contacts,
  meds,
  threads,
  buildSlots,
  contactById,
  threadById,
} from '../src/constants/data';

describe('contactById', () => {
  it('returns the contact matching the given id', () => {
    expect(contactById(1)).toEqual(contacts[0]);
    expect(contactById(2)).toEqual(contacts[1]);
    expect(contactById(3)).toEqual(contacts[2]);
  });

  it('returns undefined when the id does not exist', () => {
    expect(contactById(999)).toBeUndefined();
  });
});

describe('threadById', () => {
  it('returns the thread matching the given id', () => {
    expect(threadById(1)).toEqual(threads[0]);
  });

  it('returns undefined when the id does not exist', () => {
    expect(threadById(999)).toBeUndefined();
  });
});

describe('buildSlots', () => {
  it('creates one slot per (med, time) pair', () => {
    const slots = buildSlots();
    const expectedCount = meds.reduce((sum, m) => sum + m.times.length, 0);
    expect(slots).toHaveLength(expectedCount);
  });

  it('gives every slot a unique key derived from med id and index', () => {
    const slots = buildSlots();
    const keys = slots.map(s => s.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(slots[0].key).toBe('1-0');
    expect(slots[1].key).toBe('1-1');
  });

  it('preserves the medication reference and time on each slot', () => {
    const slots = buildSlots();
    const first = slots[0];
    expect(first.med).toBe(meds[0]);
    expect(first.time).toBe(meds[0].times[0]);
  });
});

describe('threads static data', () => {
  it('every thread points at a contact that exists', () => {
    threads.forEach(thread => {
      expect(contactById(thread.contactId)).toBeDefined();
    });
  });

  it('every thread has at least one message', () => {
    threads.forEach(thread => {
      expect(thread.messages.length).toBeGreaterThan(0);
    });
  });
});
