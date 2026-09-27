import { type ChangeEvent, type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import {
  ArrowRight,
  Award,
  CalendarDays,
  Check,
  CircleHelp,
  Compass,
  Edit3,
  Fish,
  Flame,
  LayoutDashboard,
  LogIn,
  MapPin,
  Menu,
  Mountain,
  Plus,
  ShieldCheck,
  Snowflake,
  Star,
  TentTree,
  Trash2,
  Truck,
  UserRound,
  UserPlus,
  UsersRound,
  X,
  Zap,
} from 'lucide-react';

const queryClient = new QueryClient();
const heroImage = '/outlaw-bowhunter.jpg';

type Category = 'All trips' | 'Hunting' | 'Fishing' | 'ATV' | 'Dirt bike' | 'Snowmobile';
type Listing = {
  id: string;
  title: string;
  category: Exclude<Category, 'All trips'>;
  location: string;
  state: string;
  price: number;
  duration: string;
  guests: string;
  rating: number;
  reviews: number;
  guide: string;
  initials: string;
  accent: string;
  description: string;
  tags: string[];
  availability: string;
  ownerId?: string;
};

type Role = 'customer' | 'guide';
type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  region?: string;
  experience?: string;
};
type Booking = {
  id: string;
  listingId: string;
  listingTitle: string;
  category: Listing['category'];
  location: string;
  guide: string;
  price: number;
  total: number;
  name: string;
  email: string;
  phone: string;
  date: string;
  partySize: number;
  notes: string;
  createdAt: string;
};

const starterListings: Listing[] = [
  {
    id: 'elk-ridge',
    title: 'September Elk Camp',
    category: 'Hunting',
    location: 'Cimarron Range',
    state: 'New Mexico',
    price: 495,
    duration: '3 days',
    guests: '1–4 hunters',
    rating: 4.9,
    reviews: 38,
    guide: 'Rhett Calder',
    initials: 'RC',
    accent: '#a65327',
    description: 'A backcountry archery camp for hunters who want long glassing days, honest miles, and a real shot at a bull.',
    tags: ['Archery', 'Backcountry'],
    availability: 'September 5–30 · 4 spots left',
  },
  {
    id: 'copper-river',
    title: 'Copper River Salmon Run',
    category: 'Fishing',
    location: 'Copper River',
    state: 'Alaska',
    price: 360,
    duration: 'Full day',
    guests: '1–3 anglers',
    rating: 5.0,
    reviews: 24,
    guide: 'Nora Bell',
    initials: 'NB',
    accent: '#26676b',
    description: 'Cold water, heavy fish, and a guide who knows which gravel bar is holding today. Gear and lunch included.',
    tags: ['Fly fishing', 'All gear'],
    availability: 'June–August · 3 boats available',
  },
  {
    id: 'high-desert',
    title: 'High Desert ATV Run',
    category: 'ATV',
    location: 'Moab Backcountry',
    state: 'Utah',
    price: 220,
    duration: '6 hours',
    guests: '2–8 riders',
    rating: 4.8,
    reviews: 61,
    guide: 'Mack Flores',
    initials: 'MF',
    accent: '#b56b2d',
    description: 'Sandstone fins, hidden arches, and a two-track route that leaves the crowds behind.',
    tags: ['Scenic', 'Beginner friendly'],
    availability: 'Open May–October · 6 rigs available',
  },
  {
    id: 'black-hills',
    title: 'Black Hills Dirt Bike',
    category: 'Dirt bike',
    location: 'Black Hills',
    state: 'South Dakota',
    price: 275,
    duration: '8 hours',
    guests: '2–6 riders',
    rating: 4.9,
    reviews: 47,
    guide: 'Tate McCready',
    initials: 'TM',
    accent: '#6b4938',
    description: 'Technical singletrack, pine shade, and a local line for every skill level. Bikes, fuel, and trail lunch.',
    tags: ['Singletrack', 'Bikes included'],
    availability: 'Open April–October · 4 bikes available',
  },
  {
    id: 'teton-powder',
    title: 'Teton Powder Mission',
    category: 'Snowmobile',
    location: 'Teton Valley',
    state: 'Idaho',
    price: 410,
    duration: 'Full day',
    guests: '2–5 riders',
    rating: 4.9,
    reviews: 29,
    guide: 'Hank Delaney',
    initials: 'HD',
    accent: '#375a67',
    description: 'Fresh lines, high alpine bowls, and a guide who reads the snowpack before he opens the throttle.',
    tags: ['Deep powder', 'Avalanche aware'],
    availability: 'December–March · 5 seats open',
  },
  {
    id: 'ozark-bow',
    title: 'Ozark Whitetail Week',
    category: 'Hunting',
    location: 'Ozark Highlands',
    state: 'Missouri',
    price: 390,
    duration: '2 days',
    guests: '1–3 hunters',
    rating: 4.7,
    reviews: 18,
    guide: 'Cal Hart',
    initials: 'CH',
    accent: '#405833',
    description: 'Quiet hardwood ridges, private ground, and a patient bowhunt built around how deer actually move.',
    tags: ['Whitetail', 'Private land'],
    availability: 'October–December · 3 spots left',
  },
];

const categories: { label: Category; icon: typeof Compass }[] = [
  { label: 'All trips', icon: Compass },
  { label: 'Hunting', icon: TentTree },
  { label: 'Fishing', icon: Fish },
  { label: 'ATV', icon: Truck },
  { label: 'Dirt bike', icon: Flame },
  { label: 'Snowmobile', icon: Snowflake },
];

function readLocal<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function saveLocal<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-2 text-left" data-testid="button-logo">
      <span className="grid h-9 w-9 place-items-center bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">
        <Mountain size={21} strokeWidth={2.4} />
      </span>
      <span>
        <span className="font-display block text-[23px] font-black leading-[.8] tracking-[.03em]">OUTLAW</span>
        <span className="font-mono-ui block pt-1 text-[8px] font-bold uppercase tracking-[.28em] text-[hsl(var(--muted-foreground))]">Adventures</span>
      </span>
    </button>
  );
}

