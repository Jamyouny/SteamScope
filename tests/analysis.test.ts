import { describe, it, expect } from 'vitest';
import {
  analyze,
  filterGames,
  genreDistribution,
  pickGame,
  portrait,
} from '../shared/analysis';
import type { Game } from '../shared/types';
const games = (hours: number[]): Game[] =>
  hours.map((h, i) => ({
    appid: i + 1,
    name: `Game ${i}`,
    playtime_forever: h * 60,
  }));
describe('library statistics', () => {
  it('handles empty libraries without NaN', () => {
    const a = analyze([]);
    expect(a).toMatchObject({
      count: 0,
      total: 0,
      median: 0,
      average: 0,
      progress: 0,
      top3Share: 0,
    });
    expect(a.favorite).toBeUndefined();
  });
  it('sums integer minutes before converting to avoid threshold drift', () => {
    const entries = Array.from({ length: 60 }, (_, i) => ({
      appid: i + 1,
      name: `Game ${i}`,
      playtime_forever: 100,
    }));
    expect(analyze(entries).total).toBe(100);
    expect(analyze(entries).top3Share).toBe(0.05);
  });
  it('assigns every threshold to exactly one bucket', () => {
    const a = analyze(games([0, 0.5, 1, 9.99, 10, 49.99, 50, 100, 100.01]));
    expect(a.distribution.map((b) => b.count)).toEqual([1, 1, 2, 2, 2, 1]);
    expect(a.played).toBe(8);
    expect(a.under1).toBe(1);
    expect(a.over100).toBe(1);
  });
  it('calculates median, average and hours from minutes', () => {
    expect(analyze(games([0, 1, 3, 8]))).toMatchObject({
      median: 2,
      average: 3,
      total: 12,
      progress: 75,
    });
    expect(analyze(games([0, 1, 8])).median).toBe(1);
  });
  it('sorts rankings without mutating original', () => {
    const input = games([1, 8, 3]);
    const a = analyze(input);
    expect(a.top.map((g) => g.playtime_forever)).toEqual([480, 180, 60]);
    expect(input[0].playtime_forever).toBe(60);
    expect(a.favorite?.appid).toBe(2);
  });
  it('never names a favorite when no playtime exists', () => {
    expect(analyze(games([0, 0])).favorite).toBeUndefined();
  });
});
describe('random pool', () => {
  it('filters unplayed, short and inclusive ranges', () => {
    const input = games([0, 1, 2, 10]);
    expect(filterGames(input, 'unplayed')).toHaveLength(1);
    expect(filterGames(input, 'short')).toHaveLength(2);
    expect(filterGames(input, 'range', 1, 2)).toHaveLength(2);
    expect(filterGames(input, 'all')).toHaveLength(4);
  });
  it('handles empty pools and deterministic random endpoints', () => {
    expect(pickGame([])).toBeUndefined();
    const input = games([1, 2]);
    expect(pickGame(input, () => 0)).toBe(input[0]);
    expect(pickGame(input, () => 0.9999)).toBe(input[1]);
  });
});
describe('transparent portraits', () => {
  it('matches collector before other rules', () => {
    expect(portrait(games([200, ...Array(30).fill(0)]), 'en').title).toBe(
      'The Collector',
    );
  });
  it('matches loyalist, veteran, explorer and casual', () => {
    expect(
      portrait(games([100, 100, 100, ...Array(20).fill(1)]), 'en').title,
    ).toBe('The Loyalist');
    expect(portrait(games(Array(6).fill(110)), 'en').title).toBe('The Veteran');
    expect(portrait(games(Array(40).fill(10)), 'en').title).toBe(
      'The Explorer',
    );
    expect(portrait(games([1, 2]), 'en').title).toBe('The Casual');
  });
  it('uses a fallback without fabricating personality traits', () => {
    expect(portrait(games(Array(10).fill(20)), 'en').title).toBe(
      'The Free Spirit',
    );
  });
});
describe('genre coverage', () => {
  it('counts only known metadata and deduplicates labels', () => {
    const input = games([1, 2, 3]);
    input[0].genres = ['RPG', 'RPG', 'Action'];
    input[1].genres = ['RPG'];
    const result = genreDistribution(input);
    expect(result.known).toBe(2);
    expect(result.coverage).toBe(2 / 3);
    expect(result.data).toEqual([
      { name: 'RPG', value: 2 },
      { name: 'Action', value: 1 },
    ]);
  });
});
