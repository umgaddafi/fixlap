import { ArrowRight, CheckCircle2, Clock3, HelpCircle, Laptop, Lock, Menu, MessageCircle, Phone, ShieldCheck, Smartphone, Sparkles, Tablet, User, Wrench, X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import BrandLogo from './components/BrandLogo';

type Props = { onStaffLogin: () => void; onClientLogin: () => void };
const services = [
  { icon: Smartphone, title: 'Phones', text: 'Screens, batteries, cameras and charging ports.', image: '/images/device-phone.jpg' },
  { icon: Laptop, title: 'Laptops', text: 'Diagnostics, keyboards, storage and operating systems.', image: '/images/device-laptop.jpg' },
  { icon: Tablet, title: 'Tablets', text: 'Displays, batteries, charging and software support.', image: '/images/device-tablet.jpg' }
];

export default function Landing({ onStaffLogin, onClientLogin }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 420);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when mobile menu drawer is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <main className="landing">
      {/* Sticky Top Navigation Bar */}
      <nav className="landing-nav">
        <a className="brand" href="#top">
          <BrandLogo size="md" />
        </a>
        <div className="landing-nav-links">
          <a href="#services">Services</a>
          <a href="#why">Why Kendat FixLap</a>
          <a href="#how">How it works</a>
          <a href="#testimonials">Reviews</a>
          <a href="#faq">FAQ</a>
        </div>
        <div className="landing-nav-actions">
          <button className="client-nav-cta" onClick={onClientLogin}>
            Book a repair <ArrowRight size={15}/>
          </button>
          <button 
            className="mobile-menu" 
            aria-label={menuOpen ? 'Close menu' : 'Open menu'} 
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22}/> : <Menu size={22}/>}
          </button>
        </div>
      </nav>

      {/* Modern Mobile Slide-in Drawer with Backdrop */}
      <div 
        className={`landing-drawer-backdrop ${menuOpen ? 'is-open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      <aside className={`landing-mobile-drawer ${menuOpen ? 'is-open' : ''}`} aria-label="Mobile navigation">
        <div className="drawer-header">
          <BrandLogo dark size="sm" />
          <button 
            className="drawer-close-btn" 
            onClick={() => setMenuOpen(false)} 
            aria-label="Close navigation drawer"
          >
            <X size={20}/>
          </button>
        </div>

        <div className="drawer-body">
          <div className="drawer-cta-wrap">
            <button 
              className="drawer-primary-cta" 
              onClick={() => { setMenuOpen(false); onClientLogin(); }}
            >
              Book a repair <ArrowRight size={15}/>
            </button>
          </div>

          <div className="drawer-nav-section">
            <p className="drawer-section-label">NAVIGATION</p>
            <nav className="drawer-nav-links">
              <a href="#services" onClick={() => setMenuOpen(false)}>
                <span className="drawer-nav-icon"><Wrench size={16} /></span>
                <div>
                  <strong>Services</strong>
                  <small>Phones, laptops & tablets</small>
                </div>
              </a>
              <a href="#why" onClick={() => setMenuOpen(false)}>
                <span className="drawer-nav-icon"><ShieldCheck size={16} /></span>
                <div>
                  <strong>Why Kendat FixLap</strong>
                  <small>Clear diagnosis & 90-day warranty</small>
                </div>
              </a>
              <a href="#how" onClick={() => setMenuOpen(false)}>
                <span className="drawer-nav-icon"><Zap size={16} /></span>
                <div>
                  <strong>How it works</strong>
                  <small>Simple 3-step repair journey</small>
                </div>
              </a>
              <a href="#testimonials" onClick={() => setMenuOpen(false)}>
                <span className="drawer-nav-icon"><Sparkles size={16} /></span>
                <div>
                  <strong>Customer reviews</strong>
                  <small>Loved by device owners</small>
                </div>
              </a>
              <a href="#faq" onClick={() => setMenuOpen(false)}>
                <span className="drawer-nav-icon"><HelpCircle size={16} /></span>
                <div>
                  <strong>Questions & answers</strong>
                  <small>Everything you need to know</small>
                </div>
              </a>
            </nav>
          </div>

          <div className="drawer-portals-section">
            <p className="drawer-section-label">PORTAL ACCESS</p>
            <div className="drawer-portal-buttons">
              <button 
                className="drawer-portal-btn client" 
                onClick={() => { setMenuOpen(false); onClientLogin(); }}
              >
                <User size={16} />
                <div>
                  <strong>Client portal</strong>
                  <small>Track repair & view invoices</small>
                </div>
                <ArrowRight size={14} className="drawer-arrow" />
              </button>
              <button 
                className="drawer-portal-btn staff" 
                onClick={() => { setMenuOpen(false); onStaffLogin(); }}
              >
                <Lock size={15} />
                <div>
                  <strong>Staff login</strong>
                  <small>Technicians & administrators</small>
                </div>
                <ArrowRight size={14} className="drawer-arrow" />
              </button>
            </div>
          </div>

          <div className="drawer-contact-section">
            <p className="drawer-section-label">DIRECT SUPPORT</p>
            <div className="drawer-contact-links">
              <a href="tel:+2348000000000" className="drawer-contact-item">
                <Phone size={14} />
                <span>+234 800 000 0000</span>
              </a>
              <a 
                href="https://wa.me/2348000000000" 
                target="_blank" 
                rel="noreferrer" 
                className="drawer-contact-item whatsapp"
              >
                <MessageCircle size={14} />
                <span>WhatsApp support</span>
              </a>
            </div>
            <div className="drawer-badge">
              <ShieldCheck size={14} />
              <span>90-Day Comprehensive Warranty</span>
            </div>
          </div>
        </div>
      </aside>

      <section id="top" className="landing-hero">
        <div className="hero-content">
          <div className="hero-kicker"><span/>Trusted local device repair</div>
          <h1>Your device.<br/><em>Our expertise.</em></h1>
          <p>Fast, transparent repairs for the technology you rely on every day. Get your device back working like new.</p>
          <div className="hero-buttons">
            <button className="hero-primary" onClick={onClientLogin}>Book a repair <ArrowRight size={18}/></button>
            <a className="hero-secondary" href="tel:+2348000000000"><Phone size={16}/> Talk to a technician</a>
          </div>
          <div className="hero-proof">
            <span><CheckCircle2 size={16}/> Quality parts</span>
            <span><ShieldCheck size={16}/> 90-day warranty</span>
            <span><Clock3 size={16}/> Same-day repairs</span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="visual-glow"/>
          <div className="device-stack">
            <img className="device-laptop" src="/images/device-laptop.jpg" alt="Laptop ready for professional repair"/>
            <img className="device-phone" src="/images/device-phone.jpg" alt="Phone ready for professional repair"/>
            <div className="repair-badge">
              <Zap size={16}/>
              <span><strong>Repair care</strong><small>Handled by experts</small></span>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="landing-services">
        <div className="section-intro">
          <div className="section-intro-left">
            <p className="eyebrow">What we repair</p>
            <h2>Technology deserves<br/><span>better care.</span></h2>
          </div>
          <p className="section-intro-desc">From everyday fixes to complex faults, our technicians bring clarity and care to every repair.</p>
        </div>
        <div className="service-cards">
          {services.map(({ icon: Icon, title, text, image }) => (
            <article className="service-card" key={title}>
              <img src={image} alt={`${title} repair service`}/>
              <div className="service-card-body">
                <div className="service-card-title-row">
                  <div className="service-icon"><Icon size={19}/></div>
                  <h3>{title}</h3>
                </div>
                <p>{text}</p>
                <button onClick={onClientLogin}>Request service <ArrowRight size={15}/></button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="why" className="landing-why">
        <div>
          <p className="eyebrow">Why Kendat FixLap</p>
          <h2>Repair without<br/><span>the uncertainty.</span></h2>
        </div>
        <div className="why-grid">
          <div><b>01</b><h3>Clear diagnosis</h3><p>We explain the fault and the cost before any work begins.</p></div>
          <div><b>02</b><h3>Skilled technicians</h3><p>Every repair is completed and tested by trained specialists.</p></div>
          <div><b>03</b><h3>Peace of mind</h3><p>Your repair is backed by our 90-day workmanship warranty.</p></div>
        </div>
      </section>

      {/* How it works - Vertical process cards */}
      <section id="how" className="landing-process">
        <div className="section-intro-process">
          <p className="eyebrow">How it works</p>
          <h2>Simple from start to finish.</h2>
        </div>
        <div className="process-grid">
          <div className="process-card">
            <div className="process-step-badge">01</div>
            <div className="process-card-content">
              <h3>Tell us what’s wrong</h3>
              <p>Submit your device details and photos from your dashboard.</p>
            </div>
          </div>
          <div className="process-card">
            <div className="process-step-badge">02</div>
            <div className="process-card-content">
              <h3>We diagnose it</h3>
              <p>Our repairer reviews the device and confirms the estimate.</p>
            </div>
          </div>
          <div className="process-card">
            <div className="process-step-badge">03</div>
            <div className="process-card-content">
              <h3>Track every step</h3>
              <p>Follow your repair status until your device is ready to collect.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-main">
          <div>
            <a className="brand" href="#top"><BrandLogo dark size="md" /></a>
            <p>Reliable device repairs, without the jargon.</p>
            <div className="footer-social">
              <span>in</span><span>f</span><span>◎</span>
            </div>
          </div>
          <div>
            <h4>Explore</h4>
            <a href="#services">Services</a>
            <a href="#why">Why Kendat FixLap</a>
            <a href="#how">How it works</a>
          </div>
          <div>
            <h4>For clients</h4>
            <button onClick={onClientLogin}>Book a repair</button>
            <button onClick={onClientLogin}>Client login</button>
            <a href="tel:+2348000000000">Call technician</a>
          </div>
          <div>
            <h4>Staff access</h4>
            <p>Repairers and administrators</p>
            <button className="staff-link" onClick={onStaffLogin}>Staff login <ArrowRight size={14}/></button>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Kendat FixLap. All rights reserved.</span>
          <span className="text-orange-500">
            <a className="text-orange-500" href="http://kisprojectslab.com" target="_blank" rel="noopener noreferrer">Developed by Kendat Tech</a>
          </span>
          <span>Made for better repairs.</span>
        </div>
      </footer>

      <a className="whatsapp-float" href="https://wa.me/2348000000000" target="_blank" rel="noreferrer" aria-label="Chat with Kendat FixLap on WhatsApp">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a9.9 9.9 0 0 0-8.55 15L2 22l5.2-1.36A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.08-1.12l-.3-.18-3.08.8.82-3-.2-.31A8 8 0 1 1 12 20Zm4.4-5.95c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-1.4-.7-2.32-1.25-3.25-2.84-.25-.43.25-.4.72-1.32.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.4h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62 1.52.66 2.12.72 2.88.6.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z"/></svg>
      </a>
      {showTop && (
        <button className="scroll-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Scroll to top">↑</button>
      )}
    </main>
  );
}
