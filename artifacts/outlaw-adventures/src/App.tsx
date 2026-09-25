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
  Fish,
  Flame,
  MapPin,
  Menu,
  Mountain,
  ShieldCheck,
  Snowflake,
  Star,
  TentTree,
  Truck,
  UserRound,
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
};

const listings: Listing[] = [
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

function saveLocal<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
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

function Header({ onRegister, onGuide, onBrowse }: { onRegister: () => void; onGuide: () => void; onBrowse: () => void }) {
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
          <button type="button" onClick={onGuide} className="font-mono-ui text-[11px] uppercase tracking-[.14em] text-white/80 transition hover:text-white" data-testid="link-become-guide">Become a guide</button>
          <button type="button" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="font-mono-ui text-[11px] uppercase tracking-[.14em] text-white/80 transition hover:text-white" data-testid="link-how-it-works">How it works</button>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <button type="button" onClick={onRegister} className="px-3 py-2 text-sm font-semibold text-white/85 transition hover:text-white" data-testid="button-register-customer">Sign in / Register</button>
          <button type="button" onClick={onGuide} className="border border-white/55 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]" data-testid="button-list-adventure">List your adventure</button>
        </div>
        <button type="button" onClick={() => setOpen((v) => !v)} className="grid h-11 w-11 place-items-center border border-white/30 text-white md:hidden" aria-label="Toggle menu" data-testid="button-mobile-menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <div className="border-t border-white/15 bg-[hsl(155_28%_13%/.97)] px-5 py-5 md:hidden">
          <div className="flex flex-col gap-1">
            <button type="button" onClick={() => closeAnd(onBrowse)} className="flex items-center justify-between border-b border-white/10 py-4 text-left font-display text-2xl font-bold uppercase" data-testid="mobile-browse-trips">Find an adventure <ArrowRight size={20} /></button>
            <button type="button" onClick={() => closeAnd(onGuide)} className="flex items-center justify-between border-b border-white/10 py-4 text-left font-display text-2xl font-bold uppercase" data-testid="mobile-become-guide">Become a guide <ArrowRight size={20} /></button>
            <button type="button" onClick={() => closeAnd(onRegister)} className="mt-4 bg-[hsl(var(--accent))] px-4 py-3 text-left font-semibold text-white" data-testid="mobile-register">Sign in / Register <ArrowRight className="float-right" size={20} /></button>
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

function ListingCard({ listing, onBook }: { listing: Listing; onBook: (listing: Listing) => void }) {
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
        <div className="mt-5 flex items-end justify-between border-t border-[hsl(var(--border))] pt-4">
          <div><p className="font-mono-ui text-[9px] uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))]">From / person</p><p className="font-display text-3xl font-bold">${listing.price}<span className="font-sans text-sm font-normal text-[hsl(var(--muted-foreground))]"> / day</span></p></div>
          <button type="button" onClick={() => onBook(listing)} className="flex items-center gap-2 bg-[hsl(var(--primary))] px-4 py-3 text-sm font-bold text-[hsl(var(--primary-foreground))] transition hover:bg-[hsl(var(--accent))]" data-testid={`button-book-${listing.id}`}>Book this trip <ArrowRight size={16} /></button>
        </div>
      </div>
    </article>
  );
}

function Listings({ activeCategory, onCategory, onBook }: { activeCategory: Category; onCategory: (cat: Category) => void; onBook: (listing: Listing) => void }) {
  const filtered = useMemo(() => activeCategory === 'All trips' ? listings : listings.filter((item) => item.category === activeCategory), [activeCategory]);
  return (
    <section className="bg-[hsl(var(--background))] py-16 md:py-24">
      <div className="mx-auto max-w-[1240px] px-5 md:px-8">
        <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><div className="mb-3 flex items-center gap-3 font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--accent))]"><span className="h-px w-8 bg-[hsl(var(--accent))]" /> Pick your kind of trouble</div><h2 className="font-display text-5xl font-black uppercase leading-[.84] md:text-7xl">The good stuff<br /><span className="text-[hsl(var(--accent))]">starts here.</span></h2></div>
          <p className="max-w-[330px] text-sm leading-6 text-[hsl(var(--muted-foreground))]">Every trip is run by a real local guide. No faceless operators. No mystery itineraries. Just the right person for the right piece of wild.</p>
        </div>
        {filtered.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{filtered.map((listing) => <ListingCard key={listing.id} listing={listing} onBook={onBook} />)}</div> : <div className="line-grid border border-dashed border-[hsl(var(--border))] px-6 py-16 text-center"><Compass className="mx-auto mb-4 text-[hsl(var(--accent))]" size={32} /><h3 className="font-display text-3xl font-bold uppercase">No trips in this neck of the woods</h3><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Try another category. More local guides are joining every week.</p><button type="button" onClick={() => onCategory('All trips')} className="mt-6 border border-[hsl(var(--primary))] px-4 py-2 text-sm font-bold" data-testid="button-reset-filters">Show all trips</button></div>}
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

function RegisterModal({ mode, onClose }: ModalProps & { mode: 'customer' | 'guide' }) {
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', experience: '', region: '' });
  const isGuide = mode === 'guide';
  const update = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((value) => ({ ...value, [field]: event.target.value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = [!form.name.trim() ? 'Name is required.' : '', !/^\S+@\S+\.\S+$/.test(form.email) ? 'Enter a valid email.' : '', isGuide && !form.experience.trim() ? 'Tell us a little about your guiding experience.' : ''].filter(Boolean);
    setErrors(next);
    if (next.length) return;
    saveLocal('outlaw-registration', { ...form, mode, createdAt: new Date().toISOString() });
    setSubmitted(true);
  };
  if (submitted) return <ModalShell title={isGuide ? 'You are on the list.' : 'Welcome to the crew.'} eyebrow="Registration saved" onClose={onClose}><div className="py-5 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[hsl(var(--accent))] text-white"><Check size={30} /></div><p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-[hsl(var(--muted-foreground))]">{isGuide ? 'We saved your guide profile locally. In the full marketplace, our team would follow up to verify your experience and territory.' : 'Your demo account is saved on this device. When you find the right trip, your details will be ready to go.'}</p><button type="button" onClick={onClose} className="mt-7 bg-[hsl(var(--primary))] px-6 py-3 font-bold text-[hsl(var(--primary-foreground))]" data-testid="button-registration-done">Back to adventures</button></div></ModalShell>;
  return <ModalShell title={isGuide ? 'Put your ground on the map.' : 'Get outside more often.'} eyebrow={isGuide ? 'Guide registration' : 'Customer registration'} onClose={onClose}><p className="mb-6 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{isGuide ? 'Tell us who you are and where you do your best work. This demo saves your application on this device.' : 'Make booking your next day out quick. This demo saves your account on this device.'}</p><form onSubmit={submit} className="space-y-4" noValidate>{errors.length > 0 && <div className="border-l-4 border-[hsl(var(--accent))] bg-[hsl(var(--muted))] p-3 text-sm text-[hsl(var(--foreground))]" role="alert" data-testid="status-registration-error">{errors.map((error) => <p key={error}>{error}</p>)}</div>}<label className="block text-sm font-semibold">Full name<input value={form.name} onChange={update('name')} className="mt-1.5 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none transition focus:border-[hsl(var(--accent))]" placeholder="Your name" data-testid="input-registration-name" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Email<input type="email" value={form.email} onChange={update('email')} className="mt-1.5 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none focus:border-[hsl(var(--accent))]" placeholder="you@example.com" data-testid="input-registration-email" /></label><label className="block text-sm font-semibold">Phone <span className="font-normal text-[hsl(var(--muted-foreground))]">(optional)</span><input value={form.phone} onChange={update('phone')} className="mt-1.5 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none focus:border-[hsl(var(--accent))]" placeholder="(555) 123-4567" data-testid="input-registration-phone" /></label></div>{isGuide ? <><label className="block text-sm font-semibold">Home region<input value={form.region} onChange={update('region')} className="mt-1.5 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none focus:border-[hsl(var(--accent))]" placeholder="e.g. Western Montana" data-testid="input-guide-region" /></label><label className="block text-sm font-semibold">Guiding experience<textarea value={form.experience} onChange={update('experience')} className="mt-1.5 min-h-24 w-full resize-y border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none focus:border-[hsl(var(--accent))]" placeholder="What do you guide, and what makes your trips different?" data-testid="input-guide-experience" /></label></> : <label className="block text-sm font-semibold">What kind of trip are you chasing? <span className="font-normal text-[hsl(var(--muted-foreground))]">(optional)</span><input value={form.region} onChange={update('region')} className="mt-1.5 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none focus:border-[hsl(var(--accent))]" placeholder="Hunting, fishing, trail riding..." data-testid="input-customer-interest" /></label>}<div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="px-5 py-3 text-sm font-semibold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" data-testid="button-registration-cancel">Cancel</button><button type="submit" className="bg-[hsl(var(--accent))] px-6 py-3 text-sm font-bold text-white hover:bg-[#f17b38]" data-testid="button-registration-submit">{isGuide ? 'Submit guide profile' : 'Create demo account'}</button></div></form></ModalShell>;
}

function BookingModal({ listing, onClose }: ModalProps & { listing: Listing }) {
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState('');
  const [form, setForm] = useState({ date: '', guests: '1', name: '', email: '' });
  const total = listing.price * Number(form.guests || 1);
  const update = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((value) => ({ ...value, [field]: event.target.value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.date || !form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) { setErrors('Add a date, your name, and a valid email to continue.'); return; }
    setErrors('');
    saveLocal('outlaw-booking', { ...form, listingId: listing.id, listing: listing.title, total, createdAt: new Date().toISOString() });
    setSubmitted(true);
  };
  if (submitted) return <ModalShell title="You are booked for the wild." eyebrow="Demo booking confirmed" onClose={onClose}><div className="py-2"><div className="flex items-center gap-3 border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4"><Check className="text-[hsl(var(--accent))]" size={23} /><div><p className="font-bold">{listing.title}</p><p className="text-sm text-[hsl(var(--muted-foreground))]">{form.date} · {form.guests} {Number(form.guests) === 1 ? 'guest' : 'guests'}</p></div></div><p className="mt-6 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Your demo booking is saved on this device. In a live booking, {listing.guide} would receive your request and you would get the meet-up details by email.</p><div className="mt-6 flex items-center justify-between border-t border-[hsl(var(--border))] pt-5"><span className="font-mono-ui text-[10px] uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))]">Demo total</span><span className="font-display text-3xl font-bold">${total.toLocaleString()}</span></div><button type="button" onClick={onClose} className="mt-7 w-full bg-[hsl(var(--primary))] px-6 py-3 font-bold text-[hsl(var(--primary-foreground))]" data-testid="button-booking-done">Done</button></div></ModalShell>;
  return <ModalShell title={`Book ${listing.title}`} eyebrow="Secure your spot · demo checkout" onClose={onClose}><div className="mb-5 flex items-start justify-between gap-4 border-b border-[hsl(var(--border))] pb-5"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-[hsl(var(--muted-foreground))]">{listing.location}, {listing.state}</p><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">with {listing.guide} · {listing.duration}</p></div><p className="font-display text-3xl font-bold">${listing.price}<span className="font-sans text-sm font-normal text-[hsl(var(--muted-foreground))]"> / guest</span></p></div><div className="mb-5 flex gap-3 bg-[hsl(20_86%_52%/.1)] p-3 text-xs leading-5 text-[hsl(var(--foreground))]"><ShieldCheck className="shrink-0 text-[hsl(var(--accent))]" size={17} /> This is a demo checkout. No card details are requested and no live payment is processed.</div><form onSubmit={submit} className="space-y-4" noValidate>{errors && <p className="border-l-4 border-[hsl(var(--accent))] bg-[hsl(var(--muted))] p-3 text-sm" role="alert" data-testid="status-booking-error">{errors}</p>}<div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Adventure date<input type="date" min={new Date().toISOString().split('T')[0]} value={form.date} onChange={update('date')} className="mt-1.5 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none focus:border-[hsl(var(--accent))]" data-testid="input-booking-date" /></label><label className="block text-sm font-semibold">Guests<select value={form.guests} onChange={update('guests')} className="mt-1.5 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none focus:border-[hsl(var(--accent))]" data-testid="select-booking-guests">{[1, 2, 3, 4, 5, 6, 7, 8].map((count) => <option key={count} value={count}>{count} {count === 1 ? 'guest' : 'guests'}</option>)}</select></label></div><label className="block text-sm font-semibold">Your name<input value={form.name} onChange={update('name')} className="mt-1.5 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none focus:border-[hsl(var(--accent))]" placeholder="Name for the booking" data-testid="input-booking-name" /></label><label className="block text-sm font-semibold">Email for confirmation<input type="email" value={form.email} onChange={update('email')} className="mt-1.5 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 outline-none focus:border-[hsl(var(--accent))]" placeholder="you@example.com" data-testid="input-booking-email" /></label><div className="flex items-center justify-between border-t border-[hsl(var(--border))] pt-5"><span className="font-mono-ui text-[10px] uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))]">Estimated demo total</span><span className="font-display text-3xl font-bold">${total.toLocaleString()}</span></div><div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="px-5 py-3 text-sm font-semibold text-[hsl(var(--muted-foreground))]" data-testid="button-booking-cancel">Cancel</button><button type="submit" className="bg-[hsl(var(--accent))] px-6 py-3 text-sm font-bold text-white hover:bg-[#f17b38]" data-testid="button-booking-submit">Confirm demo booking</button></div></form></ModalShell>;
}

function Home() {
  const [category, setCategory] = useState<Category>('All trips');
  const [modal, setModal] = useState<'customer' | 'guide' | null>(null);
  const [booking, setBooking] = useState<Listing | null>(null);
  const browse = () => document.getElementById('trips')?.scrollIntoView({ behavior: 'smooth' });
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
  return <div className="min-h-[100dvh] bg-[hsl(var(--background))]"><Header onRegister={() => setModal('customer')} onGuide={() => setModal('guide')} onBrowse={browse} /><Hero onBrowse={browse} onRegister={() => setModal('customer')} /><CategoryBar active={category} onChange={setCategory} /><Listings activeCategory={category} onCategory={setCategory} onBook={setBooking} /><TrustStrip /><HowItWorks /><GuideBanner onGuide={() => setModal('guide')} /><Footer onRegister={() => setModal('customer')} onGuide={() => setModal('guide')} />{modal && <RegisterModal mode={modal} onClose={() => setModal(null)} />}{booking && <BookingModal listing={booking} onClose={() => setBooking(null)} />}</div>;
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