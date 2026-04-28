import { useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MapPin, Star, Coffee, Camera, Bus, Crown, Check, ArrowRight,
  Compass, Globe, Users, ChevronDown, Heart,
  Shield, Menu, X, Leaf, Mountain, Sun, Wind,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import heroImage from '@/assets/landing-hero.jpg';

/* animation variants */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const fadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const heading: Variants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
};

/* data */
const features = [
  { icon: Leaf, title: 'Eco-Friendly Spots', desc: 'Discover sustainable destinations that respect nature.' },
  { icon: Mountain, title: 'Mountain Retreats', desc: 'Find peaceful mountain getaways and hiking trails.' },
  { icon: Sun, title: 'Beach Paradises', desc: 'Explore pristine beaches and coastal wonders.' },
  { icon: Camera, title: 'Nature Gallery', desc: 'Browse stunning photos of natural landscapes.' },
  { icon: Wind, title: 'Fresh Air Escapes', desc: 'Visit locations known for clean air and serenity.' },
  { icon: Users, title: 'Community Reviews', desc: 'Read authentic reviews from nature lovers.' },
];

const plans = [
  {
    name: 'Explorer',
    price: '₱0',
    period: '',
    desc: 'Perfect for getting started.',
    features: [
      'Access to all tourist spots',
      'Basic ratings & reviews',
      'Community gallery',
      'Transport guide (basic)',
      'Email support',
    ],
    popular: false,
    buttonText: 'Start Free',
  },
  {
    name: 'Wanderer',
    price: '₱49',
    period: '/mo',
    desc: 'Perfect for casual travelers.',
    features: [
      'Access to all tourist spots',
      'Basic ratings & reviews',
      'Transport guide',
      'Community gallery',
      'Email support',
    ],
    popular: false,
    buttonText: 'Choose Plan',
  },
  {
    name: 'Adventurer',
    price: '₱99',
    period: '/mo',
    desc: 'For frequent travelers who want it all.',
    features: [
      'Everything in Wanderer',
      'Priority recommendations',
      'Advanced filters',
      'Offline guides',
      'Save favorites',
      'Priority support',
    ],
    popular: true,
    buttonText: 'Get Started',
  },
  {
    name: 'Guardian',
    price: '₱149',
    period: '/mo',
    desc: 'For agencies managing listings.',
    features: [
      'Everything in Adventurer',
      'Business listing management',
      'Analytics dashboard',
      'Promote your spots',
      'API access',
      'Dedicated manager',
    ],
    popular: false,
    buttonText: 'Choose Plan',
  },
];

const steps = [
  { n: '01', title: 'Create Account', desc: 'Sign up free and set up your traveler profile.', icon: Users },
  { n: '02', title: 'Browse & Discover', desc: 'Search natural spots, eco-lodges, and serene cafes.', icon: Compass },
  { n: '03', title: 'Rate & Share', desc: 'Leave ratings and help protect our natural treasures.', icon: Heart },
];

const navLinks = [
  { label: 'Features', id: 'features' },
  { label: 'How It Works', id: 'steps' },
  { label: 'Pricing', id: 'pricing' },
];

// Custom hook for counting animation
function useCountUp(targetValue: number, duration: number = 2000, isInteger: boolean = true) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      let value = targetValue * eased;
      
      if (isInteger) {
        value = Math.floor(value);
      } else {
        value = Number(value.toFixed(1));
      }
      
      setCount(value);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [targetValue, duration, isInteger]);

  return count;
}

