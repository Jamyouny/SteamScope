import {
  useEffect,
  useRef,
  useState,
  lazy,
  Suspense,
  type FormEvent,
} from 'react';
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useReducedMotion,
} from 'framer-motion';
import {
  BarChart3,
  Check,
  Compass,
  ExternalLink,
  Globe2,
  Loader2,
  Moon,
  Search,
  Settings2,
  Share2,
  Shuffle,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import demoData from './data/demo.json';
import { type Language, type Library } from '../shared/types';
import { parseSteamInput } from '../shared/input';
import { fetchLibrary, request } from './lib/api';
import { usePreference } from './lib/preferences';
import { Panel } from './components/Ui';
import Home from './components/Home';
const Dashboard = lazy(() => import('./components/Dashboard'));
const Discover = lazy(() => import('./components/Discover'));
const Share = lazy(() => import('./components/Share'));
type Page = 'home' | 'dashboard' | 'discover' | 'share';
const demo = demoData as Library;
export default function App() {
  const [lang, setLang] = usePreference<Language>(
    'steamscope.language',
    'zh',
    (v): v is Language => v === 'zh' || v === 'en',
  );
  const [theme, setTheme] = usePreference<'dark' | 'light'>(
    'steamscope.theme',
    'dark',
    (v): v is 'dark' | 'light' => v === 'dark' || v === 'light',
  );
  const [animation, setAnimation] = usePreference<boolean>(
    'steamscope.animation',
    true,
    (v): v is boolean => typeof v === 'boolean',
  );
  const [roast, setRoast] = usePreference<boolean>(
    'steamscope.roast',
    false,
    (v): v is boolean => typeof v === 'boolean',
  );
  const reducedMotion = useReducedMotion();
  const shouldAnimate = animation && !reducedMotion;
  const [page, setPage] = useState<Page>('home');
  const [library, setLibrary] = useState<Library | null>(null);
  const [settings, setSettings] = useState(false),
    [input, setInput] = useState(''),
    [loading, setLoading] = useState(false),
    [error, setError] = useState('');
  const [notice, setNotice] = useState(''),
    [metadataLoading, setMetadataLoading] = useState(false),
    [metadataNote, setMetadataNote] = useState('');
  const queryVersion = useRef(0);
  const t = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.documentElement.dataset.animation = animation ? 'on' : 'off';
  }, [theme, lang, animation]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  const go = (next: Page) => {
    if (next !== 'home' && !library) {
      setNotice(
        t(
          '请先查询玩家，或体验 Demo。',
          'Look up a player or try the demo first.',
        ),
      );
      return;
    }
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const tryDemo = () => {
    queryVersion.current++;
    setLoading(false);
    setLibrary({ ...demo, fetchedAt: new Date().toISOString() });
    setError('');
    setMetadataNote('');
    setMetadataLoading(false);
    setPage('dashboard');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const errors: Record<string, [string, string]> = {
    INVALID_INPUT: [
      '请输入有效的 SteamID64 或 steamcommunity.com 个人资料链接。',
      'Enter a valid SteamID64 or steamcommunity.com profile URL.',
    ],
    API_AUTH_FAILED: [
      'Steam 拒绝了服务端 API 凭证，请检查 API Key 是否有效。',
      'Steam rejected the server API credentials. Check that the API key is valid.',
    ],
    NOT_CONFIGURED: [
      '服务端尚未配置 Steam API Key。你可以先体验 Demo；真实查询不会使用演示数据替代。',
      'The server has no Steam API key. Try the demo; real queries never fall back to sample data.',
    ],
    PRIVATE_PROFILE: [
      '该玩家的个人资料为私密。请将 Steam 个人资料设为公开。',
      'This profile is private. Set the Steam profile to public.',
    ],
    PLAYTIME_UNAVAILABLE: [
      '游戏条目或游玩时长无法读取，请检查游戏详情和时长隐私设置后重试。',
      'Game entries or playtime could not be read. Check Game details and playtime privacy settings.',
    ],
    PRIVATE_GAMES: [
      '无法读取游戏库：请将「游戏详情」设为公开，并关闭「始终对总游戏时间保密」。',
      'Game details are inaccessible. Make Game details public and disable Always keep my total playtime private.',
    ],
    PLAYER_NOT_FOUND: [
      '没有找到该玩家，请检查输入的 ID 或链接。',
      'Player not found. Check the ID or profile link.',
    ],
    TIMEOUT: [
      'Steam 响应超时，请稍后重试。',
      'Steam timed out. Please try again.',
    ],
    RATE_LIMIT: [
      '请求过于频繁，请一分钟后再试。',
      'Too many requests. Try again in one minute.',
    ],
    UPSTREAM_RATE_LIMIT: [
      'Steam 正在限流，请稍后重试。',
      'Steam is rate limiting requests. Try again later.',
    ],
    STEAM_UNAVAILABLE: [
      'Steam 服务暂时不可用，请稍后重试。',
      'Steam is temporarily unavailable. Please retry later.',
    ],
    NETWORK_ERROR: [
      '网络连接失败，请检查网络后重试。',
      'Network request failed. Check your connection.',
    ],
  };
  const errorText = (code: string) =>
    errors[code]?.[lang === 'zh' ? 0 : 1] ??
    t('请求失败，请重试。', 'Request failed. Please retry.');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const version = ++queryVersion.current;
    setError('');
    try {
      parseSteamInput(input);
      setLoading(true);
      const result = await fetchLibrary(input.trim());
      if (version !== queryVersion.current) return;
      setLibrary(result);
      setMetadataNote('');
      setMetadataLoading(false);
      setPage('dashboard');
    } catch (e) {
      if (version === queryVersion.current)
        setError(e instanceof Error ? e.message : 'STEAM_UNAVAILABLE');
    } finally {
      if (version === queryVersion.current) setLoading(false);
    }
  };
  const searchForm = (compact = false) => (
    <form
      onSubmit={submit}
      className={`search-form ${compact ? 'compact' : ''}`}
    >
      <Search size={20} />
      <input
        aria-label={t('Steam 玩家 ID 或链接', 'Steam player ID or URL')}
        placeholder={t(
          '输入 SteamID64 或个人资料链接',
          'Enter SteamID64 or profile URL',
        )}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        required
        maxLength={250}
      />
      <button className="primary" disabled={loading} type="submit">
        {loading ? (
          <Loader2 className="spin" size={18} />
        ) : (
          <Search size={18} />
        )}
        <span>{t('分析游戏库', 'Analyze library')}</span>
      </button>
    </form>
  );
  const metadata = async () => {
    if (!library || library.demo || metadataLoading) return;
    const current = library,
      version = queryVersion.current;
    setMetadataLoading(true);
    setMetadataNote('');
    const ids = current.games.slice(0, 60).map((g) => g.appid),
      found: Record<number, string[]> = {};
    let failed = false;
    try {
      for (let i = 0; i < ids.length; i += 3) {
        const result = await request<Record<number, string[]>>(
          `/api/metadata?ids=${ids.slice(i, i + 3).join(',')}`,
        );
        Object.assign(found, result);
        if (version !== queryVersion.current) return;
      }
    } catch {
      failed = true;
    } finally {
      if (version === queryVersion.current) {
        setLibrary({
          ...current,
          games: current.games.map((g) => ({
            ...g,
            genres: found[g.appid] ?? g.genres,
          })),
        });
        setMetadataNote(failed ? 'failed' : 'done');
        setMetadataLoading(false);
      }
    }
  };
  const warningText: Record<string, [string, string]> = {
    NO_RECORDED_PLAYTIME: [
      'Steam 返回的所有游玩时长均为零。如有实际游玩记录，请检查时长隐私设置；报告只反映 Steam 返回值。',
      'Steam returned zero playtime for every game. Check playtime privacy if you expect activity; this report reflects returned values only.',
    ],
    RECENT_UNAVAILABLE: [
      '最近两周数据暂时不可用。',
      'Recent activity is unavailable.',
    ],
    LEVEL_UNAVAILABLE: [
      'Steam 等级暂时不可用。',
      'Steam level is unavailable.',
    ],
    PARTIAL_LIBRARY: [
      'Steam 返回了不完整的游戏条目；统计只包含可读取的数据。',
      'Steam returned a partial library. Statistics use only readable entries.',
    ],
  };
  return (
    <MotionConfig reducedMotion={animation ? 'user' : 'always'}>
      <div className="app-shell antialiased selection:bg-violet-500/30">
        <header className="topbar">
          <button
            className="brand"
            onClick={() => go('home')}
            aria-label="SteamScope home"
          >
            <span className="brand-mark">
              <Target size={25} />
            </span>
            <span>
              Steam<span className="brand-light">Scope</span>
            </span>
          </button>
          <nav aria-label={t('主导航', 'Main navigation')}>
            {(
              [
                ['home', t('首页', 'Home'), Compass],
                ['dashboard', t('游戏库分析', 'Overview'), BarChart3],
                ['discover', t('今天玩什么', 'Discover'), Shuffle],
                ['share', t('分享卡片', 'Share card'), Share2],
              ] as const
            ).map(([key, label, Icon]) => (
              <button
                key={key}
                className={page === key ? 'active' : ''}
                onClick={() => go(key)}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
          <div className="header-actions">
            <button
              className="language-button"
              onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
              aria-label={t('切换英文', 'Switch to Chinese')}
            >
              <Globe2 size={17} />
              <span>{lang === 'zh' ? 'EN' : '中文'}</span>
            </button>
            <button
              className="icon-button"
              onClick={() => setSettings(true)}
              aria-label={t('设置', 'Settings')}
            >
              <Settings2 size={19} />
            </button>
          </div>
        </header>
        <main>
          <Suspense
            fallback={
              <div
                className="skeleton-grid"
                aria-label={t('加载中', 'Loading')}
              >
                {Array.from({ length: 6 }, (_, i) => (
                  <div className="skeleton" key={i} />
                ))}
              </div>
            }
          >
            {page === 'home' ? (
              <Home
                lang={lang}
                animation={shouldAnimate}
                searchForm={searchForm}
                error={error}
                errorText={errorText}
                tryDemo={tryDemo}
              />
            ) : loading ? (
              <div
                className="skeleton-grid"
                aria-label={t('加载中', 'Loading')}
              >
                {Array.from({ length: 6 }, (_, i) => (
                  <div className="skeleton" key={i} />
                ))}
              </div>
            ) : library ? (
              <div className="workspace">
                <div className="workspace-top">
                  <div>
                    <div className="eyebrow">
                      {page === 'dashboard'
                        ? 'YOUR GAMING DNA'
                        : page === 'discover'
                          ? 'YOUR NEXT ADVENTURE'
                          : 'MADE TO BE SHARED'}
                    </div>
                    <h1>
                      {page === 'dashboard'
                        ? t('游戏库，解码完成。', 'Your library, decoded.')
                        : page === 'discover'
                          ? t('今天，玩点什么？', 'What are we playing today?')
                          : t(
                              '你的游戏故事，值得分享。',
                              'Your story. Ready to share.',
                            )}
                    </h1>
                    <p>
                      {page === 'dashboard'
                        ? t(
                            '每一个小时，都有迹可循。',
                            'Every hour has a story.',
                          )
                        : page === 'discover'
                          ? t(
                              '少一点纠结，多一场冒险。',
                              'Less scrolling. More playing.',
                            )
                          : t(
                              '把热爱，变成一张漂亮的卡片。',
                              'Turn your passion into a beautiful card.',
                            )}
                    </p>
                  </div>
                  <span
                    className={`data-badge ${library.demo ? 'demo-badge' : ''}`}
                  >
                    {library.demo ? (
                      <Sparkles size={14} />
                    ) : (
                      <Check size={14} />
                    )}{' '}
                    {library.demo
                      ? t('演示数据 · Demo', 'Demo · sample data')
                      : t('Steam 真实数据', 'Live Steam data')}
                  </span>
                </div>
                <Panel className="profile-panel">
                  <div className="profile-main">
                    <img
                      src={
                        library.demo
                          ? library.player.avatarfull
                          : `/api/avatar?url=${encodeURIComponent(library.player.avatarfull)}`
                      }
                      alt={library.player.personaname}
                      className="avatar"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/avatar-fallback.svg';
                      }}
                    />
                    <div>
                      <div className="profile-name">
                        {library.player.personaname}
                        <span className="level">
                          LV. {library.level ?? '—'}
                        </span>
                      </div>
                      <a
                        href={library.player.profileurl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t('Steam 个人资料', 'Steam profile')}
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                  <div className="profile-meta">
                    <span>
                      {t('数据更新', 'Updated')}{' '}
                      {new Date(library.fetchedAt).toLocaleTimeString(
                        lang === 'zh' ? 'zh-CN' : 'en',
                        { hour: '2-digit', minute: '2-digit' },
                      )}
                    </span>
                    <button
                      className="secondary small"
                      onClick={() => go('home')}
                    >
                      <Search size={15} />
                      {t('查询其他玩家', 'Another player')}
                    </button>
                  </div>
                </Panel>
                {library.demo && (
                  <div className="demo-note">
                    <Sparkles size={15} />
                    {t(
                      '这是独立模拟数据，用于体验完整功能，不代表任何真实玩家。',
                      'Independent sample data for a full preview. This does not represent a real player.',
                    )}
                  </div>
                )}
                {library.warnings.map((code) => (
                  <div className="warning" key={code}>
                    {warningText[code]?.[lang === 'zh' ? 0 : 1]}
                  </div>
                ))}
                {page === 'dashboard' ? (
                  <Dashboard
                    library={library}
                    lang={lang}
                    animation={shouldAnimate}
                    roast={roast}
                    setRoast={setRoast}
                    metadata={metadata}
                    metadataLoading={metadataLoading}
                    metadataNote={metadataNote}
                    onDiscover={() => go('discover')}
                  />
                ) : page === 'discover' ? (
                  <Discover
                    key={
                      library.player.steamid + (library.demo ? 'demo' : 'live')
                    }
                    library={library}
                    lang={lang}
                    animation={shouldAnimate}
                  />
                ) : (
                  <Share library={library} lang={lang} notify={setNotice} />
                )}
              </div>
            ) : null}
          </Suspense>
        </main>
        <footer>
          <span className="footer-brand">
            <Target size={16} /> SteamScope
          </span>
          <p>
            {t('每个游戏库，都藏着一个故事。', 'Every library tells a story.')}
          </p>
          <span>
            {t(
              '开源 · MIT · 与 Valve 无关联',
              'Open source · MIT · Not affiliated with Valve',
            )}
          </span>
        </footer>
        <AnimatePresence>
          {settings && (
            <motion.div
              className="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSettings(false)}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="settings-title"
                className="settings-modal"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setSettings(false);
                  if (e.key === 'Tab') {
                    const focusable =
                      e.currentTarget.querySelectorAll<HTMLElement>(
                        'button, select, input',
                      );
                    const first = focusable[0],
                      last = focusable[focusable.length - 1];
                    if (e.shiftKey && document.activeElement === first) {
                      e.preventDefault();
                      last.focus();
                    } else if (!e.shiftKey && document.activeElement === last) {
                      e.preventDefault();
                      first.focus();
                    }
                  }
                }}
              >
                <div className="panel-heading">
                  <h2 id="settings-title">
                    <Settings2 size={19} />
                    {t('设置', 'Preferences')}
                  </h2>
                  <button
                    autoFocus
                    className="icon-button"
                    onClick={() => setSettings(false)}
                    aria-label={t('关闭', 'Close')}
                  >
                    <X />
                  </button>
                </div>
                <label>
                  <span>
                    <Globe2 size={18} />
                    {t('语言', 'Language')}
                  </span>
                  <select
                    value={lang}
                    onChange={(e) => setLang(e.target.value as Language)}
                  >
                    <option value="zh">简体中文</option>
                    <option value="en">English</option>
                  </select>
                </label>
                <label>
                  <span>
                    <Moon size={18} />
                    {t('主题', 'Theme')}
                  </span>
                  <select
                    value={theme}
                    onChange={(e) =>
                      setTheme(e.target.value as 'dark' | 'light')
                    }
                  >
                    <option value="dark">{t('深色', 'Dark')}</option>
                    <option value="light">{t('浅色', 'Light')}</option>
                  </select>
                </label>
                <label>
                  <span>
                    <Sparkles size={18} />
                    {t('动画效果', 'Animations')}
                  </span>
                  <input
                    type="checkbox"
                    checked={animation}
                    onChange={(e) => setAnimation(e.target.checked)}
                  />
                </label>
                <p>
                  {t(
                    '偏好仅保存在你的浏览器。',
                    'Preferences are saved only in this browser.',
                  )}
                </p>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
        {notice && (
          <div className="toast" role="status">
            <Check size={17} />
            {notice}
          </div>
        )}
        {loading && page === 'home' && (
          <div className="loading-banner" role="status">
            <Loader2 size={18} className="spin" />
            {t('正在读取 Steam 游戏库…', 'Reading your Steam library…')}
          </div>
        )}
      </div>
    </MotionConfig>
  );
}
