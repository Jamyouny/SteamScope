import { useEffect, useState } from 'react';
import { Share2, Sparkles, Check, Download, Copy } from 'lucide-react';
import type { Language, Library } from '../../shared/types';
import { renderCard, type CardStyle } from '../lib/share';
import { Panel } from './Ui';
export default function Share({
  library,
  lang,
  notify,
}: {
  library: Library;
  lang: Language;
  notify: (text: string) => void;
}) {
  const t = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const [style, setStyle] = useState<CardStyle>('Dark'),
    [image, setImage] = useState(''),
    [blob, setBlob] = useState<Blob>(),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(true);
  useEffect(() => {
    let active = true,
      url = '';
    setBusy(true);
    setError('');
    setBlob(undefined);
    setImage('');
    renderCard(library, style, lang)
      .then((result) => {
        if (!active) return;
        url = URL.createObjectURL(result);
        setImage(url);
        setBlob(result);
      })
      .catch(() => {
        if (active)
          setError(
            t(
              '分享卡片生成失败，请检查头像是否可读取并重试。',
              'Card generation failed. Check avatar availability and retry.',
            ),
          );
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
    // The localized error is regenerated when the language changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [library, style, lang]);
  const download = () => {
    if (!image) return;
    const a = document.createElement('a');
    a.href = image;
    a.download = `SteamScope-${library.demo ? 'Demo' : library.player.steamid}-${style}.png`;
    a.click();
    notify(t('分享卡片已下载', 'Share card downloaded'));
  };
  const copy = async () => {
    if (!blob) return;
    try {
      if (!window.ClipboardItem || !navigator.clipboard?.write)
        throw new Error();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      notify(t('图片已复制到剪贴板', 'Image copied to clipboard'));
    } catch {
      notify(
        t(
          '当前浏览器不支持复制图片，或权限被拒绝。请下载 PNG。',
          'Image copy is unsupported or permission was denied. Download the PNG instead.',
        ),
      );
    }
  };
  return (
    <div className="share-layout">
      <Panel className="card-preview">
        <div className="panel-heading">
          <h2>
            <Share2 size={18} />
            {t('分享卡片预览', 'Share card preview')}
          </h2>
          <span className="subtle-tag">1200 × 720 PNG</span>
        </div>
        {busy ? (
          <div
            className="skeleton share-skeleton"
            aria-label={t('正在生成卡片', 'Generating card')}
          />
        ) : error ? (
          <div className="error-message" role="alert">
            {error}
            <button
              className="secondary small"
              onClick={() => setStyle(style === 'Dark' ? 'Cyberpunk' : 'Dark')}
            >
              {t('重试', 'Retry')}
            </button>
          </div>
        ) : (
          <img
            className="share-image"
            src={image}
            alt={t(
              'SteamScope 玩家数据分享卡片',
              'SteamScope player stats share card',
            )}
          />
        )}
      </Panel>
      <Panel className="share-options">
        <h2>
          <Sparkles size={19} />
          {t('让卡片更像你', 'Make it your own')}
        </h2>
        <p>
          {t(
            '选择风格，带走你的游戏故事。',
            'Pick a style and take your story with you.',
          )}
        </p>
        <div className="style-options">
          {(['Dark', 'Cyberpunk', 'Minimal'] as const).map((s) => (
            <button
              aria-pressed={style === s}
              className={style === s ? 'selected' : ''}
              key={s}
              onClick={() => setStyle(s)}
            >
              <span className={`swatch swatch-${s}`} />
              <b>{s}</b>
              {s === style && <Check size={16} />}
            </button>
          ))}
        </div>
        <button className="primary" disabled={!blob || busy} onClick={download}>
          <Download size={17} />
          {t('下载 PNG 卡片', 'Download PNG')}
        </button>
        <button className="secondary" disabled={!blob || busy} onClick={copy}>
          <Copy size={17} />
          {t('复制图片', 'Copy image')}
        </button>
        <p className="chart-caption">
          {t(
            '复制图片需要 HTTPS 或 localhost，以及浏览器剪贴板权限。',
            'Copying requires HTTPS or localhost and browser clipboard permission.',
          )}
        </p>
      </Panel>
    </div>
  );
}
