import { useState, type ReactNode } from 'react';
import { Gamepad2 } from 'lucide-react';
import { cover, type Game } from '../../shared/types';
export function GameImage({
  game,
  className = '',
}: {
  game: Game;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div className={`image-fallback ${className}`}>
      <Gamepad2 />
      <span>{game.name}</span>
    </div>
  ) : (
    <img
      className={className}
      src={cover(game.appid)}
      alt={game.name}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
export function Panel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`panel ${className}`}>{children}</section>;
}
