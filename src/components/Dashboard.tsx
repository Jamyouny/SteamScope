import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Trophy,
  Gamepad2,
  Target,
  Layers3,
  Compass,
  BarChart3,
  Zap,
  Sparkles,
  CircleHelp,
  ArrowUpRight,
  Shuffle,
  Download,
  Loader2,
} from 'lucide-react';
import { analyze, portrait, genreDistribution } from '../../shared/analysis';
import type { Language, Library } from '../../shared/types';
import { Panel, GameImage } from './Ui';
const number = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 1 });
const colors = [
  '#8a7dff',
  '#6586ff',
  '#4eade2',
  '#4bd3b7',
  '#e2b467',
  '#ee7f9b',
];
export default function Dashboard({
  library,
  lang,
  animation,
  roast,
  setRoast,
  metadata,
  metadataLoading,
  metadataNote,
  onDiscover,
}: {
  library: Library;
  lang: Language;
  animation: boolean;
  roast: boolean;
  setRoast: (value: boolean) => void;
  metadata: () => Promise<void>;
  metadataLoading: boolean;
  metadataNote: string;
  onDiscover: () => void;
}) {
  const t = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const a = analyze(library.games),
    p = portrait(library.games, lang),
    genres = genreDistribution(library.games);
  return (
    <>
      <div className="metrics">
        {[
          [
            Layers3,
            t('游戏总数', 'Games owned'),
            number(a.count),
            t('款游戏，等你探索', 'worlds in your collection'),
          ],
          [
            Gamepad2,
            t('总游玩时长', 'Total playtime'),
            number(a.total),
            t('小时的冒险旅程', 'hours of adventure'),
          ],
          [
            Target,
            t('已探索游戏', 'Games played'),
            number(a.played),
            `${Math.round(a.progress)}% ${t('探索进度', 'of your library')}`,
          ],
          [
            Trophy,
            t('时长中位数', 'Median playtime'),
            number(a.median),
            `${t('平均', 'Average')} ${number(a.average)} h`,
          ],
        ].map(([Icon, label, value, detail], i) => (
          <motion.div
            key={i}
            initial={animation ? { opacity: 0, y: 15 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="metric panel"
          >
            <div className="metric-label">
              <span>{String(label)}</span>
              {typeof Icon !== 'string' && <Icon size={18} />}
            </div>
            <strong>
              {String(value)}
              {(i === 1 || i === 3) && <small>h</small>}
            </strong>
            <p>{String(detail)}</p>
          </motion.div>
        ))}
      </div>
      {!a.count && (
        <Panel className="empty-state">
          <Gamepad2 />
          <h3>{t('这里还没有可读取的游戏', 'No readable games yet')}</h3>
          <p>
            {t(
              'Steam 返回了空游戏库。免费游戏仅在已游玩时计入官方游戏库接口。',
              'Steam returned an empty library. Free games are included by the API when played.',
            )}
          </p>
        </Panel>
      )}
      <div className="dashboard-grid">
        <Panel className="top-games">
          <div className="panel-heading">
            <div>
              <h2>
                <Trophy size={18} />
                {t('时间都去哪了', 'Where the hours go')}
              </h2>
              <p>{t('游玩时长 TOP 10', 'Your top 10 by playtime')}</p>
            </div>
            <span className="subtle-tag">{t('累计时长', 'ALL TIME')}</span>
          </div>
          <div className="ranking">
            {a.top.map((game, i) => (
              <div className="ranking-row" key={game.appid}>
                <span className={`rank ${i < 3 ? 'rank-top' : ''}`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <GameImage game={game} />
                <div className="ranking-info">
                  <a
                    href={`https://store.steampowered.com/app/${game.appid}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {game.name}
                  </a>
                  <div className="rank-track">
                    <span
                      style={{
                        width: `${a.top[0].playtime_forever ? (game.playtime_forever / a.top[0].playtime_forever) * 100 : 0}%`,
                        background:
                          i < 3
                            ? 'linear-gradient(90deg,#7060e8,#9c8eff)'
                            : '#515776',
                      }}
                    />
                  </div>
                </div>
                <span className="rank-hours">
                  {number(game.playtime_forever / 60)}
                  <small>h</small>
                </span>
              </div>
            ))}
          </div>
        </Panel>
        <div className="dashboard-side">
          <Panel>
            <div className="panel-heading">
              <div>
                <h2>
                  <BarChart3 size={18} />
                  {t('游玩时长分布', 'Playtime distribution')}
                </h2>
                <p>{t('你的游戏，处在哪个阶段？', 'How far have you gone?')}</p>
              </div>
            </div>
            <div className="chart">
              <ResponsiveContainer width="100%" height={215}>
                <BarChart
                  data={a.distribution}
                  margin={{ top: 10, right: 5, left: -25, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--line)"
                    strokeDasharray="3 5"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: 'var(--muted)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: 'var(--muted)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--hover)' }}
                    contentStyle={{
                      background: 'var(--surface)',
                      border: '1px solid var(--line)',
                      borderRadius: 10,
                      color: 'var(--text)',
                    }}
                    formatter={(v) => [v, t('款游戏', 'games')]}
                    labelFormatter={(v) => `${v} ${t('小时', 'hours')}`}
                  />
                  <Bar
                    dataKey="count"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={40}
                    isAnimationActive={animation}
                  >
                    {a.distribution.map((_, i) => (
                      <Cell key={i} fill={colors[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="chart-caption">
                {t(
                  '0 / (0,1) / [1,10) / [10,50) / [50,100] / >100 小时',
                  '0 / (0,1) / [1,10) / [10,50) / [50,100] / >100 hours',
                )}
              </div>
            </div>
          </Panel>
          <Panel className="exploration">
            <div>
              <h2>
                <Compass size={18} />
                {t('游戏库探索进度', 'Library exploration')}
              </h2>
              <p>{t('至少启动过一次的游戏', 'Games with recorded playtime')}</p>
              <strong>
                {Math.round(a.progress)}
                <small>%</small>
              </strong>
              <span>
                {a.played} / {a.count} {t('款游戏已探索', 'games explored')}
              </span>
            </div>
            <div
              className="progress-ring"
              style={{
                background: `conic-gradient(#9b8bff ${a.progress}%,var(--line) 0)`,
              }}
            >
              <div>
                <Gamepad2 size={32} />
              </div>
            </div>
          </Panel>
        </div>
      </div>
      <div className="lower-grid">
        <Panel className="backlog">
          <div className="panel-heading">
            <div>
              <h2>
                <Layers3 size={18} />
                {t('游戏库吃灰报告', 'The backlog report')}
              </h2>
              <p>GAME BACKLOG ANALYSIS</p>
            </div>
            <button
              className={`mode-toggle ${roast ? 'roast-on' : ''}`}
              onClick={() => setRoast(!roast)}
              aria-pressed={roast}
            >
              <Zap size={14} />
              {roast
                ? t('毒舌模式', 'Roast mode')
                : t('正常模式', 'Normal mode')}
            </button>
          </div>
          <div className="backlog-big">
            <strong>
              {a.unplayed}
              <span>{t('款', 'games')}</span>
            </strong>
            <span>
              {t('还没启动过', 'never launched')} ·{' '}
              {a.count ? Math.round((a.unplayed / a.count) * 100) : 0}%
            </span>
          </div>
          <p className="backlog-copy">
            {roast
              ? a.unplayed / a.count > 0.5
                ? t(
                    '你的游戏库比空闲时间更富有。买游戏很勤快，启动按钮快生锈了。',
                    'Your library is richer than your free time. The buy button works harder than the play button.',
                  )
                : a.top3Share > 0.65
                  ? t(
                      '买了这么多游戏，最后还是住在那三款里。',
                      'So many games, and you still live in the same three.',
                    )
                  : t(
                      '看来你是真的在玩游戏，不只是给硬盘装修。',
                      'You actually play your games. Your hard drive is impressed.',
                    )
              : t(
                  `你拥有 ${a.count} 款游戏，其中 ${a.unplayed} 款还没有启动过。下一场冒险，也许就在其中。`,
                  `You own ${a.count} games. ${a.unplayed} are still waiting for their first adventure.`,
                )}
          </p>
          <div className="backlog-footer">
            <span>
              {t('不足 1 小时', 'Under 1 hour')}
              <strong>{a.under1}</strong>
            </span>
            <span>
              {t('超过 100 小时', 'Over 100 hours')}
              <strong>{a.over100}</strong>
            </span>
          </div>
        </Panel>
        <Panel className="portrait">
          <div className="panel-heading">
            <div>
              <h2>
                <Sparkles size={18} />
                {t('你的玩家画像', 'Your player personality')}
              </h2>
              <p>PLAYER DNA</p>
            </div>
            <span className="portrait-icon">
              <Sparkles size={25} />
            </span>
          </div>
          <span className="portrait-label">
            {t('你的专属称号', 'YOUR TITLE')}
          </span>
          <h3>{p.title}</h3>
          <p>{p.description}</p>
          <div className="portrait-stats">
            <span>
              {t('前三游戏时长占比', 'Top 3 time share')}
              <b>{Math.round(a.top3Share * 100)}%</b>
            </span>
            <span>
              {t('百小时游戏', '100+ hour games')}
              <b>{a.over100}</b>
            </span>
          </div>
          <details>
            <summary>
              <CircleHelp size={14} />
              {t('这个画像如何计算？', 'How is this calculated?')}
            </summary>
            <p>
              {t(
                '按以下顺序，匹配第一个成立的规则；仅是趣味分类。',
                'The first matching rule wins, in this order. This is a playful classification.',
              )}
            </p>
            <ol>
              {p.candidates.map((c) => (
                <li key={c.en} className={c.rule === p.rule ? 'matched' : ''}>
                  {lang === 'zh' ? c.zh : c.en}: {c.localizedRule}
                </li>
              ))}
            </ol>
          </details>
        </Panel>
      </div>
      <div className="lower-grid">
        <Panel>
          <div className="panel-heading">
            <div>
              <h2>
                <Gamepad2 size={18} />
                {t('最近，沉迷于', 'Recently in rotation')}
              </h2>
              <p>
                {t('最近两周游玩的游戏', 'Games played in the last two weeks')}
              </p>
            </div>
            <span className="subtle-tag">14 DAYS</span>
          </div>
          <div className="recent-list">
            {library.recent.length ? (
              library.recent.map((game) => (
                <a
                  className="recent-game"
                  key={game.appid}
                  href={`https://store.steampowered.com/app/${game.appid}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <GameImage game={game} />
                  <div>
                    <h3>{game.name}</h3>
                    <span>
                      {number((game.playtime_2weeks ?? 0) / 60)} h{' '}
                      {t('最近两周', 'in 2 weeks')}
                    </span>
                  </div>
                  <ArrowUpRight size={15} />
                </a>
              ))
            ) : (
              <div className="empty-state">
                {library.warnings.includes('RECENT_UNAVAILABLE')
                  ? t('最近游玩数据不可用', 'Recent activity unavailable')
                  : t(
                      '最近两周没有记录到游玩时间',
                      'No recorded activity in the last two weeks',
                    )}
              </div>
            )}
          </div>
        </Panel>
        <Panel>
          <div className="panel-heading">
            <div>
              <h2>
                <Target size={18} />
                {t('游戏类型偏好', 'Genre preferences')}
              </h2>
              <p>
                {library.demo
                  ? t('演示分类数据', 'Sample genre labels')
                  : t(
                      'Steam 商店元数据 · 多标签计数',
                      'Steam Store metadata · multiple genres per game',
                    )}
              </p>
            </div>
          </div>
          {genres &&
          genres.known >= Math.min(10, a.count) &&
          genres.coverage >= 0.6 &&
          a.count > 0 ? (
            <div className="genre-list">
              {genres.data.slice(0, 6).map((g, i) => (
                <div key={g.name}>
                  <span>
                    {g.name}
                    <b>{g.value}</b>
                  </span>
                  <div className="progress-track">
                    <span
                      style={{
                        width: `${(g.value / genres.known) * 100}%`,
                        background: colors[i],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="genre-empty">
              <Target size={30} />
              <h3>
                {t('准确的数据，才有意义', 'Good insights need good data')}
              </h3>
              <p>
                {t(
                  '游戏库接口不含分类。覆盖不足时，我们不会生成类型偏好结论。',
                  'The library API has no genres. We do not infer preferences with insufficient coverage.',
                )}
              </p>
            </div>
          )}
          <div className="genre-source">
            {t('分类覆盖', 'Genre coverage')}: {genres?.known ?? 0}/{a.count} ·{' '}
            {Math.round((genres?.coverage ?? 0) * 100)}%
            {!library.demo && (
              <button
                className="secondary small"
                disabled={metadataLoading || !a.count}
                onClick={metadata}
              >
                {metadataLoading ? (
                  <Loader2 size={14} className="spin" />
                ) : (
                  <Download size={14} />
                )}{' '}
                {t('补充分类数据', 'Load genres')}
              </button>
            )}
          </div>
          {!library.demo && (
            <p className="chart-caption">
              {t(
                '按接口顺序最多补充 60 款；覆盖达到 60% 且至少 10 款有分类才展示。商店元数据接口为补充来源，可能不可用。',
                'Loads up to 60 games in API order. Requires ≥60% coverage and ≥10 classified games (or all games for smaller libraries). The supplemental Store endpoint may be unavailable.',
              )}
            </p>
          )}
          {metadataNote && (
            <p role="status" className="chart-caption">
              {metadataNote === 'failed'
                ? t(
                    '部分请求失败，已保留成功获取的分类。',
                    'Some requests failed; successful metadata was retained.',
                  )
                : t(
                    '补充完成；无分类或请求失败的游戏不计入偏好统计。',
                    'Finished. Unclassified or failed games are excluded.',
                  )}
            </p>
          )}
        </Panel>
      </div>
      <Panel className="next-adventure">
        <div>
          <Shuffle size={28} />
          <div>
            <h3>
              {t(
                '你的下一场冒险，可能就在吃灰区。',
                'Your next adventure might be in your backlog.',
              )}
            </h3>
            <p>
              {t(
                '不如交给运气，今天就玩一款。',
                'Let chance pick something for today.',
              )}
            </p>
          </div>
        </div>
        <button className="primary" onClick={() => onDiscover()}>
          <Shuffle size={16} />
          {t('今天玩什么', 'Pick my next game')}
        </button>
      </Panel>
    </>
  );
}
