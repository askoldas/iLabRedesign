'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, MapPin, Menu, Phone, MessageCircle, X } from 'lucide-react';

const branches = [
  { id: 'domina', title: 'T/C Domina Shopping', address: 'Ieriķu iela 3, Rīga', phone: '+371 23370088', tel: 'tel:+37123370088', whatsapp: 'https://wa.me/37123370088' },
  { id: 'spice', title: 'T/C Spice Life', address: 'Jaunmoku iela 13, Rīga', phone: '+371 20887787', tel: 'tel:+37120887787', whatsapp: 'https://wa.me/37120887787' },
];

const links = [
  { label: 'iPhone', href: 'https://ilab.lv/iphone-remonts' },
  { label: 'Telefoni', href: 'https://ilab.lv/' },
  { label: 'Planšetdatori', href: 'https://ilab.lv/' },
  { label: 'Datori', href: 'https://ilab.lv/' },
  { label: 'Dyson', href: 'https://ilab.lv/' },
  { label: 'Fotoaparāti', href: 'https://ilab.lv/' },
];

export function SiteHeader({ contactRequest = 0 }: { contactRequest?: number }) {
  const [menu, setMenu] = useState<'locations'|'contact'|'mobile'|null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (contactRequest > 0) setMenu('contact'); }, [contactRequest]);
  useEffect(() => {
    function closeOnEsc(event: KeyboardEvent) { if (event.key === 'Escape') setMenu(null); }
    function closeOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) setMenu(null);
    }
    document.addEventListener('keydown', closeOnEsc);
    document.addEventListener('mousedown', closeOutside);
    return () => { document.removeEventListener('keydown', closeOnEsc); document.removeEventListener('mousedown', closeOutside); };
  }, []);

  const toggle = (next: 'locations'|'contact'|'mobile') => setMenu(current => current === next ? null : next);
  return (
    <header className="site-header" ref={popoverRef}>
      <div className="header-inner">
        <a className="brand-link" href="/" aria-label="iLab — sākums">
          {/* Official iLab vector asset, supplied by the user. */}
          <img className="brand-logo" src="https://ilab.lv/brand/logo.svg" alt="iLab" width="112" height="46" />
        </a>
        <nav aria-label="Galvenā navigācija" className="desktop-nav">
          {links.map((link, i) => <a key={link.label} href={link.href}>{link.label}{i >= 1 && i <= 3 ? <span className="nav-caret">›</span> : null}</a>)}
        </nav>
        <div className="header-right">
          <a className="mobile-prices" href="https://ilab.lv/iphone-remonts">Cenas</a>
          <a className="mobile-language" href="https://ilab.lv/ru" aria-label="Русская версия">RU</a>
          <a className="language-control" href="https://ilab.lv/ru" aria-label="Русская версия">RU</a>
          <button type="button" className={'header-action header-action-secondary' + (menu === 'locations' ? ' is-open' : '')} onClick={() => toggle('locations')} aria-expanded={menu === 'locations'}>
            <MapPin size={17} strokeWidth={1.6}/><span>Servisa centri</span>
          </button>
          <button type="button" className={'header-action header-action-primary' + (menu === 'contact' ? ' is-open' : '')} onClick={() => toggle('contact')} aria-expanded={menu === 'contact'}>Sazināties</button>
          <button type="button" className="mobile-menu-toggle" aria-label="Atvērt izvēlni" onClick={() => toggle('mobile')} aria-expanded={menu === 'mobile'}>{menu === 'mobile' ? <X size={23}/> : <Menu size={23}/>}</button>
        </div>
      </div>
      {(menu === 'locations' || menu === 'contact') && <div className="header-popover" role="dialog" aria-label={menu === 'locations' ? 'Servisa centri' : 'Sazināties'}>
        <div className="popover-overline">ILAB / {menu === 'locations' ? 'MŪSU FILIĀLES' : 'KONTAKTI'} <span>01 — 02</span></div>
        <h2>{menu === 'locations' ? 'Servisa centri Rīgā' : 'Izvēlieties servisa centru'}</h2>
        {branches.map((branch, index) => <div className="branch-row" key={branch.id}>
          <span className="branch-num">0{index+1}</span>
          <div className="branch-info"><strong>{branch.title}</strong><span>{branch.address}</span><span>{branch.phone}</span>
            <div className="branch-actions">
              <a href={branch.tel}><Phone size={14}/> Zvanīt</a>
              <a href={branch.whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle size={14}/> WhatsApp</a>
            </div>
          </div>
        </div>)}
      </div>}
      {menu === 'mobile' && <nav className="mobile-nav" aria-label="Mobilā navigācija">
        {links.map(link => <a key={link.label} href={link.href}>{link.label}<span>↗</span></a>)}
        <button type="button" onClick={() => setMenu('contact')}>Sazināties <ChevronDown size={16}/></button>
        <button type="button" onClick={() => setMenu('locations')}>Servisa centri <ChevronDown size={16}/></button>
      </nav>}
    </header>
  );
}
