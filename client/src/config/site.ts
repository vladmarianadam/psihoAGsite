/**
 * Datele de contact și identitatea cabinetului — un singur loc, citit din .env,
 * ca să nu apară hardcodate în componente (plan §9.3).
 * Valorile reale se completează când clientul le furnizează (plan §11).
 */
const env = import.meta.env

export const site = {
  name: 'Cabinet Psihologic Adina Gghita',
  shortName: 'Adina Gghita',
  role: 'Psiholog clinician & psihoterapeut',
  tagline: 'Ședințe în cabinet sau online',
  description:
    'Cabinet de psihologie — psihoterapie cognitiv-comportamentală, evaluări psihologice și avize psihologice, în cabinet sau online.',
  url: (env.VITE_SITE_URL as string | undefined) ?? 'https://www.adinagghita.ro',
  phone: (env.VITE_PHONE as string | undefined) ?? '+40 700 000 000',
  whatsapp: (env.VITE_WHATSAPP as string | undefined) ?? '40700000000',
  email: (env.VITE_EMAIL as string | undefined) ?? 'contact@adinagghita.ro',
  address: {
    street: 'Str. Sapienței, Sector 5',
    city: 'București',
    country: 'România',
    mapsQuery: 'Strada Sapienței, Sector 5, București, România',
  },
  /** Numărul de la stradă și codul de atestat COPSI rămân de completat (plan §11). */
  copsi: 'Psiholog atestat de Colegiul Psihologilor din România',
  schedule: [
    { day: 'Luni – Joi', hours: '10:00 – 20:00' },
    { day: 'Vineri', hours: '10:00 – 17:00' },
    { day: 'Sâmbătă', hours: 'La cerere' },
    { day: 'Duminică', hours: 'Închis' },
  ],
  social: {
    facebook: '',
    instagram: '',
    linkedin: '',
  },
  legal: {
    anpc: 'https://anpc.ro/',
    sal: 'https://anpc.ro/ce-este-sal/',
    sol: 'https://ec.europa.eu/consumers/odr',
  },
} as const

export const phoneHref = `tel:${site.phone.replace(/\s+/g, '')}`
export const whatsappHref = `https://wa.me/${site.whatsapp}`
export const mailHref = `mailto:${site.email}`
