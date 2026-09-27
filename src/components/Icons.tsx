type P = { className?: string };
const s = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const IArrow = (p: P) => (<svg viewBox="0 0 24 24" {...s} strokeWidth={2.5} className={p.className} aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
export const IExt = (p: P) => (<svg viewBox="0 0 24 24" {...s} strokeWidth={2.5} className={p.className} aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" /></svg>);
export const IList = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10" /></svg>);
export const IShield = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" /><path d="M9 12l2 2 4-4" /></svg>);
export const ICar = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17h2l2-5h10l2 5h2M7 17a2 2 0 104 0M13 17a2 2 0 104 0" /></svg>);
export const IGift = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12v8H4v-8M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" /></svg>);
export const IWrench = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.3a4 4 0 01-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 015.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z" /></svg>);
export const IMail = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>);
export const IGlobe = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" /></svg>);
export const IClock = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>);
export const IUsers = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M22 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8" /></svg>);
export const IDoc = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" /><path d="M14 3v6h6M8 13h8M8 17h5" /></svg>);
