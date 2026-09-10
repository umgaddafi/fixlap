import { ArrowRight, CheckCircle2, ChevronDown, Facebook, Instagram, Linkedin, Quote, Sparkles, Star, Twitter } from 'lucide-react';
import { useState } from 'react';
import BrandLogo from '../../components/BrandLogo';

const testimonials = [
  {
    quote: 'The updates made the whole process feel effortless. I always knew exactly where my laptop was in the repair journey.',
    author: 'Chioma A.',
    device: 'MacBook Air M1 Screen Replacement',
    location: 'Makurdi',
    rating: 5,
    initials: 'CA',
  },
  {
    quote: 'Clear pricing, quick turnaround and a team that actually explains things in plain English. No surprises at pickup.',
    author: 'Daniel O.',
    device: 'iPhone 13 Pro OLED Display',
    location: 'Lagos',
    rating: 5,
    initials: 'DO',
  },
  {
    quote: 'Two local shops said my board was dead. Kendat FixLap diagnosed a blown power rail and revived all my university research files!',
    author: 'Fatimah B.',
    device: 'HP Envy x360 Motherboard Repair',
    location: 'Abuja',
    rating: 5,
    initials: 'FB',
  },
  {
    quote: 'Booked online in under two minutes. Dropped my phone in the morning and picked it up fully calibrated by 3 PM.',
    author: 'Emeka K.',
    device: 'Samsung Galaxy S22 Charging Port',
    location: 'Makurdi',
    rating: 5,
    initials: 'EK',
  },
  {
    quote: 'Exceptional transparency. Seeing technician bench test notes and getting an official warranty stamp was top tier.',
    author: 'Samuel T.',
    device: 'Dell XPS 15 Battery & Thermals',
    location: 'Jos',
    rating: 5,
    initials: 'ST',
  },
  {
    quote: 'Very courteous technicians. They messaged me with photos before opening the device and finished ahead of schedule.',
    author: 'Grace M.',
    device: 'iPad Pro 11 Digitizer Service',
    location: 'Benue',
    rating: 5,
    initials: 'GM',
  },
];

export default function LandingExtras({ onClientLogin }: { onClientLogin: () => void }) {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    'How long does a typical repair take?',
    'Will I know the price before work starts?',
    'How do I track my repair?'
  ];

  // Double list for smooth infinite seamless sliding
  const marqueeItems = [...testimonials, ...testimonials];

  return (
    <>
      <section id="testimonials" className="landing-testimonials">
        <div className="testimonials-header">
          <div className="testimonials-title-wrap">
            <p className="eyebrow">Loved by device owners</p>
            <h2>Good repairs.<br/><span>Happy customers.</span></h2>
          </div>
          
        </div>

        {/* Slow horizontal sliding track */}
        <div className="testimonials-slider-viewport">
          <div className="testimonials-slider-track">
            {marqueeItems.map((item, idx) => (
              <article className="quote-card testimonial-slider-card" key={idx}>
                <div className="testimonial-card-top">
                  <div className="testimonial-stars">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />
                    ))}
                  </div>
                  <Quote size={20} className="testimonial-quote-icon" />
                </div>
                <p className="testimonial-quote-text">“{item.quote}”</p>
                <div className="testimonial-author-row">
                  <div className="testimonial-avatar">{item.initials}</div>
                  <div className="testimonial-author-info">
                    <div className="testimonial-author-name">
                      <strong>{item.author}</strong>
                      <span className="verified-pill">
                        <CheckCircle2 size={11} /> Verified
                      </span>
                    </div>
                    <small>{item.device} · {item.location}</small>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-faq">
        <div>
          <p className="eyebrow">Questions, answered</p>
          <h2>Everything you need<br/>to know.</h2>
          <p>Still unsure? Our team is happy to help.</p>
        </div>
        <div>
          {faqs.map((faq, i) => (
            <div className="faq-row" key={faq}>
              <button onClick={() => setOpen(open === i ? null : i)}>
                {faq}
                <ChevronDown className={open === i ? 'rotate' : ''} size={18}/>
              </button>
              {open === i && (
                <p>We keep the process transparent. Submit your details, receive a diagnosis and track every update from your client dashboard.</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="landing-cta">
        <Sparkles size={24}/>
        <div>
          <p className="eyebrow">Ready when you are</p>
          <h2>Give your device a better day.</h2>
        </div>
        <button onClick={onClientLogin}>Book a repair <span>→</span></button>
      </section>

      <footer className="landing-footer landing-footer-last">
        <div className="footer-main">
          <div>
            <a className="brand" href="#top">
              <BrandLogo dark size="md" />
            </a>
            <p>Reliable device repairs, without the jargon.</p>
            <div className="footer-social">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram size={15}/></a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><Facebook size={15}/></a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><Twitter size={15}/></a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><Linkedin size={15}/></a>
            </div>
          </div>
          <div>
            <h4>Explore</h4>
            <a href="#services">Services</a>
            <a href="#why"><span className="footer-full">Why Kendat FixLap</span><span className="footer-short">Why us</span></a>
            <a href="#how"><span className="footer-full">How it works</span><span className="footer-short">Process</span></a>
          </div>
          <div>
            <h4><span className="footer-full">For clients</span><span className="footer-short">Clients</span></h4>
            <button onClick={onClientLogin}><span className="footer-full">Book a repair</span><span className="footer-short">Book</span></button>
            <button onClick={onClientLogin}><span className="footer-full">Client login</span><span className="footer-short">Login</span></button>
          </div>
          <div>
            <h4><span className="footer-full">Staff access</span><span className="footer-short">Staff</span></h4>
            <p className="footer-note">Repairers and administrators</p>
            <button className="staff-link"><span className="footer-full">Staff login</span><span className="footer-short">Login</span> <ArrowRight size={14}/></button>
          </div>
        </div>
        <div className="footer-bottom">
          <span><span className="footer-full">© 2026 Kendat FixLap. All rights reserved.</span><span className="footer-short">© 2026 Kendat FixLap</span></span>
          <span className="text-orange-500"> <a className="text-orange-500" href="http://kisprojectslab.com" target="_blank" rel="noopener noreferrer">Developed by Kendat Tech</a></span>
        </div>
      </footer>
    </>
  );
}

