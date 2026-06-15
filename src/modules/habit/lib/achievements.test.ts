import { describe, it, expect } from 'vitest';
import { MILESTONES, MILESTONE_META, unlockedFor, clearAchievements } from './achievements';

describe('achievement milestones', () => {
  it('milestones & meta are aligned', () => {
    expect(MILESTONES.length).toBe(MILESTONE_META.length);
    for (let i = 0; i < MILESTONES.length; i++) {
      expect(MILESTONE_META[i].milestone).toBe(MILESTONES[i]);
    }
  });

  it('starts empty for new habit', async () => {
    await clearAchievements();
    const u = await unlockedFor('test-habit');
    expect(u).toEqual([]);
  });
});
