import type { Game, Language } from './types';
export const buckets = ['0', '<1', '1–10', '10–50', '50–100', '100+'];
export function analyze(games: Game[]) {
  const sorted = [...games].sort(
    (a, b) => b.playtime_forever - a.playtime_forever,
  );
  const times = games.map((g) => g.playtime_forever / 60).sort((a, b) => a - b);
  const totalMinutes = games.reduce(
    (sum, game) => sum + game.playtime_forever,
    0,
  );
  const total = totalMinutes / 60,
    n = times.length;
  const distribution = buckets.map((label) => ({ label, count: 0 }));
  for (const h of times)
    distribution[
      h === 0 ? 0 : h < 1 ? 1 : h < 10 ? 2 : h < 50 ? 3 : h <= 100 ? 4 : 5
    ].count++;
  const unplayed = distribution[0].count,
    played = n - unplayed;
  const top3Share = total
    ? sorted.slice(0, 3).reduce((s, g) => s + g.playtime_forever, 0) /
      totalMinutes
    : 0;
  return {
    count: n,
    total,
    played,
    unplayed,
    under1: distribution[1].count,
    over100: distribution[5].count,
    average: n ? total / n : 0,
    median: n
      ? n % 2
        ? times[Math.floor(n / 2)]
        : (times[n / 2 - 1] + times[n / 2]) / 2
      : 0,
    progress: n ? (played / n) * 100 : 0,
    top: sorted.slice(0, 10),
    favorite: sorted.find((g) => g.playtime_forever > 0),
    distribution,
    top3Share,
  };
}
export function portrait(games: Game[], lang: Language) {
  const a = analyze(games);
  const candidates = [
    {
      match: a.count >= 30 && a.progress < 40,
      zh: '游戏收藏家',
      en: 'The Collector',
      rule: '≥30 games & <40% played',
    },
    {
      match: a.total >= 100 && a.top3Share >= 0.65,
      zh: '专一型玩家',
      en: 'The Loyalist',
      rule: '≥100 hours & top 3 ≥65% of time',
    },
    {
      match: a.over100 >= 5,
      zh: '硬核玩家',
      en: 'The Veteran',
      rule: '≥5 games with >100 hours',
    },
    {
      match: a.count >= 30 && a.progress >= 60 && a.top3Share < 0.5,
      zh: '探索型玩家',
      en: 'The Explorer',
      rule: '≥30 games, ≥60% played & top 3 <50%',
    },
    {
      match: a.total < 100,
      zh: '休闲玩家',
      en: 'The Casual',
      rule: '<100 total hours',
    },
    {
      match: true,
      zh: '自在型玩家',
      en: 'The Free Spirit',
      rule: 'No specialized rule matched',
    },
  ];
  const found = candidates.find((c) => c.match)!;
  const descriptions: Record<string, [string, string]> = {
    'The Collector': [
      '你的下一场冒险，早已躺在游戏库里。',
      'Your next adventure is already in your library.',
    ],
    'The Loyalist': [
      '找到热爱，然后玩得足够深入。',
      'You find your favorites and go all in.',
    ],
    'The Veteran': [
      '上百小时只是起点，你总能发现更多。',
      'A hundred hours is just the beginning.',
    ],
    'The Explorer': [
      '不止一个世界值得探索，你一直在出发。',
      'There is always another world to explore.',
    ],
    'The Casual': [
      '在生活的间隙，享受属于自己的游戏时间。',
      'A little escape, at your own pace.',
    ],
    'The Free Spirit': [
      '没有固定路线，按自己的节奏玩就好。',
      'No fixed path. Play at your own pace.',
    ],
  };
  const chineseRules: Record<string, string> = {
    'The Collector': '≥30 款游戏，游玩比例 <40%',
    'The Loyalist': '≥100 小时，前三款占总时长 ≥65%',
    'The Veteran': '≥5 款游戏累计游玩超过 100 小时',
    'The Explorer': '≥30 款，游玩比例 ≥60%，前三款时长占比 <50%',
    'The Casual': '总游玩时间 <100 小时',
    'The Free Spirit': '以上规则均未匹配',
  };
  return {
    title: lang === 'zh' ? found.zh : found.en,
    description: descriptions[found.en][lang === 'zh' ? 0 : 1],
    rule: found.rule,
    candidates: candidates.map((c) => ({
      ...c,
      localizedRule: lang === 'zh' ? chineseRules[c.en] : c.rule,
    })),
  };
}
export type Filter = 'unplayed' | 'short' | 'all' | 'range';
export function filterGames(
  games: Game[],
  filter: Filter,
  min = 0,
  max = Infinity,
) {
  return games.filter((g) => {
    const h = g.playtime_forever / 60;
    return (
      filter === 'all' ||
      (filter === 'unplayed' && h === 0) ||
      (filter === 'short' && h < 2) ||
      (filter === 'range' && h >= min && h <= max)
    );
  });
}
export function pickGame(
  games: Game[],
  random = Math.random,
): Game | undefined {
  if (!games.length) return undefined;
  return games[
    Math.min(games.length - 1, Math.max(0, Math.floor(random() * games.length)))
  ];
}
export function genreDistribution(games: Game[]) {
  const known = games.filter((g) => g.genres?.length);
  const counts = new Map<string, number>();
  for (const g of known)
    for (const genre of new Set(g.genres))
      counts.set(genre, (counts.get(genre) ?? 0) + 1);
  return {
    known: known.length,
    coverage: games.length ? known.length / games.length : 0,
    data: [...counts]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
  };
}
