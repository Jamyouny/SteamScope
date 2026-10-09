import { CircleHelp, ExternalLink, Link2, Monitor, Users } from 'lucide-react';
import type { Language } from '../../shared/types';

export default function SteamIdGuide({ lang }: { lang: Language }) {
  const t = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  return (
    <details className="steam-id-guide">
      <summary>
        <CircleHelp size={15} />
        {t(
          '怎么找到 Steam ID 或个人资料链接？',
          'How do I find a Steam ID or profile link?',
        )}
      </summary>
      <div className="guide-content">
        <p className="guide-intro">
          {t(
            '最简单：复制个人资料页面的网址，直接粘贴到上面的搜索框。自定义链接也能查，不必先转换成数字 ID。',
            'The easiest way: copy the profile page URL and paste it into the search box above. Custom profile URLs work too; no numeric ID conversion is needed.',
          )}
        </p>
        <section>
          <h3>
            <Link2 size={16} />
            {t('从浏览器复制', 'From your browser')}
          </h3>
          <ol>
            <li>
              {t(
                '打开 Steam 社区中的目标玩家个人资料页。查询别人时，不需要登录对方账号。',
                'Open the player’s profile on Steam Community. You do not need to sign in to their account.',
              )}
            </li>
            <li>
              {t(
                '复制地址栏里的完整网址，再粘贴到搜索框。',
                'Copy the full URL from the address bar and paste it into the search box.',
              )}
            </li>
            <li>{t('点击「分析游戏库」。', 'Click “Analyze library”.')}</li>
          </ol>
          <a
            href="https://steamcommunity.com/my/"
            target="_blank"
            rel="noreferrer"
          >
            {t('打开我自己的 Steam 个人资料', 'Open my Steam profile')}
            <ExternalLink size={13} />
          </a>
        </section>
        <section>
          <h3>
            <Monitor size={16} />
            {t('从 Steam 客户端复制', 'From the Steam desktop app')}
          </h3>
          <p>
            {t(
              '点击客户端顶部的昵称 →「个人资料」。在资料页面空白处右键，选择「复制页面 URL」，再粘贴到本站。',
              'Click your name in the top navigation → Profile. Right-click an empty area on the profile page and choose “Copy Page URL”, then paste it here.',
            )}
          </p>
        </section>
        <section>
          <h3>
            <Users size={16} />
            {t('查询其他玩家', 'Look up another player')}
          </h3>
          <p>
            {t(
              '从好友列表或 Steam 社区搜索打开对方的个人资料，复制其资料链接即可。昵称可能重名，请不要只粘贴显示昵称。',
              'Open their profile from your friends list or Steam Community search, then copy the profile URL. Display names are not unique, so do not enter only a nickname.',
            )}
          </p>
        </section>
        <section className="guide-formats">
          <h3>{t('支持的输入格式', 'Accepted input formats')}</h3>
          <dl>
            <div>
              <dt>SteamID64</dt>
              <dd>
                {t(
                  '17 位数字，通常以 7656119 开头',
                  '17 digits, typically starting with 7656119',
                )}
              </dd>
            </div>
            <div>
              <dt>{t('数字资料链接', 'Numeric profile URL')}</dt>
              <dd>
                <code>https://steamcommunity.com/profiles/…</code>
              </dd>
            </div>
            <div>
              <dt>{t('自定义资料链接', 'Custom profile URL')}</dt>
              <dd>
                <code>https://steamcommunity.com/id/…</code>
              </dd>
            </div>
          </dl>
          <p>
            {t(
              '链接中 /profiles/ 后的 17 位数字就是 SteamID64；/id/ 后是自定义地址，直接提交完整链接即可。SteamScope 的玩家查询不接受登录账号名、游戏 AppID 或 STEAM_0:… 格式。',
              'The 17-digit number after /profiles/ is the SteamID64. For /id/ custom addresses, submit the full URL. Player lookup does not accept sign-in account names, game AppIDs or STEAM_0:… IDs.',
            )}
          </p>
        </section>
        <p className="guide-privacy">
          {t(
            '查不到游戏库？对方需要公开「个人资料」和「游戏详情」，并取消「始终对总游戏时间保密」。API Key 只需由本站服务端配置一次，不需要登录被查询的账号，也不能读取私密游戏库。',
            'Cannot access the library? The profile and Game details must be public, with “Always keep my total playtime private” disabled. One server API key is enough; it does not require the player’s login or grant access to private libraries.',
          )}
        </p>
      </div>
    </details>
  );
}