function Header({
  session,
  onAuth,
  onBrowse,
  onMyBookings,
  onGuideArea,
  onLogout,
}: {
  session: User | null;
  onAuth: (role: Role, view?: 'login' | 'register') => void;
  onBrowse: () => void;
  onMyBookings: () => void;
  onGuideArea: () => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const closeAnd = (action: () => void) => {
    action();
    setOpen(false);
  };
  return (
    <header className="absolute left-0 right-0 top-0 z-40 border-b border-white/15 bg-[hsl(155_28%_13%/.32)] text-[#f2eadb] backdrop-blur-md">
      <div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between px-5 md:px-8">
        <Logo onClick={onBrowse} />
        <nav className="hidden items-center gap-8 md:flex">
          <button type="button" onClick={onBrowse} className="font-mono-ui text-[11px] uppercase tracking-[.14em] text-white/80 transition hover:text-white" data-testid="link-browse-trips">Find an adventure</button>
          <button type="button" onClick={onGuideArea} className="font-mono-ui text-[11px] uppercase tracking-[.14em] text-white/80 transition hover:text-white" data-testid="link-become-guide">{session?.role === 'guide' ? 'Guide dashboard' : 'Become a guide'}</button>
          <button type="button" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="font-mono-ui text-[11px] uppercase tracking-[.14em] text-white/80 transition hover:text-white" data-testid="link-how-it-works">How it works</button>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {session ? <><button type="button" onClick={onMyBookings} className="px-3 py-2 text-sm font-semibold text-white/85 transition hover:text-white" data-testid="button-my-bookings">{session.role === 'guide' ? 'Guide dashboard' : 'My bookings'}</button><button type="button" onClick={onLogout} className="px-2 py-2 text-sm font-semibold text-white/60 transition hover:text-white" data-testid="button-logout">Log out</button></> : <button type="button" onClick={() => onAuth('customer', 'login')} className="px-3 py-2 text-sm font-semibold text-white/85 transition hover:text-white" data-testid="button-register-customer">Sign in / Register</button>}
          <button type="button" onClick={onGuideArea} className="border border-white/55 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]" data-testid="button-list-adventure">{session?.role === 'guide' ? 'Manage listings' : 'List your adventure'}</button>
        </div>
        <button type="button" onClick={() => setOpen((v) => !v)} className="grid h-11 w-11 place-items-center border border-white/30 text-white md:hidden" aria-label="Toggle menu" data-testid="button-mobile-menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <div className="border-t border-white/15 bg-[hsl(155_28%_13%/.97)] px-5 py-5 md:hidden">
          <div className="flex flex-col gap-1">
            <button type="button" onClick={() => closeAnd(onBrowse)} className="flex items-center justify-between border-b border-white/10 py-4 text-left font-display text-2xl font-bold uppercase" data-testid="mobile-browse-trips">Find an adventure <ArrowRight size={20} /></button>
             <button type="button" onClick={() => closeAnd(onGuideArea)} className="flex items-center justify-between border-b border-white/10 py-4 text-left font-display text-2xl font-bold uppercase" data-testid="mobile-become-guide">{session?.role === 'guide' ? 'Guide dashboard' : 'Become a guide'} <ArrowRight size={20} /></button>
             {session && <button type="button" onClick={() => closeAnd(onMyBookings)} className="flex items-center justify-between border-b border-white/10 py-4 text-left font-display text-2xl font-bold uppercase" data-testid="mobile-my-bookings">{session.role === 'guide' ? 'My listings' : 'My bookings'} <ArrowRight size={20} /></button>}
             {session ? <button type="button" onClick={() => closeAnd(onLogout)} className="mt-4 border border-white/30 px-4 py-3 text-left font-semibold text-white" data-testid="mobile-logout">Log out <ArrowRight className="float-right" size={20} /></button> : <button type="button" onClick={() => closeAnd(() => onAuth('customer', 'login'))} className="mt-4 bg-[hsl(var(--accent))] px-4 py-3 text-left font-semibold text-white" data-testid="mobile-register">Sign in / Register <ArrowRight className="float-right" size={20} /></button>}
          </div>
        </div>
      )}
    </header>
  );
}

function Hero({ onBrowse, onRegister }: { onBrowse: () => void; onRegister: () => void }) {
  return (
    <section className="hero-grain relative flex min-h-[690px] items-end overflow-hidden bg-[hsl(var(--primary))] pb-14 pt-28 text-[#f2eadb] md:min-h-[780px] md:pb-20">
      <div className="absolute inset-0 bg-cover bg-center md:bg-[position:center_48%]" style={{ backgroundImage: `linear-gradient(90deg, rgba(9,27,20,.9) 0%, rgba(9,27,20,.63) 38%, rgba(9,27,20,.12) 100%), linear-gradient(0deg, rgba(9,27,20,.72) 0%, transparent 57%), url("${heroImage}")` }} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_12%,rgba(229,100,38,.2),transparent_30%)]" />
      <div className="relative mx-auto w-full max-w-[1240px] px-5 md:px-8">
        <div className="max-w-[750px]">
          <div className="animate-rise-2 mb-5 flex items-center gap-3 font-mono-ui text-[10px] font-bold uppercase tracking-[.21em] text-[#f3a066]">
            <span className="h-px w-10 bg-[#f3a066]" /> Wild places. Good people. No guesswork.
          </div>
          <h1 className="animate-rise font-display max-w-[730px] text-[clamp(4.3rem,12vw,9rem)] font-black uppercase leading-[.78] tracking-[-.035em] text-balance">
            Go farther.<br /><span className="text-[#f3a066]">Come back</span><br />different.
          </h1>
          <p className="animate-rise-2 mt-7 max-w-[490px] text-base leading-7 text-[#f1eadf]/80 md:text-lg">
            Book the wild with local guides who know the ground, carry the right gear, and care whether you make it home with a story worth telling.
          </p>
          <div className="animate-rise-3 mt-8 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={onBrowse} className="group flex items-center justify-center gap-3 bg-[hsl(var(--accent))] px-6 py-4 font-bold text-white transition hover:bg-[#f17b38]" data-testid="button-browse-hero">
              Browse adventures <ArrowRight size={19} className="transition-transform group-hover:translate-x-1" />
            </button>
            <button type="button" onClick={onRegister} className="flex items-center justify-center gap-3 border border-white/45 px-6 py-4 font-bold text-white transition hover:border-white hover:bg-white/10" data-testid="button-register-hero">
              Join the crew <UsersRound size={18} />
            </button>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 font-mono-ui text-[10px] uppercase tracking-[.12em] text-white/60">
            <span className="flex items-center gap-2"><ShieldCheck size={14} className="text-[#f3a066]" /> Vetted guides</span>
            <span className="flex items-center gap-2"><MapPin size={14} className="text-[#f3a066]" /> 36 states + beyond</span>
            <span className="flex items-center gap-2"><Award size={14} className="text-[#f3a066]" /> Real local knowledge</span>
          </div>
        </div>
      </div>
      <div className="absolute bottom-5 right-5 hidden items-center gap-3 font-mono-ui text-[9px] uppercase tracking-[.2em] text-white/45 lg:flex">
        <span className="h-px w-14 bg-white/40" /> Scroll to explore
      </div>
    </section>
  );
}

