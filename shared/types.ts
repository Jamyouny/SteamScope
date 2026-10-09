export type Game = {
  appid: number;
  name: string;
  playtime_forever: number;
  playtime_2weeks?: number;
  img_icon_url?: string;
  genres?: string[];
};
export type Player = {
  steamid: string;
  personaname: string;
  avatarfull: string;
  profileurl: string;
  communityvisibilitystate: number;
};
export type Library = {
  player: Player;
  games: Game[];
  recent: Game[];
  level: number | null;
  demo: boolean;
  fetchedAt: string;
  warnings: string[];
};
export type Language = 'zh' | 'en';
export const cover = (id: number) =>
  `https://cdn.akamai.steamstatic.com/steam/apps/${id}/header.jpg`;
