import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Container, Divider, Link, Paper, Stack, Typography } from '@mui/material'

import Seo from '../components/common/Seo'
import { formatDateRo } from '../components/common/formatters'
import { mailHref, phoneHref, site } from '../config/site'

/**
 * Data ultimei revizuiri a documentelor legale. Se actualizează manual, la fiecare
 * modificare de text — este singura dată afișată vizitatorului.
 */
const LAST_UPDATED = '2026-07-01'

type LegalDocumentKey = 'terms' | 'privacy' | 'cookies'

interface LegalSection {
  id: string
  heading: string
  content: ReactNode
}

interface LegalDocumentContent {
  seoTitle: string
  seoDescription: string
  heading: string
  intro: ReactNode
  sections: readonly LegalSection[]
  /** Notă finală, sub secțiuni. */
  footNote: string
}

export interface LegalPageProps {
  document: LegalDocumentKey
}

const bodySx = { color: 'text.secondary', mb: 2 } as const
const listSx = { pl: 3, m: 0, mb: 2, color: 'text.secondary', '& li': { mb: 1 } } as const
const inlineLinkSx = { fontWeight: 600 } as const

/** Blocul de contact, identic în cele trei documente. */
const contactBlock: ReactNode = (
  <>
    <Typography sx={bodySx}>
      {site.name} — {site.address.street}, {site.address.city}, {site.address.country}. Denumirea
      legală completă și codul unic de identificare sunt cele conform datelor de identificare
      afișate în pagina de contact.
    </Typography>
    <Box component="ul" sx={listSx}>
      <Typography component="li" variant="body1">
        E-mail:{' '}
        <Link href={mailHref} sx={inlineLinkSx}>
          {site.email}
        </Link>
      </Typography>
      <Typography component="li" variant="body1">
        Telefon:{' '}
        <Link href={phoneHref} sx={inlineLinkSx}>
          {site.phone}
        </Link>
      </Typography>
      <Typography component="li" variant="body1">
        Formular și hartă:{' '}
        <Link component={RouterLink} to="/contact" sx={inlineLinkSx}>
          pagina de contact
        </Link>
      </Typography>
    </Box>
  </>
)

// ------------------------------------------------- Termeni și condiții ----

