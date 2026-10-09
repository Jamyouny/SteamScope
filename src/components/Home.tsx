import type { ReactNode } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import {
  CircleHelp,
  ChevronRight,
  Check,
  Gamepad2,
  BarChart3,
  Sparkles,
  Shuffle,
  ArrowUpRight,
} from 'lucide-react';
import { analyze } from '../../shared/analysis';
import type { Language, Library } from '../../shared/types';
import { GameImage } from './Ui';
import demoData from '../data/demo.json';
import SteamIdGuide from './SteamIdGuide';
const demo = demoData as Library;
export default function Home({
  lang,
  animation,
  searchForm,
  error,
  errorText,
  tryDemo,
}: {
  lang: Language;
  animation: boolean;
  searchForm: () => ReactNode;
  error: string;
  errorText: (code: string) => string;
  tryDemo: () => void;
}) {
  const t = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="tiny-dot" />{' '}
            {t('为热爱游戏的你而生', 'MADE FOR THE PLAYER IN YOU')}
          </div>
          <h1>
            {t('你的游戏库，', 'Your library.')}
            <br />
            <span>{t('不止一个数字。', 'A whole new story.')}</span>
          </h1>
          <p>
            {t(
              '看看时间都去了哪里，发现你的玩家人格，',
              'See where your time goes. Find your player personality.',
            )}
            <br className="desktop-break" />
            {t(
              '再从吃灰的游戏里，抽一场新的冒险。',
              'Turn your backlog into your next adventure.',
            )}
          </p>
          {searchForm()}
          <div className="hero-help">
            <span>
              <CircleHelp size={14} />
              {t(
                '支持 SteamID64、个人资料与自定义链接',
                'SteamID64, profile URLs & custom URLs',
              )}
            </span>
            <button onClick={tryDemo}>
              {t('先体验 Demo', 'Try the demo')}
              <ChevronRight size={16} />
            </button>
          </div>
          <SteamIdGuide lang={lang} />
          {error && (
            <div role="alert" className="error-message">
              {errorText(error)}
            </div>
          )}
          <div className="hero-trust">
            <span>
              <Check size={14} />
              {t('无需登录', 'No sign-in')}
            </span>
            <span>
              <Check size={14} />
              {t('官方 Steam 数据', 'Official Steam data')}
            </span>
            <span>
              <Check size={14} />
              {t('免费 · 开源', 'Free & open source')}
            </span>
          </div>
        </div>
        <div
          className="hero-visual"
          aria-label={t('演示数据预览', 'Sample data preview')}
        >
          <div className="visual-glow" />
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="game-tile tile-one">
            <GameImage game={demo.games[3]} />
            <span>ELDEN RING</span>
          </div>
          <div className="game-tile tile-two">
            <GameImage game={demo.games[2]} />
            <span>BALDUR’S GATE 3</span>
          </div>
          <div className="game-tile tile-three">
            <GameImage game={demo.games[8]} />
            <span>HADES</span>
          </div>
          <div className="floating-stat">
            <span className="stat-icon">
              <Gamepad2 />
            </span>
            <div>
              <small>
                {t('下一个冒险，已经在库里', 'Your next adventure awaits')}
              </small>
              <strong>{t('50 个世界等你探索', '50 worlds to explore')}</strong>
            </div>
          </div>
          <span className="visual-caption">DEMO LIBRARY / 50 GAMES</span>
        </div>
      </section>
      <section className="feature-strip">
        {[
          [
            BarChart3,
            t('看懂你的游戏时间', 'Understand your playtime'),
            t(
              '从排行榜到时长分布，一目了然。',
              'From rankings to patterns, all in one place.',
            ),
          ],
          [
            Sparkles,
            t('发现你的玩家人格', 'Meet your player personality'),
            t(
              '用真实数据，解锁专属称号。',
              'A personal title grounded in your data.',
            ),
          ],
          [
            Shuffle,
            t('告别选择困难', 'Skip the decision fatigue'),
            t(
              '让随机抽取，决定今天的冒险。',
              'Let a little chance choose your next adventure.',
            ),
          ],
        ].map(([Icon, title, desc], i) => (
          <div key={i}>
            <span className="feature-icon">
              {typeof Icon !== 'string' && <Icon size={22} />}
            </span>
            <h3>{String(title)}</h3>
            <p>{String(desc)}</p>
          </div>
        ))}
      </section>
      <section className="home-preview">
        <div className="section-heading">
          <div>
            <div className="eyebrow">YOUR LIBRARY, UNCOVERED</div>
            <h2>
              {t('换个角度，看看你的游戏库', 'A fresh look at your library')}
            </h2>
          </div>
          <button className="secondary" onClick={tryDemo}>
            {t('探索示例报告', 'Explore sample report')}
            <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="preview-window">
          <div className="window-bar">
            <i />
            <i />
            <i />
            <span>SteamScope / {t('演示数据', 'Sample data')}</span>
          </div>
          <div className="preview-content">
            <div>
              <small>{t('游戏总数', 'GAMES OWNED')}</small>
              <strong>
                50<span>{t('款', 'games')}</span>
              </strong>
              <p>{t('每一个，都是一个新的世界', 'Each one, a new world')}</p>
            </div>
            <div>
              <small>{t('游戏库探索进度', 'LIBRARY EXPLORED')}</small>
              <strong>
                60<span>%</span>
              </strong>
              <div className="progress-track">
                <span style={{ width: '60%' }} />
              </div>
            </div>
            <div className="preview-chart">
              <ResponsiveContainer width="100%" height={130}>
                <AreaChart data={analyze(demo.games).top.slice().reverse()}>
                  <defs>
                    <linearGradient
                      id="previewGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0" stopColor="#887aff" stopOpacity={0.4} />
                      <stop offset="1" stopColor="#887aff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="playtime_forever"
                    stroke="#9687ff"
                    fill="url(#previewGradient)"
                    strokeWidth={2}
                    isAnimationActive={animation}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <span>{t('游玩时长 · 示例', 'Playtime · sample')}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