function CategoryBar({ active, onChange }: { active: Category; onChange: (cat: Category) => void }) {
  return (
    <section id="trips" className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div className="mx-auto max-w-[1240px] px-5 md:px-8">
        <div className="-mx-5 flex snap-x gap-2 overflow-x-auto px-5 py-5 md:mx-0 md:px-0">
          {categories.map(({ label, icon: Icon }) => (
            <button key={label} type="button" onClick={() => onChange(label)} className={`flex shrink-0 snap-start items-center gap-2 border px-4 py-2.5 text-sm font-semibold transition ${active === label ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'border-[hsl(var(--border))] bg-transparent text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--foreground))]'}`} data-testid={`filter-category-${label.toLowerCase().replace(' ', '-')}`}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function ListingCard({ listing, onDetails }: { listing: Listing; onDetails: (listing: Listing) => void }) {
  return (
    <article className="group overflow-hidden border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[var(--shadow-sm)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]" data-testid={`card-listing-${listing.id}`}>
      <div className="relative h-[210px] overflow-hidden bg-[hsl(var(--primary))]">
        <div className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105" style={{ backgroundImage: `linear-gradient(135deg, ${listing.accent}cc, rgba(9,27,20,.26)), url("${heroImage}")` }} />
        <div className="absolute left-4 top-4 flex items-center gap-2 bg-[hsl(var(--primary))] px-2.5 py-1.5 font-mono-ui text-[9px] font-bold uppercase tracking-[.12em] text-white"><MapPin size={12} /> {listing.state}</div>
        <div className="absolute bottom-4 left-4 font-mono-ui text-[10px] font-bold uppercase tracking-[.12em] text-white/80">{listing.category} / {listing.duration}</div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div><p className="font-mono-ui text-[10px] uppercase tracking-[.13em] text-[hsl(var(--muted-foreground))]">{listing.location}</p><h3 className="mt-1 font-display text-[29px] font-bold uppercase leading-[.94]">{listing.title}</h3></div>
          <div className="flex shrink-0 items-center gap-1 pt-1 text-sm font-bold"><Star size={14} fill="currentColor" className="text-[hsl(var(--accent))]" /> {listing.rating}</div>
        </div>
        <p className="mt-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{listing.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">{listing.tags.map((tag) => <span key={tag} className="bg-[hsl(var(--muted))] px-2 py-1 font-mono-ui text-[9px] uppercase tracking-[.08em] text-[hsl(var(--muted-foreground))]">{tag}</span>)}</div>
        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[hsl(var(--accent))]"><CalendarDays size={14} /> {listing.availability}</div>
        <div className="mt-5 flex items-end justify-between border-t border-[hsl(var(--border))] pt-4">
          <div><p className="font-mono-ui text-[9px] uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))]">From / person</p><p className="font-display text-3xl font-bold">${listing.price}<span className="font-sans text-sm font-normal text-[hsl(var(--muted-foreground))]"> / day</span></p></div>
          <button type="button" onClick={() => onDetails(listing)} className="flex items-center gap-2 bg-[hsl(var(--primary))] px-4 py-3 text-sm font-bold text-[hsl(var(--primary-foreground))] transition hover:bg-[hsl(var(--accent))]" data-testid={`button-details-${listing.id}`}>Details <ArrowRight size={16} /></button>
        </div>
      </div>
    </article>
  );
}

function Listings({ listings, activeCategory, onCategory, onDetails }: { listings: Listing[]; activeCategory: Category; onCategory: (cat: Category) => void; onDetails: (listing: Listing) => void }) {
  const filtered = useMemo(() => activeCategory === 'All trips' ? listings : listings.filter((item) => item.category === activeCategory), [activeCategory, listings]);
  return (
    <section className="bg-[hsl(var(--background))] py-16 md:py-24">
      <div className="mx-auto max-w-[1240px] px-5 md:px-8">
        <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><div className="mb-3 flex items-center gap-3 font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--accent))]"><span className="h-px w-8 bg-[hsl(var(--accent))]" /> Pick your kind of trouble</div><h2 className="font-display text-5xl font-black uppercase leading-[.84] md:text-7xl">The good stuff<br /><span className="text-[hsl(var(--accent))]">starts here.</span></h2></div>
          <p className="max-w-[330px] text-sm leading-6 text-[hsl(var(--muted-foreground))]">Every trip is run by a real local guide. No faceless operators. No mystery itineraries. Just the right person for the right piece of wild.</p>
        </div>
        {filtered.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{filtered.map((listing) => <ListingCard key={listing.id} listing={listing} onDetails={onDetails} />)}</div> : <div className="line-grid border border-dashed border-[hsl(var(--border))] px-6 py-16 text-center"><Compass className="mx-auto mb-4 text-[hsl(var(--accent))]" size={32} /><h3 className="font-display text-3xl font-bold uppercase">No trips in this neck of the woods</h3><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Try another category. More local guides are joining every week.</p><button type="button" onClick={() => onCategory('All trips')} className="mt-6 border border-[hsl(var(--primary))] px-4 py-2 text-sm font-bold" data-testid="button-reset-filters">Show all trips</button></div>}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: '01', title: 'Choose your line', text: 'Filter by the kind of day you want, where you want to go, and how hard you want to push it.', icon: Compass },
    { n: '02', title: 'Meet your guide', text: 'Read the honest details, see who is behind the trip, and ask anything before you commit.', icon: UserRound },
    { n: '03', title: 'Get outside', text: 'Book securely, get the exact meet-up plan, and show up ready. The rest is between you and the wild.', icon: Zap },
  ];
  return (
    <section id="how-it-works" className="overflow-hidden bg-[hsl(var(--primary))] py-20 text-[hsl(var(--primary-foreground))] md:py-28">
      <div className="mx-auto max-w-[1240px] px-5 md:px-8">
        <div className="mb-14 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[#f3a066]">The OUTLAW standard</p><h2 className="mt-3 max-w-[650px] font-display text-5xl font-black uppercase leading-[.83] md:text-7xl">Built for the<br /><span className="text-[#f3a066]">real thing.</span></h2></div><p className="max-w-[305px] text-sm leading-6 text-white/65">A better way to find the people who know the backroads, the river bends, and the difference between a good trip and a story you tell forever.</p></div>
        <div className="grid border-y border-white/15 md:grid-cols-3">{steps.map(({ n, title, text, icon: Icon }) => <div key={n} className="border-b border-white/15 py-8 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0"><div className="flex items-center justify-between"><span className="font-mono-ui text-[11px] text-[#f3a066]">{n}</span><Icon size={23} className="text-[#f3a066]" /></div><h3 className="mt-14 font-display text-3xl font-bold uppercase">{title}</h3><p className="mt-3 max-w-[280px] text-sm leading-6 text-white/60">{text}</p></div>)}</div>
      </div>
    </section>
  );
}

function GuideBanner({ onGuide }: { onGuide: () => void }) {
  return (
    <section className="bg-[hsl(var(--accent))] px-5 py-14 text-white md:px-8 md:py-20">
      <div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-8 md:flex-row md:items-center">
        <div><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-white/70">For the ones who know the way</p><h2 className="mt-3 max-w-[720px] font-display text-5xl font-black uppercase leading-[.86] md:text-7xl">Your ground.<br />Your rules.</h2><p className="mt-5 max-w-[510px] text-sm leading-6 text-white/80">Put your local knowledge to work. OUTLAW gives independent guides a clean way to fill dates, meet good clients, and stay focused on the trip.</p></div>
        <button type="button" onClick={onGuide} className="flex shrink-0 items-center justify-center gap-3 self-start border-2 border-white px-6 py-4 font-bold transition hover:bg-white hover:text-[hsl(var(--accent))] md:self-center" data-testid="button-guide-banner">Become a guide <ArrowRight size={19} /></button>
      </div>
    </section>
  );
}

function TrustStrip() {
  return <section className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] py-10"><div className="mx-auto grid max-w-[1240px] gap-7 px-5 md:grid-cols-3 md:px-8"><div className="flex gap-4"><ShieldCheck className="shrink-0 text-[hsl(var(--accent))]" size={27} /><div><h3 className="font-display text-xl font-bold uppercase">People, not listings</h3><p className="mt-1 text-sm leading-5 text-[hsl(var(--muted-foreground))]">Every guide shares their name, their experience, and their way of doing things.</p></div></div><div className="flex gap-4"><CircleHelp className="shrink-0 text-[hsl(var(--accent))]" size={27} /><div><h3 className="font-display text-xl font-bold uppercase">Clear before you go</h3><p className="mt-1 text-sm leading-5 text-[hsl(var(--muted-foreground))]">Know what is included, what to bring, and what the day will ask of you.</p></div></div><div className="flex gap-4"><CalendarDays className="shrink-0 text-[hsl(var(--accent))]" size={27} /><div><h3 className="font-display text-xl font-bold uppercase">Plans that stick</h3><p className="mt-1 text-sm leading-5 text-[hsl(var(--muted-foreground))]">A real booking confirmation, direct details, and no surprise hand-offs.</p></div></div></div></section>;
}

function Footer({ onRegister, onGuide }: { onRegister: () => void; onGuide: () => void }) {
  return <footer className="bg-[hsl(var(--primary))] px-5 py-12 text-[hsl(var(--primary-foreground))] md:px-8 md:py-16"><div className="mx-auto max-w-[1240px]"><div className="flex flex-col justify-between gap-10 border-b border-white/15 pb-12 md:flex-row"><div><Logo onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} /><p className="mt-6 max-w-[280px] text-sm leading-6 text-white/55">A marketplace for the people who would rather be outside. Find a guide. Pick a line. Make it count.</p></div><div className="grid grid-cols-2 gap-x-12 gap-y-8 sm:grid-cols-3"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-[#f3a066]">Explore</p><button type="button" onClick={() => document.getElementById('trips')?.scrollIntoView({ behavior: 'smooth' })} className="mt-4 block text-sm text-white/70 hover:text-white" data-testid="footer-find-adventures">Find adventures</button><button type="button" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="mt-3 block text-sm text-white/70 hover:text-white" data-testid="footer-how-it-works">How it works</button></div><div><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-[#f3a066]">Join in</p><button type="button" onClick={onGuide} className="mt-4 block text-sm text-white/70 hover:text-white" data-testid="footer-become-guide">Become a guide</button><button type="button" onClick={onRegister} className="mt-3 block text-sm text-white/70 hover:text-white" data-testid="footer-register">Create an account</button></div><div><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-[#f3a066]">Field notes</p><p className="mt-4 text-sm text-white/70">hello@outlawadventures.co</p><p className="mt-3 text-sm text-white/70">Built for wild weekends.</p></div></div></div><div className="flex flex-col justify-between gap-3 pt-6 font-mono-ui text-[9px] uppercase tracking-[.12em] text-white/35 sm:flex-row"><span>© 2025 OUTLAW Adventures</span><span>Demo marketplace — no live payments</span></div></div></footer>;
}

type ModalProps = { onClose: () => void };

function ModalShell({ title, eyebrow, onClose, children }: ModalProps & { title: string; eyebrow: string; children: ReactNode }) {
  return <div className="fixed inset-0 z-50 grid place-items-end bg-[hsl(155_28%_8%/.72)] p-0 backdrop-blur-sm md:place-items-center md:p-5" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="max-h-[92dvh] w-full max-w-[580px] overflow-y-auto bg-[hsl(var(--card))] shadow-2xl"><div className="flex items-start justify-between border-b border-[hsl(var(--border))] p-5 md:p-7"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-[hsl(var(--accent))]">{eyebrow}</p><h2 id="modal-title" className="mt-2 font-display text-4xl font-black uppercase leading-none">{title}</h2></div><button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--foreground))]" aria-label="Close dialog" data-testid="button-modal-close"><X size={20} /></button></div><div className="p-5 md:p-7">{children}</div></div></div>;
}

function AuthModal({ role, initialView, onClose, onSignedIn }: ModalProps & { role: Role; initialView: 'login' | 'register'; onSignedIn: (user: User) => void }) {
  const [view, setView] = useState<'login' | 'register'>(initialView);
  const [errors, setErrors] = useState<string[]>([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', region: '', experience: '' });
  const isGuide = role === 'guide';
  const update = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((value) => ({ ...value, [field]: event.target.value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const users = readLocal<User[]>('outlaw-users', []);
    const email = form.email.trim().toLowerCase();
    if (view === 'login') {
      const user = users.find((item) => item.email === email && item.password === form.password && item.role === role);
      if (!user) {
        setErrors(['We could not match that email and password for this account type.']);
        return;
      }
      saveLocal('outlaw-session', user);
      onSignedIn(user);
      onClose();
      return;
    }
    const next = [
      !form.name.trim() ? 'Name is required.' : '',
      !/^\S+@\S+\.\S+$/.test(email) ? 'Enter a valid email.' : '',
      form.password.length < 6 ? 'Password must be at least 6 characters.' : '',
      isGuide && !form.region.trim() ? 'Add your home region.' : '',
      isGuide && !form.experience.trim() ? 'Tell us a little about your guiding experience.' : '',
      users.some((item) => item.email === email) ? 'An account with this email already exists.' : '',
    ].filter(Boolean);
    setErrors(next);
    if (next.length) return;
    const user: User = { id: makeId('user'), name: form.name.trim(), email, phone: form.phone.trim(), password: form.password, role, region: form.region.trim(), experience: form.experience.trim() };
    saveLocal('outlaw-users', [...users, user]);
    saveLocal('outlaw-session', user);
    onSignedIn(user);
    onClose();
  };
  return <ModalShell title={view === 'login' ? 'Welcome back.' : isGuide ? 'Put your ground on the map.' : 'Get outside more often.'} eyebrow={isGuide ? 'Guide account' : 'Customer account'} onClose={onClose}>
    <div className="mb-6 grid grid-cols-2 border-b border-[hsl(var(--border))]">
      <button type="button" onClick={() => { setView('login'); setErrors([]); }} className={`border-b-2 pb-3 text-sm font-bold ${view === 'login' ? 'border-[hsl(var(--accent))] text-[hsl(var(--foreground))]' : 'border-transparent text-[hsl(var(--muted-foreground))]'}`} data-testid="tab-login"><LogIn className="mr-2 inline-block" size={15} /> Sign in</button>
      <button type="button" onClick={() => { setView('register'); setErrors([]); }} className={`border-b-2 pb-3 text-sm font-bold ${view === 'register' ? 'border-[hsl(var(--accent))] text-[hsl(var(--foreground))]' : 'border-transparent text-[hsl(var(--muted-foreground))]'}`} data-testid="tab-register"><UserPlus className="mr-2 inline-block" size={15} /> Register</button>
    </div>
    <p className="mb-6 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{view === 'login' ? 'Sign in on this device to see your saved trips and manage your OUTLAW profile.' : isGuide ? 'Create a guide account, then publish and manage your own adventures from the guide dashboard.' : 'Create a customer account so your booking details and saved trips are easy to find.'}</p>
    <form onSubmit={submit} className="space-y-4" noValidate>
      {errors.length > 0 && <div className="border-l-4 border-[hsl(var(--accent))] bg-[hsl(var(--muted))] p-3 text-sm" role="alert" data-testid="status-auth-error">{errors.map((error) => <p key={error}>{error}</p>)}</div>}
      {view === 'register' && <label className="block text-sm font-semibold">Full name<input value={form.name} onChange={update('name')} className="mt-1.5 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none focus:border-[hsl(var(--accent))]" placeholder="Your name" data-testid="input-registration-name" /></label>}
      <label className="block text-sm font-semibold">Email<input type="email" value={form.email} onChange={update('email')} className="mt-1.5 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none focus:border-[hsl(var(--accent))]" placeholder="you@example.com" data-testid="input-registration-email" /></label>
      {view === 'register' && <label className="block text-sm font-semibold">Phone<input value={form.phone} onChange={update('phone')} className="mt-1.5 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none focus:border-[hsl(var(--accent))]" placeholder="(555) 123-4567" data-testid="input-registration-phone" /></label>}
      <label className="block text-sm font-semibold">Password<input type="password" value={form.password} onChange={update('password')} className="mt-1.5 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none focus:border-[hsl(var(--accent))]" placeholder={view === 'register' ? 'At least 6 characters' : 'Your password'} data-testid="input-auth-password" /></label>
      {view === 'register' && isGuide && <><label className="block text-sm font-semibold">Home region<input value={form.region} onChange={update('region')} className="mt-1.5 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none focus:border-[hsl(var(--accent))]" placeholder="e.g. Western Montana" data-testid="input-guide-region" /></label><label className="block text-sm font-semibold">Guiding experience<textarea value={form.experience} onChange={update('experience')} className="mt-1.5 min-h-24 w-full resize-y border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none focus:border-[hsl(var(--accent))]" placeholder="What do you guide, and what makes your trips different?" data-testid="input-guide-experience" /></label></>}
      <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="px-5 py-3 text-sm font-semibold text-[hsl(var(--muted-foreground))]" data-testid="button-registration-cancel">Cancel</button><button type="submit" className="bg-[hsl(var(--accent))] px-6 py-3 text-sm font-bold text-white hover:bg-[#f17b38]" data-testid="button-registration-submit">{view === 'login' ? 'Sign in' : isGuide ? 'Create guide account' : 'Create customer account'}</button></div>
    </form>
  </ModalShell>;
}

function AdventureDetails({ listing, onClose, onBook }: ModalProps & { listing: Listing; onBook: () => void }) {
  return <ModalShell title={listing.title} eyebrow={`${listing.category} · ${listing.location}, ${listing.state}`} onClose={onClose}>
    <div className="relative mb-6 h-44 overflow-hidden bg-[hsl(var(--primary))]">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(135deg, ${listing.accent}dd, rgba(9,27,20,.2)), url("${heroImage}")` }} />
      <div className="absolute bottom-4 left-4 flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.12em] text-white"><MapPin size={13} /> {listing.location}, {listing.state}</div>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <div><p className="font-mono-ui text-[9px] uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))]">Guide</p><p className="mt-1 font-display text-2xl font-bold uppercase">{listing.guide}</p></div>
      <div><p className="font-mono-ui text-[9px] uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))]">Price</p><p className="mt-1 font-display text-2xl font-bold">${listing.price}<span className="font-sans text-sm font-normal text-[hsl(var(--muted-foreground))]"> / person / day</span></p></div>
    </div>
    <p className="mt-6 text-sm leading-7 text-[hsl(var(--muted-foreground))]">{listing.description}</p>
    <div className="mt-5 grid gap-3 border-y border-[hsl(var(--border))] py-4 text-sm sm:grid-cols-2"><p className="flex items-center gap-2"><CalendarDays size={16} className="text-[hsl(var(--accent))]" /><strong>Availability:</strong> {listing.availability}</p><p className="flex items-center gap-2"><UsersRound size={16} className="text-[hsl(var(--accent))]" /><strong>Group:</strong> {listing.guests}</p></div>
    <div className="mt-5 flex flex-wrap gap-2">{listing.tags.map((tag) => <span key={tag} className="bg-[hsl(var(--muted))] px-2 py-1 font-mono-ui text-[9px] uppercase tracking-[.08em]">{tag}</span>)}</div>
    <button type="button" onClick={onBook} className="mt-7 flex w-full items-center justify-center gap-2 bg-[hsl(var(--accent))] px-6 py-4 font-bold text-white hover:bg-[#f17b38]" data-testid={`button-book-details-${listing.id}`}>Book now <ArrowRight size={18} /></button>
  </ModalShell>;
}

function BookingModal({ listing, session, onClose, onBooked }: ModalProps & { listing: Listing; session: User | null; onBooked: (booking: Booking) => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState('');
  const [form, setForm] = useState({ date: '', partySize: '1', name: session?.name ?? '', email: session?.email ?? '', phone: session?.phone ?? '', notes: '' });
  const total = listing.price * Number(form.partySize || 1);
  const update = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((value) => ({ ...value, [field]: event.target.value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.date || !form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email) || !form.phone.trim() || Number(form.partySize) < 1) { setErrors('Add your name, email, phone, date, and party size to continue.'); return; }
    setErrors('');
    const booking: Booking = { id: makeId('booking'), listingId: listing.id, listingTitle: listing.title, category: listing.category, location: `${listing.location}, ${listing.state}`, guide: listing.guide, price: listing.price, total, name: form.name.trim(), email: form.email.trim().toLowerCase(), phone: form.phone.trim(), date: form.date, partySize: Number(form.partySize), notes: form.notes.trim(), createdAt: new Date().toISOString() };
    const bookings = readLocal<Booking[]>('outlaw-bookings', []);
    saveLocal('outlaw-bookings', [booking, ...bookings]);
    onBooked(booking);
    setSubmitted(true);
  };
  if (submitted) return <ModalShell title="You are booked for the wild." eyebrow="Demo booking confirmed" onClose={onClose}><div className="py-2"><div className="flex items-start gap-3 border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4"><Check className="mt-1 text-[hsl(var(--accent))]" size={23} /><div><p className="font-bold">{listing.title}</p><p className="text-sm text-[hsl(var(--muted-foreground))]">{form.date} · {form.partySize} {Number(form.partySize) === 1 ? 'guest' : 'guests'} · {form.name}</p><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{form.email} · {form.phone}</p></div></div><p className="mt-6 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Your booking is saved on this device. Payments are disabled, so no card details were requested.</p><div className="mt-6 flex items-center justify-between border-t border-[hsl(var(--border))] pt-5"><span className="font-mono-ui text-[10px] uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))]">Demo total</span><span className="font-display text-3xl font-bold">${total.toLocaleString()}</span></div><button type="button" onClick={onClose} className="mt-7 w-full bg-[hsl(var(--primary))] px-6 py-3 font-bold text-[hsl(var(--primary-foreground))]" data-testid="button-booking-done">Done</button></div></ModalShell>;
  return <ModalShell title={`Book ${listing.title}`} eyebrow="Secure your spot · demo checkout" onClose={onClose}><div className="mb-5 flex items-start justify-between gap-4 border-b border-[hsl(var(--border))] pb-5"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-[hsl(var(--muted-foreground))]">{listing.location}, {listing.state}</p><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">with {listing.guide} · {listing.duration}</p></div><p className="font-display text-3xl font-bold">${listing.price}<span className="font-sans text-sm font-normal text-[hsl(var(--muted-foreground))]"> / guest</span></p></div><div className="mb-5 flex gap-3 bg-[hsl(20_86%_52%/.1)] p-3 text-xs leading-5 text-[hsl(var(--foreground))]"><ShieldCheck className="shrink-0 text-[hsl(var(--accent))]" size={17} /> This is a demo checkout. No card details are requested and no live payment is processed.</div><form onSubmit={submit} className="space-y-4" noValidate>{errors && <p className="border-l-4 border-[hsl(var(--accent))] bg-[hsl(var(--muted))] p-3 text-sm" role="alert" data-testid="status-booking-error">{errors}</p>}<div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Adventure date<input type="date" min={new Date().toISOString().split('T')[0]} value={form.date} onChange={update('date')} className="mt-1.5 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none focus:border-[hsl(var(--accent))]" data-testid="input-booking-date" /></label><label className="block text-sm font-semibold">Party size<select value={form.partySize} onChange={update('partySize')} className="mt-1.5 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none focus:border-[hsl(var(--accent))]" data-testid="select-booking-party-size">{[1, 2, 3, 4, 5, 6, 7, 8].map((count) => <option key={count} value={count}>{count} {count === 1 ? 'guest' : 'guests'}</option>)}</select></label></div><label className="block text-sm font-semibold">Your name<input value={form.name} onChange={update('name')} className="mt-1.5 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none focus:border-[hsl(var(--accent))]" placeholder="Name for the booking" data-testid="input-booking-name" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Email for confirmation<input type="email" value={form.email} onChange={update('email')} className="mt-1.5 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none focus:border-[hsl(var(--accent))]" placeholder="you@example.com" data-testid="input-booking-email" /></label><label className="block text-sm font-semibold">Phone<input type="tel" value={form.phone} onChange={update('phone')} className="mt-1.5 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none focus:border-[hsl(var(--accent))]" placeholder="(555) 123-4567" data-testid="input-booking-phone" /></label></div><label className="block text-sm font-semibold">Notes for your guide <span className="font-normal text-[hsl(var(--muted-foreground))]">(optional)</span><textarea value={form.notes} onChange={update('notes')} className="mt-1.5 min-h-24 w-full resize-y border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none focus:border-[hsl(var(--accent))]" placeholder="Tell the guide about experience, gear, or questions..." data-testid="input-booking-notes" /></label><div className="flex items-center justify-between border-t border-[hsl(var(--border))] pt-5"><span className="font-mono-ui text-[10px] uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))]">Estimated demo total</span><span className="font-display text-3xl font-bold">${total.toLocaleString()}</span></div><div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="px-5 py-3 text-sm font-semibold text-[hsl(var(--muted-foreground))]" data-testid="button-booking-cancel">Cancel</button><button type="submit" className="bg-[hsl(var(--accent))] px-6 py-3 text-sm font-bold text-white hover:bg-[#f17b38]" data-testid="button-booking-submit">Confirm booking</button></div></form></ModalShell>;
}

type GuideForm = {
  title: string;
  category: Exclude<Category, 'All trips'>;
  location: string;
  state: string;
  price: string;
  duration: string;
  guests: string;
  description: string;
  availability: string;
  tags: string;
};

const emptyGuideForm: GuideForm = {
  title: '',
  category: 'Hunting',
  location: '',
  state: '',
  price: '',
  duration: 'Full day',
  guests: '1–4 guests',
  description: '',
  availability: '',
  tags: '',
};

function GuideDashboard({ session, listings, onListingsChange, onAuth }: { session: User | null; listings: Listing[]; onListingsChange: (next: Listing[]) => void; onAuth: (role: Role, view?: 'login' | 'register') => void }) {
  const [form, setForm] = useState<GuideForm>(emptyGuideForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const mine = session?.role === 'guide' ? listings.filter((listing) => listing.ownerId === session.id) : [];
  const update = (field: keyof GuideForm) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((value) => ({ ...value, [field]: event.target.value }));
  const reset = () => { setForm(emptyGuideForm); setEditingId(null); setErrors([]); };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = [!form.title.trim() ? 'Add a title.' : '', !form.location.trim() ? 'Add a location.' : '', !form.state.trim() ? 'Add a state or region.' : '', !form.price || Number(form.price) <= 0 ? 'Add a price greater than zero.' : '', !form.description.trim() ? 'Add a description.' : '', !form.availability.trim() ? 'Add availability details.' : ''].filter(Boolean);
    setErrors(next);
    if (next.length || !session) return;
    const base = { title: form.title.trim(), category: form.category, location: form.location.trim(), state: form.state.trim(), price: Number(form.price), duration: form.duration.trim(), guests: form.guests.trim(), description: form.description.trim(), availability: form.availability.trim(), tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 4), guide: session.name, initials: session.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(), accent: form.category === 'Fishing' ? '#26676b' : form.category === 'Snowmobile' ? '#375a67' : form.category === 'Dirt bike' ? '#6b4938' : '#a65327', rating: 5, reviews: 0, ownerId: session.id };
    const nextListings = editingId ? listings.map((listing) => listing.id === editingId ? { ...listing, ...base } : listing) : [...listings, { id: makeId('adventure'), ...base }];
    onListingsChange(nextListings);
    reset();
  };
  const edit = (listing: Listing) => {
    setEditingId(listing.id);
    setForm({ title: listing.title, category: listing.category, location: listing.location, state: listing.state, price: String(listing.price), duration: listing.duration, guests: listing.guests, description: listing.description, availability: listing.availability, tags: listing.tags.join(', ') });
    document.getElementById('guide-area')?.scrollIntoView({ behavior: 'smooth' });
  };
  if (!session || session.role !== 'guide') return <section id="guide-area" className="bg-[hsl(var(--background))] px-5 py-16 md:px-8 md:py-24"><div className="mx-auto max-w-[900px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-7 md:p-10"><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[hsl(var(--accent))]">For local experts</p><h2 className="mt-3 max-w-2xl font-display text-5xl font-black uppercase leading-[.84] md:text-7xl">Put your<br /><span className="text-[hsl(var(--accent))]">ground on the map.</span></h2><p className="mt-5 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">Create a guide account, publish your own trips, and manage your dates from one simple dashboard. Everything is saved on this device for this MVP.</p><button type="button" onClick={() => onAuth('guide', 'register')} className="mt-7 flex items-center gap-2 bg-[hsl(var(--accent))] px-6 py-4 font-bold text-white" data-testid="button-guide-register">Register as a guide <ArrowRight size={18} /></button></div></section>;
  return <section id="guide-area" className="bg-[hsl(var(--background))] px-5 py-16 md:px-8 md:py-24"><div className="mx-auto max-w-[1240px]"><div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[hsl(var(--accent))]">Guide dashboard</p><h2 className="mt-3 font-display text-5xl font-black uppercase leading-[.84] md:text-7xl">Your trips.<br /><span className="text-[hsl(var(--accent))]">Your rules.</span></h2></div><p className="max-w-sm text-sm leading-6 text-[hsl(var(--muted-foreground))]">Welcome, {session.name}. Add an adventure below, then edit or remove your own listings whenever you need.</p></div><div className="grid gap-7 lg:grid-cols-[1fr_1.15fr]"><form onSubmit={submit} className="border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 md:p-7" noValidate><div className="mb-5 flex items-center justify-between"><h3 className="font-display text-3xl font-bold uppercase">{editingId ? 'Edit adventure' : 'Add an adventure'}</h3>{editingId && <button type="button" onClick={reset} className="text-xs font-semibold text-[hsl(var(--muted-foreground))]" data-testid="button-cancel-edit">Cancel edit</button>}</div>{errors.length > 0 && <div className="mb-4 border-l-4 border-[hsl(var(--accent))] bg-[hsl(var(--muted))] p-3 text-sm" role="alert" data-testid="status-guide-listing-error">{errors.map((error) => <p key={error}>{error}</p>)}</div>}<div className="space-y-4"><label className="block text-sm font-semibold">Adventure title<input value={form.title} onChange={update('title')} className="mt-1.5 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none focus:border-[hsl(var(--accent))]" placeholder="e.g. Spring turkey camp" data-testid="input-listing-title" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Category<select value={form.category} onChange={update('category')} className="mt-1.5 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none focus:border-[hsl(var(--accent))]" data-testid="select-listing-category">{categories.slice(1).map(({ label }) => <option key={label} value={label}>{label}</option>)}</select></label><label className="block text-sm font-semibold">Price / person<input type="number" min="1" value={form.price} onChange={update('price')} className="mt-1.5 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none focus:border-[hsl(var(--accent))]" placeholder="350" data-testid="input-listing-price" /></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Location<input value={form.location} onChange={update('location')} className="mt-1.5 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none focus:border-[hsl(var(--accent))]" placeholder="Cimarron Range" data-testid="input-listing-location" /></label><label className="block text-sm font-semibold">State / region<input value={form.state} onChange={update('state')} className="mt-1.5 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none focus:border-[hsl(var(--accent))]" placeholder="New Mexico" data-testid="input-listing-state" /></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Duration<input value={form.duration} onChange={update('duration')} className="mt-1.5 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none focus:border-[hsl(var(--accent))]" placeholder="Full day" data-testid="input-listing-duration" /></label><label className="block text-sm font-semibold">Group size<input value={form.guests} onChange={update('guests')} className="mt-1.5 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none focus:border-[hsl(var(--accent))]" placeholder="1–4 guests" data-testid="input-listing-guests" /></label></div><label className="block text-sm font-semibold">Availability<input value={form.availability} onChange={update('availability')} className="mt-1.5 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none focus:border-[hsl(var(--accent))]" placeholder="May–October · 4 spots left" data-testid="input-listing-availability" /></label><label className="block text-sm font-semibold">Description<textarea value={form.description} onChange={update('description')} className="mt-1.5 min-h-24 w-full resize-y border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none focus:border-[hsl(var(--accent))]" placeholder="What will guests experience?" data-testid="input-listing-description" /></label><label className="block text-sm font-semibold">Tags <span className="font-normal text-[hsl(var(--muted-foreground))]">(comma separated)</span><input value={form.tags} onChange={update('tags')} className="mt-1.5 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none focus:border-[hsl(var(--accent))]" placeholder="Archery, Backcountry" data-testid="input-listing-tags" /></label><button type="submit" className="flex w-full items-center justify-center gap-2 bg-[hsl(var(--accent))] px-5 py-3 font-bold text-white" data-testid="button-save-listing">{editingId ? <Edit3 size={17} /> : <Plus size={17} />}{editingId ? 'Save changes' : 'Publish adventure'}</button></div></form><div className="space-y-3">{mine.length === 0 ? <div className="border border-dashed border-[hsl(var(--border))] p-8 text-center"><LayoutDashboard className="mx-auto mb-3 text-[hsl(var(--accent))]" size={30} /><h3 className="font-display text-3xl font-bold uppercase">No listings yet</h3><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Your published adventures will appear here.</p></div> : mine.map((listing) => <div key={listing.id} className="flex flex-col gap-4 border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.12em] text-[hsl(var(--accent))]">{listing.category} · {listing.location}</p><h3 className="mt-1 font-display text-3xl font-bold uppercase">{listing.title}</h3><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">${listing.price} / person · {listing.availability}</p></div><div className="flex shrink-0 gap-2"><button type="button" onClick={() => edit(listing)} className="flex items-center gap-2 border border-[hsl(var(--border))] px-3 py-2 text-sm font-semibold" data-testid={`button-edit-listing-${listing.id}`}><Edit3 size={15} /> Edit</button><button type="button" onClick={() => { if (window.confirm('Remove this adventure?')) onListingsChange(listings.filter((item) => item.id !== listing.id)); }} className="flex items-center gap-2 border border-red-300 px-3 py-2 text-sm font-semibold text-red-700" data-testid={`button-delete-listing-${listing.id}`}><Trash2 size={15} /> Delete</button></div></div>)}</div></div></div></section>;
}

function MyBookings({ session, bookings, onAuth, onBrowse }: { session: User | null; bookings: Booking[]; onAuth: (role: Role, view?: 'login' | 'register') => void; onBrowse: () => void }) {
  const mine = session?.role === 'customer' ? bookings.filter((booking) => booking.email === session.email) : [];
  return <section id="my-bookings" className="border-y border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-16 md:px-8 md:py-20"><div className="mx-auto max-w-[1240px]"><div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[hsl(var(--accent))]">Your plans</p><h2 className="mt-3 font-display text-5xl font-black uppercase leading-[.84] md:text-6xl">My bookings.</h2></div>{session?.role === 'customer' && <button type="button" onClick={onBrowse} className="flex items-center gap-2 self-start border border-[hsl(var(--primary))] px-4 py-3 text-sm font-bold" data-testid="button-book-another">Book another trip <ArrowRight size={16} /></button>}</div>{!session || session.role !== 'customer' ? <div className="line-grid border border-dashed border-[hsl(var(--border))] p-8 text-center"><UserRound className="mx-auto mb-3 text-[hsl(var(--accent))]" size={30} /><h3 className="font-display text-3xl font-bold uppercase">Sign in to keep your plans close</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[hsl(var(--muted-foreground))]">Create a customer account or sign in to see every booking saved to this device.</p><button type="button" onClick={() => onAuth('customer', 'login')} className="mt-6 bg-[hsl(var(--primary))] px-5 py-3 text-sm font-bold text-[hsl(var(--primary-foreground))]" data-testid="button-view-bookings-login">Sign in to view bookings</button></div> : mine.length === 0 ? <div className="line-grid border border-dashed border-[hsl(var(--border))] p-8 text-center"><CalendarDays className="mx-auto mb-3 text-[hsl(var(--accent))]" size={30} /><h3 className="font-display text-3xl font-bold uppercase">No bookings yet</h3><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Find a trip that feels right and your confirmation will land here.</p><button type="button" onClick={onBrowse} className="mt-6 bg-[hsl(var(--accent))] px-5 py-3 text-sm font-bold text-white" data-testid="button-find-first-trip">Find an adventure</button></div> : <div className="grid gap-4 md:grid-cols-2">{mine.map((booking) => <article key={booking.id} className="border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-5" data-testid={`card-booking-${booking.id}`}><div className="flex items-start justify-between gap-4"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.12em] text-[hsl(var(--accent))]">{booking.category} · {booking.location}</p><h3 className="mt-1 font-display text-3xl font-bold uppercase">{booking.listingTitle}</h3></div><Check className="shrink-0 text-[hsl(var(--accent))]" size={21} /></div><div className="mt-4 grid gap-2 border-t border-[hsl(var(--border))] pt-4 text-sm sm:grid-cols-2"><p><strong>Date:</strong> {booking.date}</p><p><strong>Party:</strong> {booking.partySize}</p><p><strong>Guide:</strong> {booking.guide}</p><p><strong>Total:</strong> ${booking.total.toLocaleString()}</p></div><p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">Confirmation saved locally for {booking.name}.</p></article>)}</div>}</div></section>;
}

function Home() {
  const [category, setCategory] = useState<Category>('All trips');
  const [listings, setListings] = useState<Listing[]>(() => readLocal('outlaw-listings', starterListings));
  const [bookings, setBookings] = useState<Booking[]>(() => readLocal('outlaw-bookings', []));
  const [session, setSession] = useState<User | null>(() => readLocal<User | null>('outlaw-session', null));
  const [auth, setAuth] = useState<{ role: Role; view: 'login' | 'register' } | null>(null);
  const [details, setDetails] = useState<Listing | null>(null);
  const [booking, setBooking] = useState<Listing | null>(null);
  const browse = () => document.getElementById('trips')?.scrollIntoView({ behavior: 'smooth' });
  const guideArea = () => {
    if (session?.role !== 'guide') setAuth({ role: 'guide', view: 'register' });
    else document.getElementById('guide-area')?.scrollIntoView({ behavior: 'smooth' });
  };
  const myBookings = () => document.getElementById('my-bookings')?.scrollIntoView({ behavior: 'smooth' });
  const updateListings = (next: Listing[]) => { setListings(next); saveLocal('outlaw-listings', next); };
  const logout = () => { window.localStorage.removeItem('outlaw-session'); setSession(null); };
  useEffect(() => {
    document.title = 'OUTLAW Adventures — Find your kind of wild';
    const description = 'Book trusted, high-adrenaline guided trips with local outfitters across hunting, fishing, ATV, dirt bike, and snowmobile adventures.';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement('meta'); meta.setAttribute('name', 'description'); document.head.appendChild(meta); }
    meta.setAttribute('content', description);
    [['og:title', 'OUTLAW Adventures — Find your kind of wild'], ['og:description', description], ['og:type', 'website'], ['og:image', heroImage]].forEach(([property, content]) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) { tag = document.createElement('meta'); tag.setAttribute('property', property); document.head.appendChild(tag); }
      tag.setAttribute('content', content);
    });
  }, []);
  return <div className="min-h-[100dvh] bg-[hsl(var(--background))]"><Header session={session} onAuth={(role, view = 'login') => setAuth({ role, view })} onBrowse={browse} onMyBookings={myBookings} onGuideArea={guideArea} onLogout={logout} /><Hero onBrowse={browse} onRegister={() => setAuth({ role: 'customer', view: 'register' })} /><CategoryBar active={category} onChange={setCategory} /><Listings listings={listings} activeCategory={category} onCategory={setCategory} onDetails={setDetails} /><MyBookings session={session} bookings={bookings} onAuth={(role, view = 'login') => setAuth({ role, view })} onBrowse={browse} /><TrustStrip /><HowItWorks /><GuideDashboard session={session} listings={listings} onListingsChange={updateListings} onAuth={(role, view = 'login') => setAuth({ role, view })} /><GuideBanner onGuide={guideArea} /><Footer onRegister={() => setAuth({ role: 'customer', view: 'register' })} onGuide={guideArea} />{auth && <AuthModal role={auth.role} initialView={auth.view} onClose={() => setAuth(null)} onSignedIn={(user) => { setSession(user); if (user.role === 'guide') setTimeout(() => document.getElementById('guide-area')?.scrollIntoView({ behavior: 'smooth' }), 0); }} />}{details && <AdventureDetails listing={details} onClose={() => setDetails(null)} onBook={() => { setBooking(details); setDetails(null); }} />}{booking && <BookingModal listing={booking} session={session} onClose={() => setBooking(null)} onBooked={(next) => setBookings((current) => [next, ...current])} />}</div>;
}

function Router() {
  return <RoutedErrorBoundary><Switch><Route path="/" component={Home} /><Route component={NotFound} /></Switch></RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;