const terms: LegalDocumentContent = {
  seoTitle: 'Termeni și condiții',
  seoDescription:
    'Termenii și condițiile de utilizare a site-ului Cabinetului Psihologic Adina Gghita: caracterul informativ al conținutului, cererile de programare, politica de anulare și soluționarea disputelor.',
  heading: 'Termeni și condiții',
  intro: (
    <Typography sx={bodySx}>
      Acest site este operat de {site.name}, cabinet individual de psihologie cu sediul în{' '}
      {site.address.city}, {site.address.country}. Prin accesarea și utilizarea site-ului confirmi
      că ai citit și că accepți termenii de mai jos. Dacă nu ești de acord cu ei, te rugăm să nu
      folosești site-ul.
    </Typography>
  ),
  sections: [
    {
      id: 'obiect',
      heading: 'Obiectul site-ului',
      content: (
        <>
          <Typography sx={bodySx}>
            Site-ul are rol de prezentare: descrie serviciile psihologice oferite în cabinet și
            online, publică articole cu caracter educativ și pune la dispoziție un formular prin
            care poți transmite o cerere de programare sau un mesaj.
          </Typography>
          <Typography sx={bodySx}>
            Prin site nu se încheie contracte la distanță, nu se efectuează plăți și nu se
            furnizează servicii de psihoterapie. Relația terapeutică se stabilește exclusiv în
            cadrul ședințelor, în urma unui acord discutat direct cu tine.
          </Typography>
        </>
      ),
    },
    {
      id: 'continut-informativ',
      heading: 'Conținutul nu înlocuiește consultul de specialitate',
      content: (
        <>
          <Typography sx={bodySx}>
            Informațiile publicate pe site, inclusiv articolele de blog și secțiunile de întrebări
            frecvente, au caracter general și educativ. Ele nu constituie un diagnostic, o
            recomandare terapeutică personalizată sau un tratament și nu înlocuiesc consultul de
            specialitate psihologic ori medical.
          </Typography>
          <Typography sx={bodySx}>
            Nicio informație de pe site nu trebuie folosită pentru a începe, a modifica sau a
            întrerupe un tratament. Dacă te confrunți cu o situație de urgență, cu gânduri de a-ți
            face rău sau cu o stare care îți pune în pericol siguranța, apelează numărul unic de
            urgență 112 sau prezintă-te la cel mai apropiat serviciu de urgență. Site-ul nu este un
            canal de intervenție în criză și mesajele transmise prin formular nu sunt monitorizate
            permanent.
          </Typography>
        </>
      ),
    },
    {
      id: 'programari',
      heading: 'Cererea de programare nu este o rezervare confirmată',
      content: (
        <>
          <Typography sx={bodySx}>
            Formularul din pagina de contact transmite o <strong>cerere</strong> de programare, în
            care poți indica serviciul dorit, modul de desfășurare a ședinței (în cabinet sau
            online) și intervalul care ți se potrivește. Trimiterea formularului nu creează, prin
            ea însăși, o programare.
          </Typography>
          <Box component="ul" sx={listSx}>
            <Typography component="li" variant="body1">
              Cererea este analizată în funcție de disponibilitatea din agendă.
            </Typography>
            <Typography component="li" variant="body1">
              Te contactez prin e-mail sau telefon pentru a-ți propune un interval concret.
            </Typography>
            <Typography component="li" variant="body1">
              Programarea este considerată confirmată doar după acordul explicit al ambelor părți
              asupra datei și orei.
            </Typography>
          </Box>
          <Typography sx={bodySx}>
            Îți răspund, de regulă, în intervalul programului de lucru afișat pe site. Pentru
            situațiile care nu suportă amânare, te rog să folosești telefonul.
          </Typography>
        </>
      ),
    },
    {
      id: 'anulare',
      heading: 'Anulare și reprogramare',
      content: (
        <>
          <Typography sx={bodySx}>
            Timpul rezervat pentru o ședință este alocat exclusiv persoanei programate, motiv pentru
            care anunțarea din timp a unei modificări este importantă pentru amândoi.
          </Typography>
          <Box component="ul" sx={listSx}>
            <Typography component="li" variant="body1">
              Anularea sau reprogramarea se anunță cu cel puțin 24 de ore înainte de ora stabilită,
              prin telefon, WhatsApp sau e-mail.
            </Typography>
            <Typography component="li" variant="body1">
              O ședință anunțată în acest interval se reprogramează fără costuri suplimentare, în
              funcție de disponibilitate.
            </Typography>
            <Typography component="li" variant="body1">
              Ședințele la care nu te prezinți și care nu au fost anunțate în intervalul de mai sus
              pot fi tarifate integral, condițiile fiind discutate și agreate la începutul
              colaborării.
            </Typography>
            <Typography component="li" variant="body1">
              Situațiile neprevăzute — probleme medicale, urgențe familiale — sunt tratate cu
              înțelegere, de la caz la caz.
            </Typography>
          </Box>
          <Typography sx={bodySx}>
            Dacă o ședință trebuie anulată din motive care îmi aparțin, îți propun cel mai apropiat
            interval disponibil sau, la alegerea ta, restituirea sumei achitate în avans.
          </Typography>
        </>
      ),
    },
    {
      id: 'proprietate-intelectuala',
      heading: 'Proprietate intelectuală',
      content: (
        <>
          <Typography sx={bodySx}>
            Textele, articolele, materialele grafice, structura paginilor și celelalte elemente de
            conținut publicate pe acest site sunt protejate de legislația privind drepturile de
            autor și aparțin cabinetului sau autorilor indicați, după caz.
          </Typography>
          <Typography sx={bodySx}>
            Poți cita fragmente scurte în scop informativ sau educativ, cu menționarea sursei și cu
            un link către pagina originală. Reproducerea integrală, republicarea, traducerea,
            modificarea sau folosirea comercială a conținutului necesită acordul scris prealabil al
            cabinetului.
          </Typography>
        </>
      ),
    },
    {
      id: 'limitarea-raspunderii',
      heading: 'Limitarea răspunderii',
      content: (
        <>
          <Typography sx={bodySx}>
            Conținutul site-ului este realizat cu atenție și actualizat periodic, însă este oferit
            „așa cum este”, fără garanții privind caracterul complet sau actualitatea permanentă a
            informațiilor.
          </Typography>
          <Box component="ul" sx={listSx}>
            <Typography component="li" variant="body1">
              Cabinetul nu răspunde pentru deciziile luate exclusiv pe baza informațiilor generale
              publicate pe site, fără un consult de specialitate.
            </Typography>
            <Typography component="li" variant="body1">
              Cabinetul nu răspunde pentru întreruperi temporare de funcționare, erori tehnice sau
              indisponibilitatea site-ului din motive independente de voința sa.
            </Typography>
            <Typography component="li" variant="body1">
              Site-ul poate include linkuri către resurse externe, pentru al căror conținut și
              pentru ale căror politici de confidențialitate cabinetul nu poartă răspundere.
            </Typography>
          </Box>
        </>
      ),
    },
    {
      id: 'lege-aplicabila',
      heading: 'Legea aplicabilă',
      content: (
        <Typography sx={bodySx}>
          Prezentele condiții sunt guvernate de legea română. Activitatea de psihologie se
          desfășoară în conformitate cu Legea nr. 213/2004 privind exercitarea profesiei de psiholog
          cu drept de liberă practică, cu normele și codul deontologic ale Colegiului Psihologilor
          din România, precum și cu Regulamentul (UE) 2016/679 (GDPR) în privința prelucrării
          datelor personale.
        </Typography>
      ),
    },
    {
      id: 'disputele',
      heading: 'Soluționarea disputelor',
      content: (
        <>
          <Typography sx={bodySx}>
            Orice nemulțumire legată de serviciile cabinetului sau de utilizarea site-ului poate fi
            adresată direct, folosind datele de contact de mai jos. Îmi asum să răspund în scris în
            cel mai scurt timp și să caut, împreună cu tine, o soluție amiabilă.
          </Typography>
          <Typography sx={bodySx}>
            Dacă nu ajungem la un acord, ai la dispoziție următoarele căi:
          </Typography>
          <Box component="ul" sx={listSx}>
            <Typography component="li" variant="body1">
              Autoritatea Națională pentru Protecția Consumatorilor —{' '}
              <Link
                href={site.legal.anpc}
                target="_blank"
                rel="noopener noreferrer"
                sx={inlineLinkSx}
              >
                ANPC
              </Link>
              .
            </Typography>
            <Typography component="li" variant="body1">
              Soluționarea alternativă a litigiilor —{' '}
              <Link
                href={site.legal.sal}
                target="_blank"
                rel="noopener noreferrer"
                sx={inlineLinkSx}
              >
                SAL
              </Link>
              .
            </Typography>
            <Typography component="li" variant="body1">
              Soluționarea online a litigiilor, platforma Comisiei Europene —{' '}
              <Link
                href={site.legal.sol}
                target="_blank"
                rel="noopener noreferrer"
                sx={inlineLinkSx}
              >
                SOL
              </Link>
              .
            </Typography>
            <Typography component="li" variant="body1">
              Aspectele de natură deontologică pot fi semnalate Colegiului Psihologilor din România.
            </Typography>
          </Box>
          <Typography sx={bodySx}>
            Rămâne, de asemenea, deschisă calea instanțelor judecătorești competente din România.
          </Typography>
        </>
      ),
    },
    {
      id: 'modificari',
      heading: 'Modificarea termenilor',
      content: (
        <Typography sx={bodySx}>
          Termenii pot fi actualizați pentru a reflecta schimbări legislative sau modificări ale
          modului de organizare a cabinetului. Versiunea aplicabilă este cea publicată pe această
          pagină, iar data ultimei actualizări este afișată în partea de sus. Te încurajez să
          recitești documentul periodic.
        </Typography>
      ),
    },
    {
      id: 'contact',
      heading: 'Date de contact',
      content: contactBlock,
    },
  ],
  footNote:
    'Pentru modul în care sunt prelucrate datele transmise prin formulare, consultă politica de confidențialitate.',
}

