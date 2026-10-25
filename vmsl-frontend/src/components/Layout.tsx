import { Outlet, Link, NavLink, useLocation } from "react-router-dom";

export default function Layout() {
    const { pathname } = useLocation();
    const match = pathname.match(/^\/team\/([^/]+)\/([^/]+)\/([^/]+)/);
    const base = match?.[0];
    return <div className="min-h-screen">
        <a href="#main" className="skip-link">Skip to content</a>
        <header className="site-header"><div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-3"><span className="brand-mark">V</span><span className="font-bold text-lg">VMSL <span className="font-normal text-emerald-200">/ Team Hub</span></span></Link>
            <Link to="/" className="text-sm text-emerald-100">Explore teams ↗</Link>
        </div></header>
        <main id="main" className="mx-auto max-w-7xl px-6 py-8">
            {base && <nav aria-label="Team pages" className="nav-tabs">{[["", "Overview"], ["/schedule", "Fixtures"], ["/goals", "Goal analytics"], ["/scorers", "Scorers"], ["/mvps", "MVPs"], ["/shutouts", "Shutouts"]].map(([path, label]) => <NavLink key={path} end to={base + path}>{label}</NavLink>)}</nav>}
            <Outlet key={pathname} />
        </main>
        <div className="mx-auto max-w-7xl px-6"><footer>Independent Vancouver soccer analytics project · Public data from <a className="underline" href="https://vmslsoccer.com">VMSL</a> · Data may be delayed</footer></div>
    </div>;
}
