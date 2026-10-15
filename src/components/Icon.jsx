const PATHS = {
  home: <path d="M3 11l9-8 9 8v10H3z" />,
  task: (<><rect x="4" y="4" width="16" height="16" rx="4" /><path d="M8 12l3 3 5-6" /></>),
  shield: <path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z" />,
  team: (<><circle cx="9" cy="8" r="3" /><path d="M3 20c0-4 3-6 6-6s6 2 6 6M17 11a3 3 0 100-6M21 19c0-3-2-5-4-5" /></>),
  bell: <path d="M6 16V11a6 6 0 1112 0v5l2 2H4zM10 21h4" />,
  search: (<><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  pal: (<><circle cx="12" cy="12" r="9" /><circle cx="8" cy="10" r="1" /><circle cx="12" cy="7" r="1" /><circle cx="16" cy="10" r="1" /></>),
  out: <path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
};

export default function Icon({ name, size }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