// ------------------------------------ Politica de confidențialitate ----

const privacy: LegalDocumentContent = {
  seoTitle: 'Politica de confidențialitate',
  seoDescription:
    'Cum sunt prelucrate datele personale transmise prin site-ul Cabinetului Psihologic Adina Gghita: scopuri, baza legală, durata de păstrare, destinatari și drepturile tale conform GDPR.',
  heading: 'Politica de confidențialitate',
  intro: (
    <Typography sx={bodySx}>
      Confidențialitatea este parte din felul în care lucrez, nu doar o obligație legală. Documentul
      de mai jos explică, în termeni simpli, ce date personale sunt prelucrate atunci când folosești
      acest site, de ce, cât timp sunt păstrate și ce drepturi ai, conform Regulamentului (UE)
      2016/679 (GDPR) și legislației române aplicabile.
    </Typography>
  ),
  sections: [
    {
      id: 'operator',
      heading: 'Operatorul de date',
      content: (
        <>
          <Typography sx={bodySx}>
            Operatorul datelor tale personale este {site.name}, cabinet individual de psihologie cu
            sediul în {site.address.street}, {site.address.city}, {site.address.country}. Denumirea
            legală completă și codul unic de identificare sunt cele conform datelor de identificare
            afișate în pagina de contact.
          </Typography>
          <Typography sx={bodySx}>
            Cabinetul nu are obligația legală de a numi un responsabil cu protecția datelor, așa că
            cererile privind datele personale sunt tratate direct de psihologul titular, la adresa
            de e-mail indicată la finalul documentului.
          </Typography>
        </>
      ),
    },
    {
      id: 'date-colectate',
      heading: 'Ce date colectăm prin site',
      content: (
        <>
          <Typography sx={bodySx}>
            Prin formularele publicate pe site se colectează doar datele necesare pentru a-ți putea
            răspunde:
          </Typography>
          <Box component="ul" sx={listSx}>
            <Typography component="li" variant="body1">
              <strong>Nume și prenume</strong> — pentru a mă putea adresa corect.
            </Typography>
            <Typography component="li" variant="body1">
              <strong>Adresa de e-mail</strong> — canalul principal de răspuns.
            </Typography>
            <Typography component="li" variant="body1">
              <strong>Numărul de telefon</strong> — pentru confirmarea rapidă a unui interval.
            </Typography>
            <Typography component="li" variant="body1">
              <strong>Mesajul transmis</strong>, împreună cu serviciul, modul de ședință și
              intervalul orar preferat, atunci când le completezi.
            </Typography>
            <Typography component="li" variant="body1">
              <strong>Data trimiterii cererii</strong> și confirmarea bifării consimțământului.
            </Typography>
          </Box>
          <Typography sx={bodySx}>
            Te rog să nu incluzi în formular detalii sensibile despre starea ta de sănătate. Câteva
            rânduri despre motivul solicitării sunt suficiente; restul discutăm în siguranță, în
            cadrul ședinței. Formularele conțin un câmp tehnic ascuns, folosit exclusiv pentru
            filtrarea mesajelor automate de spam.
          </Typography>
        </>
      ),
    },
    {
      id: 'scop-baza-legala',
      heading: 'Scopul și baza legală a prelucrării',
      content: (
        <>
          <Box component="ul" sx={listSx}>
            <Typography component="li" variant="body1">
              <strong>Programarea și organizarea ședințelor</strong> — pe baza{' '}
              <strong>consimțământului</strong> tău, exprimat prin bifarea explicită din formular
              (art. 6 alin. 1 lit. a GDPR). Consimțământul poate fi retras oricând.
            </Typography>
            <Typography component="li" variant="body1">
              <strong>Răspunsul la întrebări și corespondența administrativă</strong> — pe baza{' '}
              <strong>interesului legitim</strong> al cabinetului de a comunica eficient cu
              persoanele interesate de servicii (art. 6 alin. 1 lit. f GDPR).
            </Typography>
            <Typography component="li" variant="body1">
              <strong>Securitatea site-ului și prevenirea abuzurilor</strong> — interes legitim,
              prin mecanisme minime de limitare a mesajelor automate.
            </Typography>
            <Typography component="li" variant="body1">
              <strong>Îndeplinirea obligațiilor legale</strong> — atunci când legislația fiscală
              sau profesională impune păstrarea anumitor documente (art. 6 alin. 1 lit. c GDPR).
            </Typography>
          </Box>
          <Typography sx={bodySx}>
            Datele nu sunt folosite pentru profilare, pentru decizii automatizate sau pentru
            transmiterea de comunicări comerciale nesolicitate.
          </Typography>
        </>
      ),
    },
    {
      id: 'durata-pastrare',
      heading: 'Durata de păstrare',
      content: (
        <>
          <Typography sx={bodySx}>
            Datele se păstrează strict cât este necesar, iar cererile primite prin site sunt supuse
            unei <strong>retenții limitate</strong>:
          </Typography>
          <Box component="ul" sx={listSx}>
            <Typography component="li" variant="body1">
              <strong>Cererile de programare și mesajele de contact</strong> se șterg în cel mult 12
              luni de la data primirii, dacă nu s-a stabilit o colaborare. Cererile la care s-a
              răspuns și care nu au continuare sunt eliminate mai devreme, la revizuirea periodică a
              listei.
            </Typography>
            <Typography component="li" variant="body1">
              <strong>Corespondența pe e-mail</strong> se arhivează pe aceeași durată, apoi este
              ștearsă.
            </Typography>
            <Typography component="li" variant="body1">
              <strong>Documentele impuse de obligații legale</strong> (de exemplu cele
              financiar-contabile) se păstrează pe termenele prevăzute de lege.
            </Typography>
            <Typography component="li" variant="body1">
              <strong>Notițele profesionale</strong> aferente ședințelor se păstrează conform
              normelor Colegiului Psihologilor din România, separat de datele colectate prin site.
            </Typography>
          </Box>
          <Typography sx={bodySx}>
            Dacă îți retragi consimțământul sau soliciți ștergerea, datele sunt eliminate fără
            întârziere nejustificată, cu excepția celor pe care legea mă obligă să le păstrez.
          </Typography>
        </>
      ),
    },
    {
      id: 'destinatari',
      heading: 'Destinatarii datelor',
      content: (
        <>
          <Typography sx={bodySx}>
            Datele tale nu sunt vândute și nu sunt transmise în scopuri de marketing. Ele pot fi
            accesate strict pentru funcționarea serviciului de către:
          </Typography>
          <Box component="ul" sx={listSx}>
            <Typography component="li" variant="body1">
              <strong>Furnizorul de găzduire</strong> al site-ului și al bazei de date, în calitate
              de împuternicit, pe baza unui acord de prelucrare.
            </Typography>
            <Typography component="li" variant="body1">
              <strong>Furnizorul serviciului de e-mail</strong>, prin care ajung la mine
              notificările și corespondența.
            </Typography>
            <Typography component="li" variant="body1">
              <strong>Autoritățile publice</strong>, exclusiv în cazurile și în limitele prevăzute
              de lege.
            </Typography>
          </Box>
          <Typography sx={bodySx}>
            Furnizorii selectați prelucrează datele pe teritoriul Uniunii Europene. Dacă un transfer
            în afara Spațiului Economic European devine necesar, acesta se face doar cu garanțiile
            prevăzute de GDPR.
          </Typography>
        </>
      ),
    },
    {
      id: 'drepturi',
      heading: 'Drepturile tale',
      content: (
        <>
          <Typography sx={bodySx}>
            În calitate de persoană vizată, ai următoarele drepturi:
          </Typography>
          <Box component="ul" sx={listSx}>
            <Typography component="li" variant="body1">
              <strong>Dreptul de acces</strong> — să afli ce date am despre tine și cum sunt
              folosite.
            </Typography>
            <Typography component="li" variant="body1">
              <strong>Dreptul la rectificare</strong> — să corectezi datele inexacte sau
              incomplete.
            </Typography>
            <Typography component="li" variant="body1">
              <strong>Dreptul la ștergere</strong> („dreptul de a fi uitat”) — să ceri eliminarea
              datelor, când nu există o obligație legală de păstrare.
            </Typography>
            <Typography component="li" variant="body1">
              <strong>Dreptul la restricționarea prelucrării</strong> — să ceri suspendarea
              temporară a folosirii datelor.
            </Typography>
            <Typography component="li" variant="body1">
              <strong>Dreptul la opoziție</strong> — să te opui prelucrărilor întemeiate pe
              interesul legitim.
            </Typography>
            <Typography component="li" variant="body1">
              <strong>Dreptul la portabilitate</strong> — să primești datele într-un format
              structurat, folosit în mod curent.
            </Typography>
            <Typography component="li" variant="body1">
              <strong>Dreptul de a retrage consimțământul</strong> oricând, fără a afecta
              legalitatea prelucrărilor anterioare.
            </Typography>
            <Typography component="li" variant="body1">
              <strong>Dreptul de a depune plângere</strong> la Autoritatea Națională de Supraveghere
              a Prelucrării Datelor cu Caracter Personal (ANSPDCP), B-dul General Gheorghe Magheru
              nr. 28-30, Bucureşti, sau la instanța competentă.
            </Typography>
          </Box>
        </>
      ),
    },
    {
      id: 'securitate',
      heading: 'Securitatea datelor',
      content: (
        <>
          <Typography sx={bodySx}>
            Site-ul funcționează pe conexiune criptată (HTTPS), iar accesul la cererile primite este
            protejat prin autentificare individuală și parolă stocată sub formă de amprentă
            criptografică. Zona de administrare nu este indexată și nu are linkuri publice.
          </Typography>
          <Typography sx={bodySx}>
            Aplic măsuri tehnice și organizatorice proporționale riscului: minimizarea datelor
            colectate, acces limitat la strictul necesar, copii de siguranță ale bazei de date și
            revizuirea periodică a informațiilor păstrate. În cazul puțin probabil al unui incident
            de securitate care îți poate afecta drepturile, te informez și notific autoritatea
            competentă în termenele prevăzute de GDPR.
          </Typography>
        </>
      ),
    },
    {
      id: 'confidentialitate-sedinte',
      heading: 'Confidențialitatea ședințelor și excepțiile legale',
      content: (
        <>
          <Typography sx={bodySx}>
            Tot ce discutăm în cadrul ședințelor este confidențial. Secretul profesional al
            psihologului este garantat de Legea nr. 213/2004 și de codul deontologic al Colegiului
            Psihologilor din România. Nu comunic nimănui — inclusiv membrilor familiei — faptul că
            ești în terapie sau conținutul ședințelor, fără acordul tău scris.
          </Typography>
          <Typography sx={bodySx}>
            Legea prevede un număr limitat de situații în care confidențialitatea poate fi ridicată,
            strict în măsura necesară:
          </Typography>
          <Box component="ul" sx={listSx}>
            <Typography component="li" variant="body1">
              există un risc iminent și serios pentru viața sau integritatea ta ori a altei
              persoane;
            </Typography>
            <Typography component="li" variant="body1">
              sunt indicii privind abuzul sau neglijarea unui minor ori a unei persoane vulnerabile;
            </Typography>
            <Typography component="li" variant="body1">
              o autoritate judiciară solicită informații în condițiile legii;
            </Typography>
            <Typography component="li" variant="body1">
              discutarea cazului, în formă anonimizată, în cadrul supervizării profesionale
              obligatorii.
            </Typography>
          </Box>
          <Typography sx={bodySx}>
            În oricare dintre aceste situații, te informez despre demersul necesar, atunci când
            acest lucru este posibil și nu sporește riscul.
          </Typography>
        </>
      ),
    },
    {
      id: 'cookies',
      heading: 'Cookie-uri',
      content: (
        <Typography sx={bodySx}>
          Site-ul folosește doar cookie-uri strict necesare pentru funcționare, fără instrumente de
          publicitate sau de analiză a comportamentului. Detaliile complete se găsesc în{' '}
          <Link component={RouterLink} to="/politica-de-cookies" sx={inlineLinkSx}>
            politica de cookies
          </Link>
          .
        </Typography>
      ),
    },
    {
      id: 'contact',
      heading: 'Cum îți exerciți drepturile',
      content: (
        <>
          <Typography sx={bodySx}>
            Pentru orice cerere legată de datele tale personale — acces, rectificare, ștergere,
            restricționare, opoziție, portabilitate sau retragerea consimțământului — scrie-mi
            folosind datele de mai jos. Îți răspund în cel mult o lună de la primirea cererii; dacă
            solicitarea este complexă, te informez despre prelungirea termenului și despre motive.
          </Typography>
          {contactBlock}
        </>
      ),
    },
  ],
  footNote:
    'Această politică poate fi actualizată pentru a reflecta modificări legislative sau tehnice; versiunea aplicabilă este cea publicată aici.',
}

