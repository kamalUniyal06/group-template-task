import { AVATAR_COLORS } from '../data/constants';

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0].toUpperCase())
    .join('') || '?';

// Stable colour per user id (ids are CRM UUIDs).
const colorFor = (id = '') => AVATAR_COLORS[[...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % AVATAR_COLORS.length];

export default function Avatar({ user, className = 'av', style }) {
  return (
    <span className={className} style={{ background: colorFor(user.id), ...style }} title={user.name}>
      {initials(user.name)}
    </span>
  );
}
