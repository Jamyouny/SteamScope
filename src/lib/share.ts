import type { Library } from '../../shared/types';
import { analyze, portrait } from '../../shared/analysis';
import type { Language } from '../../shared/types';
export type CardStyle = 'Dark' | 'Cyberpunk' | 'Minimal';
export async function renderCard(
  library: Library,
  style: CardStyle,
  lang: Language,
): Promise<Blob> {
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('CANVAS_UNAVAILABLE');
  const light = style === 'Minimal',
    cyber = style === 'Cyberpunk';
  const gradient = ctx.createLinearGradient(0, 0, 1200, 720);
  gradient.addColorStop(0, light ? '#f7f8fc' : cyber ? '#180c37' : '#131723');
  gradient.addColorStop(1, light ? '#e8edf7' : cyber ? '#052c40' : '#20213d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 720);
  ctx.strokeStyle = light ? '#d0d6e2' : cyber ? '#45e4ea' : '#383d59';
  ctx.lineWidth = 2;
  ctx.strokeRect(35, 35, 1130, 650);
  ctx.fillStyle = cyber ? '#54f1ec' : light ? '#6255cf' : '#a69bff';
  ctx.font = '600 24px sans-serif';
  ctx.fillText('◉  SteamScope', 70, 90);
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(
    library.demo ? 'DEMO · SAMPLE DATA' : 'STEAM LIBRARY REPORT',
    1125,
    90,
  );
  ctx.textAlign = 'left';
  const avatar = new Image();
  avatar.crossOrigin = 'anonymous';
  const avatarUrl = library.demo
    ? library.player.avatarfull
    : `/api/avatar?url=${encodeURIComponent(library.player.avatarfull)}`;
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('AVATAR_UNAVAILABLE')),
      15_000,
    );
    avatar.onload = () => {
      clearTimeout(timer);
      resolve();
    };
    avatar.onerror = () => {
      clearTimeout(timer);
      reject(new Error('AVATAR_UNAVAILABLE'));
    };
    avatar.src = avatarUrl;
  });
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(70, 150, 110, 110, 24);
  ctx.clip();
  ctx.drawImage(avatar, 70, 150, 110, 110);
  ctx.restore();
  ctx.fillStyle = light ? '#202333' : '#f3f4fc';
  ctx.font = 'bold 40px sans-serif';
  const clipped = (text: string, width: number) => {
    let result = text;
    if (ctx.measureText(text).width <= width) return text;
    while (result.length && ctx.measureText(result + '…').width > width)
      result = result.slice(0, -1);
    return result + '…';
  };
  ctx.fillText(clipped(library.player.personaname, 850), 210, 198);
  const a = analyze(library.games),
    p = portrait(library.games, lang);
  ctx.fillStyle = cyber ? '#54f1ec' : light ? '#6255cf' : '#a69bff';
  ctx.font = '24px sans-serif';
  ctx.fillText(p.title, 210, 243);
  const stats = [
    [String(a.count), lang === 'zh' ? '游戏总数' : 'GAMES OWNED'],
    [
      Math.round(a.total).toLocaleString(),
      lang === 'zh' ? '总游玩时长 / 小时' : 'HOURS PLAYED',
    ],
    [
      `${Math.round(a.progress)}%`,
      lang === 'zh' ? '游戏库探索进度' : 'LIBRARY EXPLORED',
    ],
  ];
  stats.forEach(([value, label], i) => {
    ctx.fillStyle = light ? '#202333' : '#f3f4fc';
    ctx.font = 'bold 62px sans-serif';
    ctx.fillText(value, 70 + i * 370, 382);
    ctx.fillStyle = light ? '#626b7c' : '#a1a8c1';
    ctx.font = '19px sans-serif';
    ctx.fillText(label, 70 + i * 370, 423);
  });
  ctx.strokeStyle = light ? '#d0d6e2' : '#373c55';
  ctx.beginPath();
  ctx.moveTo(70, 470);
  ctx.lineTo(1125, 470);
  ctx.stroke();
  ctx.fillStyle = light ? '#626b7c' : '#a1a8c1';
  ctx.font = '18px sans-serif';
  ctx.fillText(lang === 'zh' ? '陪伴最久的游戏' : 'MOST PLAYED', 70, 518);
  ctx.fillStyle = light ? '#202333' : '#f3f4fc';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(
    clipped(
      a.favorite?.name ?? (lang === 'zh' ? '尚未开始' : 'Not played yet'),
      1020,
    ),
    70,
    565,
  );
  ctx.fillStyle = light ? '#626b7c' : '#a1a8c1';
  ctx.font = '18px sans-serif';
  ctx.fillText(
    lang === 'zh'
      ? '每个游戏库，都藏着一个故事。'
      : 'Every library tells a story.',
    70,
    641,
  );
  ctx.textAlign = 'right';
  ctx.fillText('SteamScope · Open Source', 1125, 641);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('EXPORT_FAILED'))),
      'image/png',
    ),
  );
}
