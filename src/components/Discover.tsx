import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Shuffle, Check, Loader2, ExternalLink } from 'lucide-react';
import { filterGames, pickGame, type Filter } from '../../shared/analysis';
import type { Game, Language, Library } from '../../shared/types';
import { GameImage, Panel } from './Ui';
const number = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 1 });
export default function Discover({
  library,
  lang,
  animation,
}: {
  library: Library;
  lang: Language;
  animation: boolean;
}) {
  const t = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const [filter, setFilter] = useState<Filter>('unplayed'),
    [min, setMin] = useState(0),
    [max, setMax] = useState(10),
    [picked, setPicked] = useState<Game>(),
    [spinning, setSpinning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );
  const validRange =
    Number.isFinite(min) && Number.isFinite(max) && min >= 0 && max >= min;
  const eligible = filterGames(library.games, filter, min, max);
  const draw = () => {
    if (!eligible.length || spinning || (filter === 'range' && !validRange))
      return;
    const result = pickGame(eligible)!;
    if (
      !animation ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setPicked(result);
      return;
    }
    setSpinning(true);
    let step = 0;
    timer.current = setInterval(() => {
      setPicked(pickGame(eligible));
      if (++step >= 12) {
        if (timer.current) clearInterval(timer.current);
        setPicked(result);
        setSpinning(false);
      }
    }, 100);
  };
  return (
    <div className="discover-layout">
      <Panel className="picker-settings">
        <h2>
          <Shuffle size={19} />
          {t('选择冒险范围', 'Choose your adventure pool')}
        </h2>
        <p>
          {t('不用再盯着游戏库发呆了。', 'No more staring at your library.')}
        </p>
        <fieldset disabled={spinning}>
          <legend className="sr-only">{t('抽取范围', 'Random pool')}</legend>
          {(
            [
              [
                'unplayed',
                t('从未玩过', 'Never played'),
                t('给吃灰的游戏一个机会', 'Give the backlog a chance'),
              ],
              [
                'short',
                t('不足 2 小时', 'Under 2 hours'),
                t(
                  '重新认识那些匆匆错过的游戏',
                  'Revisit something you barely tried',
                ),
              ],
              [
                'all',
                t('全部游戏随机', 'All games'),
                t('每一款，都有可能', 'Anything could happen'),
              ],
              [
                'range',
                t('自定义时长范围', 'Custom playtime range'),
                t('按累计游玩小时筛选', 'Filter by lifetime hours'),
              ],
            ] as const
          ).map(([key, label, desc]) => (
            <label
              className={`pool-option ${filter === key ? 'selected' : ''}`}
              key={key}
            >
              <input
                type="radio"
                name="pool"
                value={key}
                checked={filter === key}
                onChange={() => {
                  setFilter(key);
                  setPicked(undefined);
                }}
              />
              <span>
                <b>{label}</b>
                <small>{desc}</small>
              </span>
              {filter === key && <Check size={17} />}
            </label>
          ))}
          {filter === 'range' && (
            <div className="range-fields">
              <label>
                {t('最少小时', 'Min hours')}
                <input
                  type="number"
                  min="0"
                  value={min}
                  onChange={(e) => setMin(e.target.valueAsNumber)}
                />
              </label>
              <span>—</span>
              <label>
                {t('最多小时', 'Max hours')}
                <input
                  type="number"
                  min="0"
                  value={max}
                  onChange={(e) => setMax(e.target.valueAsNumber)}
                />
              </label>
            </div>
          )}
        </fieldset>
        <div className="pool-count">
          {validRange || filter !== 'range' ? eligible.length : 0}{' '}
          {t('款游戏可以抽取', 'games in the pool')}
        </div>
        {filter === 'range' && !validRange && (
          <p className="error-message">
            {t(
              '请输入有效范围，最大值需大于等于最小值。',
              'Enter a valid range with max ≥ min.',
            )}
          </p>
        )}
      </Panel>
      <Panel className={`slot-machine ${spinning ? 'spinning' : ''}`}>
        <div className="eyebrow">
          {spinning
            ? t('命运正在加载…', 'DESTINY IS LOADING…')
            : t('把选择交给一点运气', 'LEAVE A LITTLE TO CHANCE')}
        </div>
        <div className="slot-frame">
          {picked ? (
            <motion.div
              key={picked.appid}
              initial={animation ? { opacity: 0.6, y: 12 } : false}
              animate={{ opacity: 1, y: 0 }}
            >
              <GameImage game={picked} />
            </motion.div>
          ) : (
            <div className="slot-placeholder">
              <Shuffle size={60} />
              <span>YOUR NEXT ADVENTURE</span>
            </div>
          )}
        </div>
        <div className="slot-result">
          <h2>
            {picked?.name ?? t('你的下一款游戏是…', 'Your next game is…')}
          </h2>
          <p>
            {picked
              ? `${number(picked.playtime_forever / 60)} h · ${picked.playtime_forever === 0 ? t('尚未开启的冒险', 'A brand new adventure') : t('累计游玩时间', 'lifetime playtime')}`
              : t(
                  '点击抽取，发现今天的新冒险。',
                  'Hit shuffle and find today’s adventure.',
                )}
          </p>
        </div>
        <button
          className="primary draw-button"
          onClick={draw}
          disabled={
            spinning || !eligible.length || (filter === 'range' && !validRange)
          }
        >
          {spinning ? (
            <Loader2 className="spin" size={19} />
          ) : (
            <Shuffle size={19} />
          )}{' '}
          {spinning
            ? t('抽取中…', 'Shuffling…')
            : picked
              ? t('重新抽取', 'Shuffle again')
              : t('抽取一款游戏', 'Pick a game')}
        </button>
        {!eligible.length && (
          <p className="warning">
            {t(
              '当前范围没有游戏，试试其他筛选条件。',
              'No games match. Try another pool.',
            )}
          </p>
        )}
        {picked && !spinning && (
          <a
            className="store-link"
            href={`https://store.steampowered.com/app/${picked.appid}`}
            target="_blank"
            rel="noreferrer"
          >
            {t('前往 Steam 商店', 'View on Steam')}
            <ExternalLink size={15} />
          </a>
        )}
      </Panel>
    </div>
  );
}