// ------------------------------------------------ Politica de cookies ----

const cookies: LegalDocumentContent = {
  seoTitle: 'Politica de cookies',
  seoDescription:
    'Site-ul Cabinetului Psihologic Adina Gghita folosește doar cookie-uri strict necesare, fără instrumente de marketing sau de analiză. Află ce se stochează și cum îți poți schimba alegerea.',
  heading: 'Politica de cookies',
  intro: (
    <Typography sx={bodySx}>
      Acest site este construit cu un minim de tehnologii de stocare locală: nu urmărește
      vizitatorii, nu construiește profiluri și nu încarcă scripturi de publicitate. Mai jos
      găsești, pe scurt, ce se stochează în browserul tău și cum poți controla aceste informații.
    </Typography>
  ),
  sections: [
    {
      id: 'ce-sunt',
      heading: 'Ce sunt cookie-urile',
      content: (
        <>
          <Typography sx={bodySx}>
            Cookie-urile sunt fișiere text de mici dimensiuni, salvate de browser atunci când
            vizitezi un site. Ele permit, de exemplu, păstrarea unei sesiuni autentificate sau
            memorarea unei preferințe, ca să nu fie cerută la fiecare pagină.
          </Typography>
          <Typography sx={bodySx}>
            Tehnologii similare, precum stocarea locală a browserului (localStorage), au același rol
            și sunt tratate în acest document împreună cu cookie-urile.
          </Typography>
        </>
      ),
    },
    {
      id: 'ce-folosim',
      heading: 'Ce folosim pe acest site',
      content: (
        <>
          <Typography sx={bodySx}>
            Folosim exclusiv cookie-uri și elemente de stocare{' '}
            <strong>strict necesare</strong> funcționării site-ului:
          </Typography>
          <Box component="ul" sx={listSx}>
            <Typography component="li" variant="body1">
              <strong>Preferința privind informarea despre cookie-uri</strong> — reține că ai
              închis deja bannerul, ca să nu îți fie afișat la fiecare vizită. Este salvată în
              stocarea locală a browserului tău și nu părăsește dispozitivul.
            </Typography>
            <Typography component="li" variant="body1">
              <strong>Cookie-ul de sesiune al zonei de administrare</strong> — menține autentificat
              psihologul titular în panoul de management al conținutului. Este setat doar la
              conectare, este de tip HttpOnly și securizat, și nu apare niciodată pentru
              vizitatorii site-ului public.
            </Typography>
            <Typography component="li" variant="body1">
              <strong>Elemente tehnice temporare</strong> necesare securității formularelor și
              funcționării corecte a paginilor.
            </Typography>
          </Box>
          <Typography sx={bodySx}>
            Aceste cookie-uri sunt necesare pentru ca site-ul să funcționeze, deci nu depind de un
            consimțământ prealabil. Nu conțin informații despre starea ta de sănătate și nu permit
            identificarea ta ca vizitator.
          </Typography>
        </>
      ),
    },
    {
      id: 'fara-marketing',
      heading: 'Fără cookie-uri de marketing sau de analiză',
      content: (
        <>
          <Typography sx={bodySx}>
            Site-ul nu folosește cookie-uri de publicitate, de remarketing sau de analiză a
            traficului. Nu sunt integrate instrumente de statistici externe, pixeli de rețele
            sociale sau servicii care să urmărească paginile vizitate.
          </Typography>
          <Typography sx={bodySx}>
            Această alegere este deliberată: într-un domeniu în care simpla vizitare a unei pagini
            poate spune ceva foarte personal, discreția este mai importantă decât datele de
            marketing.
          </Typography>
        </>
      ),
    },
    {
      id: 'stergere',
      heading: 'Cum ștergi cookie-urile din browser',
      content: (
        <>
          <Typography sx={bodySx}>
            Poți șterge sau bloca oricând cookie-urile din setările browserului. Blocarea completă a
            cookie-urilor strict necesare poate face ca unele funcții, precum reținerea preferinței
            de informare, să nu mai funcționeze.
          </Typography>
          <Box component="ul" sx={listSx}>
            <Typography component="li" variant="body1">
              <strong>Google Chrome</strong> — Setări, Confidențialitate și securitate, Cookie-uri
              și alte date ale site-urilor.
            </Typography>
            <Typography component="li" variant="body1">
              <strong>Mozilla Firefox</strong> — Setări, Confidențialitate și securitate,
              Cookie-uri și date ale site-urilor.
            </Typography>
            <Typography component="li" variant="body1">
              <strong>Microsoft Edge</strong> — Setări, Cookie-uri și permisiuni pentru site-uri.
            </Typography>
            <Typography component="li" variant="body1">
              <strong>Safari</strong> — Preferințe, Confidențialitate, Gestionare date ale
              site-urilor web.
            </Typography>
          </Box>
          <Typography sx={bodySx}>
            Majoritatea browserelor oferă și o fereastră de navigare privată, care nu păstrează
            aceste informații după închiderea sesiunii.
          </Typography>
        </>
      ),
    },
    {
      id: 'schimbare-alegere',
      heading: 'Cum îți schimbi alegerea',
      content: (
        <>
          <Typography sx={bodySx}>
            Alegerea făcută în bannerul de informare este salvată local, în browserul tău. Dacă
            ștergi datele site-ului din setările browserului, preferința se elimină, iar bannerul îți
            va fi afișat din nou la următoarea vizită, permițându-ți să decizi din nou.
          </Typography>
          <Typography sx={bodySx}>
            Fiindcă nu folosim cookie-uri opționale, nu există setări suplimentare de gestionat:
            refuzul nu dezactivează nimic în plus, iar acceptarea nu activează nicio urmărire.
          </Typography>
        </>
      ),
    },
    {
      id: 'contact',
      heading: 'Întrebări despre cookie-uri',
      content: (
        <>
          <Typography sx={bodySx}>
            Pentru orice întrebare legată de această politică sau de modul în care sunt tratate
            datele tale, îmi poți scrie oricând. Informațiile complete despre prelucrarea datelor
            personale se găsesc în{' '}
            <Link component={RouterLink} to="/politica-de-confidentialitate" sx={inlineLinkSx}>
              politica de confidențialitate
            </Link>
            .
          </Typography>
          {contactBlock}
        </>
      ),
    },
  ],
  footNote:
    'Dacă în viitor vor fi adăugate instrumente care folosesc cookie-uri opționale, această pagină va fi actualizată înainte de activarea lor.',
}

