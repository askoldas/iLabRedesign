'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export function RepairDialog({ open, onClose }: { open: boolean, onClose: () => void }) {
  const [location, setLocation] = useState('domina');
  useEffect(() => {
    if (!open) return;
    function esc(event: KeyboardEvent) { if (event.key === 'Escape') onClose(); }
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', esc); };
  }, [open, onClose]);
  if (!open) return null;
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-title" onMouseDown={e => e.stopPropagation()}>
      <div className="modal-topline"><span>ILAB / REMONTA PIETEIKUMS</span><button type="button" onClick={onClose} aria-label="Aizvērt"><X size={20}/></button></div>
      <h2 id="booking-title">Pieteikt remontu.</h2>
      <p>Izvēlieties servisa centru. Šī ir dizaina prototipa forma — pieteikums netiks nosūtīts.</p>
      <div className="booking-options" role="radiogroup" aria-label="Servisa centrs">
        <label className={location === 'domina' ? 'selected' : ''}><input type="radio" name="branch" value="domina" checked={location === 'domina'} onChange={e => setLocation(e.target.value)}/><strong>T/C Domina Shopping</strong><span>Ieriķu iela 3, Rīga</span></label>
        <label className={location === 'spice' ? 'selected' : ''}><input type="radio" name="branch" value="spice" checked={location === 'spice'} onChange={e => setLocation(e.target.value)}/><strong>T/C Spice Life</strong><span>Jaunmoku iela 13, Rīga</span></label>
      </div>
      <a className="modal-action" href={location === 'domina' ? 'tel:+37123370088' : 'tel:+37120887787'}>Zvanīt izvēlētajam servisam ↗</a>
    </section>
  </div>;
}
