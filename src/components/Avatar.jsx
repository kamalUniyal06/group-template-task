import { AVATAR_COLORS } from '../data/seed';

const initials = (name) => name.split(' ').map((x) => x[0]).join('');

export default function Avatar({ user, className = 'av', style }) {
  return (
    <span className={className} style={{ background: AVATAR_COLORS[user.id % 6], ...style }} title={user.name}>
      {initials(user.name)}
    </span>
  );
}
