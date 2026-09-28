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
export const IPhone = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z" /></svg>);

/* ── ikony parametrov (čiarové, 24×24) ── */
const si = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
export const SpecIcon = ({ k }: { k: "year" | "km" | "gear" | "fuel" | "drive" | "engine" | "color" | "key" | "doc" | "pin" | "check" | "ship" | "tag" | "clock" | "gift" | "shield" }) => {
  const d: Record<string, React.ReactNode> = {
    year: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M8 3v4M16 3v4" /></>,
    km: <><path d="M4 16a8 8 0 1116 0" /><path d="M12 16l4-5" /><circle cx="12" cy="16" r="1.2" /></>,
    gear: <><circle cx="6" cy="6" r="2" /><circle cx="12" cy="6" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="6" cy="18" r="2" /><circle cx="12" cy="18" r="2" /><path d="M6 8v8M12 8v8M18 8v4H6" /></>,
    fuel: <><path d="M5 20V5a1 1 0 011-1h7a1 1 0 011 1v15M4 20h11M5 10h9" /><path d="M14 8h2a2 2 0 012 2v6a1.5 1.5 0 003 0V9l-3-3" /></>,
    drive: <><circle cx="6" cy="6" r="2.2" /><circle cx="18" cy="6" r="2.2" /><circle cx="6" cy="18" r="2.2" /><circle cx="18" cy="18" r="2.2" /><path d="M8.2 6h7.6M8.2 18h7.6M12 6v12" /></>,
    engine: <><path d="M4 10h2V8h4V6h4v2h3l2 3h2v5h-2l-2 3H9l-2-3H4z" /></>,
    color: <><path d="M12 3a9 9 0 100 18c1.5 0 2-1 2-2s-1-1.5-1-2.5S14 15 15 15h2a4 4 0 004-4c0-4.4-4-8-9-8z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10.5" cy="7.5" r="1" /><circle cx="15" cy="8" r="1" /></>,
    key: <><circle cx="8" cy="15" r="4" /><path d="M11 12l8-8M16 7l2 2M14 9l2 2" /></>,
    doc: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></>,
    pin: <><path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></>,
    ship: <><path d="M3 17l2 3h14l2-3-9-3z" /><path d="M6 15V9h12v6M9 9V5h6v4" /></>,
    tag: <><path d="M3 12V4a1 1 0 011-1h8l9 9-9 9z" /><circle cx="8" cy="8" r="1.5" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    gift: <><path d="M20 12v8H4v-8M3 8h18v4H3zM12 21V8M12 8S11 4 8.5 4a2 2 0 000 4M12 8s1-4 3.5-4a2 2 0 010 4" /></>,
    shield: <><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" /><path d="M9 12l2 2 4-4" /></>
  };
  return <svg viewBox="0 0 24 24" {...si} aria-hidden="true" className="si">{d[k]}</svg>;
};

/* ── siluety typov vozidiel (vlastná čiarová grafika) ── */
export const TypeArt = ({ t }: { t: "car" | "suv" | "truck" | "moto" | "all" }) => {
  const w = { fill: "none", stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const wheel = (x: number, y = 58, r = 10) => <><circle cx={x} cy={y} r={r} /><circle cx={x} cy={y} r={r * 0.35} /></>;
  const art: Record<string, React.ReactNode> = {
    car: <><path d="M8 56V48c0-3 2-5 6-6l14-3 12-11c3-2 6-3 10-3h26c4 0 7 1 10 4l10 10 14 3c3 1 5 3 5 6v8" /><path d="M20 58h8M52 58h44M118 58h6" /><path d="M42 38h62" />{wheel(40)}{wheel(106)}</>,
    suv: <><path d="M8 56V44c0-3 2-5 5-6l12-3 10-13c2-2 4-3 7-3h52c3 0 5 1 7 3l9 13 10 3c3 1 5 3 5 6v12" /><path d="M20 58h8M52 58h44M118 58h6M38 35h82M78 19v16" />{wheel(40)}{wheel(106)}</>,
    truck: <><path d="M8 56V42c0-2 1-4 4-4l14-2 10-14c1-2 3-3 6-3h24v17h58v20" /><path d="M20 58h8M52 58h44M118 58h6M66 36h58" />{wheel(40)}{wheel(106)}</>,
    moto: <><path d="M40 58l16-20h26l12 20M56 38l-6-10h-8M82 38l8-12h10M66 38l6 12" />{wheel(30, 56, 14)}{wheel(112, 56, 14)}</>,
    all: <><path d="M20 58h8M52 58h44M118 58h6" /><path d="M8 56V48c0-3 2-5 6-6l14-3 12-11c3-2 6-3 10-3h26c4 0 7 1 10 4l10 10 14 3c3 1 5 3 5 6v8" />{wheel(40)}{wheel(106)}<path d="M70 8v6M62 12l4 4M78 12l-4 4" /></>
  };
  return <svg viewBox="0 0 144 72" {...w} aria-hidden="true" className="typeart">{art[t]}</svg>;
};