// Animated stat component
function AnimatedStat({ label, targetValue, suffix, icon: Icon, isInteger }: {
  label: string;
  targetValue: number;
  suffix: string;
  icon: any;
  isInteger: boolean;
}) {
  const value = useCountUp(targetValue, 2000, isInteger);

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-xl px-4 py-3 border border-emerald-100 shadow-sm">
      <Icon className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
      <div className="text-xl sm:text-2xl font-bold text-stone-800">
        {value.toLocaleString()}{suffix}
      </div>
      <div className="text-xs text-stone-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);
  
  const [stats, setStats] = useState([
    ]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prevStats => 
        prevStats.map(stat => ({
          ...stat,
          targetValue: stat.targetValue + Math.floor(Math.random() * (stat.label === 'Explorers' ? 3 : 
                           stat.label === 'Experiences' ? 5 : 
                           stat.label === 'Natural Spots' ? 1 : 0)),
        }))
      );
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const scroll = (id: string) => {
    setMobileMenu(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-amber-50 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-amber-100">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-600 to-amber-600 flex items-center justify-center shadow-md">
              <img src="/favicon.ico" alt="SpotFind" className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 via-amber-600 to-emerald-600 bg-clip-text text-transparent tracking-tight">
              SpotFind
            </span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((l) => (
              <button key={l.id} onClick={() => scroll(l.id)} className="text-sm text-stone-600 hover:text-emerald-600 transition-colors">
                {l.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="text-stone-600 hover:text-emerald-600">Log in</Button>
            <Button size="sm" onClick={() => navigate('/login')} className="rounded-lg bg-gradient-to-r from-emerald-600 to-amber-600 text-white hover:from-emerald-700 hover:to-amber-700">
              Get Started
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-amber-100 px-4 pb-4"
          >
            <div className="flex flex-col gap-3 pt-2">
              {navLinks.map((l) => (
                <button key={l.id} onClick={() => scroll(l.id)} className="text-sm text-stone-600 hover:text-emerald-600 text-left py-1">
                  {l.label}
                </button>
              ))}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate('/login')}>Log in</Button>
                <Button size="sm" className="flex-1 rounded-lg bg-gradient-to-r from-emerald-600 to-amber-600 text-white" onClick={() => navigate('/login')}>Get Started</Button>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center">
        <img
          src={heroImage}
          alt="Beautiful Philippine islands aerial view"
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-stone-50" />

        <div className="relative z-10 container mx-auto px-4 text-center pt-20 pb-10">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge className="mb-5 bg-white/20 text-white border-white/30 backdrop-blur-md text-sm px-5 py-1.5 rounded-full">
              <Globe className="h-3.5 w-3.5 mr-2" /> Discover Nature's Paradise
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-[1.1] mb-5 drop-shadow-lg"
          >
            Find Your Next{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent">
              Adventure
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-white/90 max-w-xl mx-auto mb-8 leading-relaxed"
          >
            Explore pristine natural spots, eco-friendly accommodations, and local culture — all rated by nature lovers like you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-col sm:flex-row gap-3 justify-center mb-12"
          >
            <Button size="lg" onClick={() => navigate('/login')} className="rounded-lg px-8 bg-gradient-to-r from-emerald-600 to-amber-600 text-white hover:from-emerald-700 hover:to-amber-700 shadow-lg">
              Start Exploring <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-lg px-8 border-white/30 text-white hover:bg-white/10 bg-white/5 backdrop-blur-sm"
              onClick={() => scroll('pricing')}
            >
              View Plans
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto"
          >
            {stats.map((stat) => (
              <AnimatedStat
                key={stat.label}
                label={stat.label}
                targetValue={stat.targetValue}
                suffix={stat.suffix}
                icon={stat.icon}
                isInteger={stat.isInteger}
              />
            ))}
          </motion.div>
        </div>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
        >
          <ChevronDown className="h-5 w-5 text-white/40" />
        </motion.div>
      </section>

      {/* How It Works */}
      <section id="steps" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <SectionTitle badge="Simple Process" title="How It Works" subtitle="Start your nature journey in minutes and discover eco-friendly experiences." />

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-12"
          >
            {steps.map((s, i) => (
              <motion.div key={s.n} variants={fadeUp} custom={i} className="text-center group">
                <div className="relative inline-block mb-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="h-16 w-16 rounded-xl bg-gradient-to-br from-emerald-50 to-amber-50 flex items-center justify-center mx-auto border border-emerald-100"
                  >
                    <s.icon className="h-7 w-7 text-emerald-600" />
                  </motion.div>
                  <span className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-gradient-to-r from-emerald-600 to-amber-600 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                    {s.n}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-stone-800 mb-1.5">{s.title}</h3>
                <p className="text-sm text-stone-600 max-w-[240px] mx-auto">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gradient-to-b from-stone-50 to-amber-50">
        <div className="container mx-auto px-4">
          <SectionTitle badge="Natural Features" title="What We Offer" subtitle="Everything you need to explore nature responsibly and sustainably." />

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto mt-12"
          >
            {features.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} custom={i}>
                <Card className="group h-full border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all duration-300 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-emerald-50 to-amber-50 flex items-center justify-center mb-3 group-hover:from-emerald-100 group-hover:to-amber-100 transition-colors border border-emerald-100">
                      <f.icon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <CardTitle className="text-base text-stone-800">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-stone-600 text-sm leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <SectionTitle badge="Membership Plans" title="Choose Your Journey" subtitle="Select the perfect plan for your travel needs. Start for free, upgrade anytime." />

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto items-stretch mt-12"
          >
            {plans.map((p, i) => (
              <motion.div key={p.name} variants={fadeUp} custom={i} className="flex">
                <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300 }} className="flex w-full">
                  <Card className={`relative flex flex-col w-full transition-all duration-300 ${
                    p.popular
                      ? 'border-emerald-300 shadow-lg ring-1 ring-emerald-200 bg-gradient-to-br from-white to-emerald-50'
                      : 'border-stone-200 hover:border-emerald-200 hover:shadow-md'
                  }`}>
                    {p.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-emerald-600 to-amber-600 text-white shadow-sm px-4 rounded-full text-xs">
                          <Crown className="h-3 w-3 mr-1" /> Most Popular
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="text-center pb-1 pt-8">
                      <CardTitle className="text-lg text-stone-800">{p.name}</CardTitle>
                      <p className="text-stone-600 text-sm mt-1">{p.desc}</p>
                    </CardHeader>
                    <CardContent className="text-center flex-1">
                      <div className="my-5">
                        <span className="text-4xl sm:text-5xl font-extrabold text-stone-800">{p.price}</span>
                        {p.period && <span className="text-stone-500 text-sm">{p.period}</span>}
                      </div>
                      <ul className="space-y-2.5 text-left">
                        {p.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                            <span className="text-stone-700">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter className="pt-3">
                      <Button
                        className="w-full rounded-lg bg-gradient-to-r from-emerald-600 to-amber-600 text-white hover:from-emerald-700 hover:to-amber-700"
                        variant={p.popular ? 'default' : (p.name === 'Explorer' ? 'outline' : 'default')}
                        size="lg"
                        onClick={() => navigate('/login')}
                      >
                        {p.buttonText}
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-amber-600">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={fadeInScale}
            className="max-w-3xl mx-auto text-center"
          >
            <Leaf className="h-10 w-10 text-white/80 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Ready to Connect with Nature?</h2>
            <p className="text-white/80 mb-7 max-w-md mx-auto text-sm sm:text-base">
              Join thousands of nature lovers discovering the best eco-friendly spots in the Philippines.
            </p>
            <Button
              size="lg"
              className="bg-white text-emerald-600 hover:bg-white/90 rounded-lg px-8 font-semibold shadow-md"
              onClick={() => navigate('/login')}
            >
              Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="py-10 border-t border-emerald-100 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-stone-500 text-sm">
            <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-emerald-600" /> Eco-Friendly</span>
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-emerald-600" /> 12K+ Nature Lovers</span>
            <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-emerald-600" /> 4.9 Rating</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-emerald-100 bg-gradient-to-b from-stone-50 to-amber-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-600 to-amber-600 flex items-center justify-center">
                <img src="/favicon.ico" alt="SpotFind" className="h-4 w-4" />
              </div>
              <span className="font-bold bg-gradient-to-r from-emerald-600 via-amber-600 to-emerald-600 bg-clip-text text-transparent">
                SpotFind
              </span>
            </div>
            <div className="flex flex-wrap gap-5 text-sm text-stone-600">
              {navLinks.map((l) => (
                <button key={l.id} onClick={() => scroll(l.id)} className="hover:text-emerald-600 transition-colors">{l.label}</button>
              ))}
            </div>
            <p className="text-xs text-stone-500">© 2026 SpotFind. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* Reusable section title */
function SectionTitle({ badge, title, subtitle }: { badge: string; title: string; subtitle: string }) {
  return (
    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={heading} className="text-center">
      <Badge variant="secondary" className="mb-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border border-emerald-200">{badge}</Badge>
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-800 mb-3">{title}</h2>
      <p className="text-stone-600 max-w-lg mx-auto text-sm sm:text-base">{subtitle}</p>
    </motion.div>
  );
}