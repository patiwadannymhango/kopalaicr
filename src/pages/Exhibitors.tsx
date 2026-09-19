import { EVENT } from '../data/event';
import VendorRegistration from '../registration/VendorRegistration';

export default function Exhibitors() {
  return (
    <main>
      <section className="page-hero">
        <div className="eyebrow">Exhibitors</div>
        <h1>Register your business</h1>
        <p className="lede">
          Secure a stall, exhibition space or activation at {EVENT.shortTitle} — fill in your details, pick a
          category, and pay in a few minutes.
        </p>
      </section>

      <section className="section">
        <div className="section-inner narrow">
          <VendorRegistration />
        </div>
      </section>
    </main>
  );
}