const documents: Record<LegalDocumentKey, LegalDocumentContent> = {
  terms,
  privacy,
  cookies,
}

export default function LegalPage({ document }: LegalPageProps) {
  const content = documents[document]

  return (
    <>
      <Seo title={content.seoTitle} description={content.seoDescription} />

      <Box component="section" sx={{ py: { xs: 6, md: 9 } }}>
        <Container maxWidth="md">
          <Typography variant="h1" sx={{ fontSize: { xs: '2.125rem', md: '2.75rem' }, mb: 1.5 }}>
            {content.heading}
          </Typography>

          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
            Ultima actualizare: {formatDateRo(LAST_UPDATED)}
          </Typography>

          {content.intro}

          {/* Cuprins cu ancore — scroll-ul lin vine din tema globală. */}
          <Paper
            variant="outlined"
            component="nav"
            aria-label="Cuprinsul documentului"
            sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3, my: { xs: 4, md: 5 } }}
          >
            <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
              Cuprins
            </Typography>
            <Stack component="ol" spacing={1} sx={{ pl: 3, m: 0 }}>
              {content.sections.map((section) => (
                <Box component="li" key={section.id}>
                  <Link
                    href={`#${section.id}`}
                    sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                  >
                    {section.heading}
                  </Link>
                </Box>
              ))}
            </Stack>
          </Paper>

          {content.sections.map((section, index) => (
            <Box
              key={section.id}
              component="section"
              id={section.id}
              sx={{ mb: { xs: 4, md: 5 }, scrollMarginTop: { xs: 88, md: 104 } }}
            >
              <Typography
                variant="h3"
                component="h2"
                sx={{ fontSize: { xs: '1.4rem', md: '1.625rem' }, mb: 2 }}
              >
                {index + 1}. {section.heading}
              </Typography>
              {section.content}
            </Box>
          ))}

          <Divider sx={{ my: 4 }} />

          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {content.footNote}
          </Typography>
        </Container>
      </Box>
    </>
  )
}
