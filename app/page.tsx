'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { RepairDialog } from '@/components/RepairDialog';

export default function HomePage() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [contactRequest, setContactRequest] = useState(0);
  return <>
    <SiteHeader contactRequest={contactRequest} />
    <main id="content" className="page-main">
      <aside className="measurement-rail" aria-label="Lapas progress: 1. sadaļa">
        <span className="rail-index">01</span><div className="ruler"><i className="ruler-position" /></div><span className="rail-total">08</span>
      </aside>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-visual" aria-hidden="true" />
        <div className="hero-darken" aria-hidden="true" />
        <div className="line-vertical line-mid" aria-hidden="true" />
        <div className="line-vertical line-photo-end" aria-hidden="true" />
        <div className="hero-copy">
          <div className="hero-eyebrow"><span>ILAB / PRECISION REPAIR / RĪGA</span><span className="eyebrow-rule"/><span>01</span></div>
          <h1 id="hero-title" className="silver-title">Telefonu un<br/>datoru remonts<br/>Rīgā.</h1>
          <p className="hero-description">Ātra diagnostika, skaidra cena un kvalitatīvs remonts iPhone, Samsung, Xiaomi, Huawei, planšetdatoriem, datoriem un Dyson ierīcēm.</p>
          <div className="hero-ctas" aria-label="Remonta darbības">
            <button type="button" className="cta cta-primary" onClick={() => setBookingOpen(true)}>Pieteikt remontu <ArrowUpRight size={20} strokeWidth={1.6}/></button>
            <a className="cta cta-secondary" href="https://ilab.lv/iphone-remonts">Cenas <ArrowUpRight size={18} strokeWidth={1.6}/></a>
          </div>
        </div>
        <div className="hero-footer">
          <div className="hero-motto"><span className="motto-accent"/> <span>PRECISION<br/>PEOPLE<br/>LONGER LIFE</span></div>
          <div className="scroll-cue" aria-hidden="true">RITINĀT TĀLĀK <ArrowDown size={17} strokeWidth={1.4}/></div>
          <div className="hero-footer-index">ILAB — 2026 <span>01 / 08</span></div>
        </div>
      </section>
    </main>
    <div className="mobile-dock" aria-label="Mobilās darbības">
      <button type="button" className="cta cta-primary" onClick={() => setBookingOpen(true)}>Pieteikt remontu <ArrowUpRight size={17}/></button>
      <button type="button" className="cta cta-secondary" onClick={() => setContactRequest(n => n + 1)}>Sazināties</button>
    </div>
    <RepairDialog open={bookingOpen} onClose={() => setBookingOpen(false)}/>
  </>;
}
