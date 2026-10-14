# Deploy — container unic (Docker)

Imaginea din `Dockerfile` construiește clientul Vite, îl copiază în `wwwroot`-ul API-ului .NET 8
și pornește un singur proces care servește și SPA-ul, și `/api`. Aceeași origine, deci CORS nu
mai este o problemă în producție.

## Ce se completează pe ecranul „Add a component”

| Câmp | Valoare |
| --- | --- |
| Runtime | `Docker` |
| Dockerfile | `Dockerfile` |
| Build context | `.` |
| Listen port | `8080` |
| Database | `No database` (SQLite stă pe volum, nu pe slotul platformei) |

**Listen port: 8080, nu 3000.** Imaginea expune 8080. Dacă platforma injectează totuși o
variabilă `PORT`, entrypoint-ul o respectă, deci ambele situații funcționează — dar câmpul
trebuie să arate portul pe care platforma îl consideră expus.

### Persistent volumes (obligatoriu)

Fără ele, baza de date și imaginile încărcate din panoul de management dispar la fiecare deploy.

| Mount path | Ce conține |
| --- | --- |
| `/data` | `psiho.db` — întreaga bază de date |
| `/app/wwwroot/uploads` | imaginile încărcate din panou |

## Variabile de mediu

Ecranul vine precompletat cu variabile de Laravel (`APP_NAME`, `APP_KEY`, `APP_DEBUG`,
`LOG_CHANNEL`, `MAIL_MAILER`, `MAIL_USERNAME`, `MAIL_PASSWORD`). Aplicația este .NET, nu Laravel —
**niciuna dintre ele nu este citită**. Se pot șterge; cele două marcate „value required” pot
primi orice valoare dacă platforma nu permite ștergerea, dar nu au niciun efect.

Variabilele reale (`__`, dublu underscore, este separatorul de secțiune în .NET):

| Variabilă | Valoare | Note |
| --- | --- | --- |
| `ConnectionStrings__Default` | `Data Source=/data/psiho.db` | deja setată în imagine; se rescrie doar dacă schimbi mount path-ul |
| `Jwt__SigningKey` | șir aleator de **minimum 32 de bytes** | **obligatoriu** — aplicația refuză să pornească în producție fără el |
| `AdminSeed__Password` | parola primului cont de administrator | se folosește o singură dată, la prima pornire |
| `AdminSeed__Username` | `admin` | opțional |
| `AdminSeed__SeedDemoContent` | `true` la primul deploy | vezi secțiunea „Conținutul din seed” — cu `false`, site-ul pornește **fără niciun serviciu** |
| `Cors__AllowedOrigins` | domeniul real, ex. `https://www.adinagghita.ro` | poate rămâne gol când SPA-ul e servit din aceeași imagine |
| `Site__PublicUrl` | `https://www.adinagghita.ro` | folosit în `sitemap.xml` și în linkurile canonice |
| `Smtp__Enabled` | `true` | doar dacă vrei notificări pe email la programări |
| `Smtp__Host`, `Smtp__Port`, `Smtp__Username`, `Smtp__Password` | datele furnizorului SMTP | |
| `Smtp__FromAddress`, `Smtp__ToAddress` | expeditor / destinatar notificări | |
| `GoogleCalendar__Enabled` | `true` | doar dacă vrei evenimentele confirmate în Google Calendar |
| `GoogleCalendar__CalendarId` | adresa Gmail a cabinetului (sau id-ul unui calendar secundar) | calendarul trebuie partajat cu emailul contului de serviciu, cu „Modificare evenimente” |
| `GoogleCalendar__ServiceAccountJson` sau `GoogleCalendar__ServiceAccountJsonPath` | conținutul cheii JSON, sau calea ei, ex. `/data/google-sa.json` | secret — niciodată în imagine sau în repo |

**Gmail ca SMTP:** `Smtp__Host=smtp.gmail.com`, `Smtp__Port=587`, `Smtp__UseStartTls=true`,
`Smtp__Username` și `Smtp__FromAddress` = adresa Gmail (Gmail rescrie alt expeditor),
`Smtp__Password` = o **parolă de aplicație** (App Password; cere verificarea în doi pași pe cont —
parola normală nu funcționează), `Smtp__ToAddress` = inboxul care primește notificările.

**Google Calendar:** în Google Cloud se creează un proiect, se activează Calendar API, se creează
un cont de serviciu și se descarcă cheia JSON; apoi, în Google Calendar, calendarul se partajează
cu emailul contului de serviciu. Fără aceste variabile programările funcționează, doar fără
sincronizare (starea rămâne „NotNeeded”). Clientul primește oricum invitația ca fișier `.ics`.

Generarea cheii JWT (PowerShell):

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Max 256 }))
```

Cheia și parola de admin sunt secrete: se pun ca **environment variables**, nu ca build
arguments — ecranul avertizează corect că build arguments rămân în istoricul imaginii.

## Test local înainte de deploy

```powershell
docker build -t psiho .
docker run --rm -p 8080:8080 `
  -v psiho-data:/data `
  -v psiho-uploads:/app/wwwroot/uploads `
  -e Jwt__SigningKey="cheie-de-test-cu-cel-putin-32-de-caractere" `
  -e AdminSeed__Password="parola-de-test" `
  -e AdminSeed__SeedDemoContent=false `
  psiho
```

Apoi `http://localhost:8080` — site-ul public — și `http://localhost:8080/management` pentru
panou. La prima pornire, migrațiile EF rulează automat și se creează contul de administrator.

## De verificat după primul deploy

1. Refresh pe o rută client-side (`/blog/<articol>`) — trebuie să întoarcă pagina, nu 404.
   Confirmă că `MapFallbackToFile` a găsit `wwwroot/index.html`.
2. Încarcă o imagine din panou, apoi redeploy — imaginea trebuie să existe în continuare.
   Confirmă volumul de `uploads`.
3. Autentifică-te în panou după un redeploy — dacă se cere din nou seed-ul, volumul `/data`
   nu este montat corect.
4. HTTPS: platforma termină TLS în fața containerului. Imaginea setează
   `ASPNETCORE_FORWARDEDHEADERS_ENABLED=true`, deci aplicația vede schema corectă și
   `UseHttpsRedirection` nu intră în buclă.

## Detalii de implementare care contează la depanare

- **Portul.** Entrypoint-ul pornește pe `$PORT` dacă platforma îl injectează, altfel pe 8080.
  Dacă în log apare `Now listening on: http://[::]:8080` dar platforma raportează componenta
  ca nepornită, câmpul „Listen port” nu coincide — pune 8080.
- **Proprietarul volumelor.** Multe platforme montează volumele ca `root`, iar aplicația
  rulează ca utilizatorul neprivilegiat `app` (UID 1654). Entrypoint-ul face `chown` pe `/data`
  și `/app/wwwroot/uploads` înainte de a coborî privilegiile cu `gosu`, deci situația e
  acoperită. Dacă platforma pornește containerul direct cu un UID fix, non-root, iar volumele
  rămân ale lui root, `chown` eșuează silențios și vei vedea în log
  `SQLite Error 14: 'unable to open database file'` — atunci volumul trebuie făcut scriibil
  de acel UID din interfața platformei.
- **Imagine Debian, nu Alpine.** Intenționat: `SQLitePCLRaw` (biblioteca nativă din spatele
  EF Core SQLite) și ICU sunt mai bine testate pe glibc decât pe musl.
- **Migrațiile rulează la pornire** (`db.Database.MigrateAsync()` în `Program.cs`), deci nu e
  nevoie de un pas separat de migrare în pipeline.

## Conținutul din seed — de verificat înainte de a face site-ul public

`AdminSeed:SeedDemoContent` controlează tot conținutul inițial, nu doar exemple: cu `false`,
seeder-ul creează doar contul de administrator, iar site-ul pornește gol (fără servicii, fără
FAQ). De aceea la primul deploy se lasă `true`. Seeder-ul inserează doar când tabelele sunt
goale, deci nu suprascrie nimic la deploy-urile următoare.

Ce intră în baza de date:

- **Serviciile (6)** — lista reală a cabinetului. Se păstrează.
- **FAQ (6) și categoriile (5)** — de recitit, dar utile ca punct de plecare.
- **Articolele (4)** — text de start, scris pentru site. De recitit înainte de publicare.
- **Testimonialele (4)** — semnate „A.M.”, „D.R.”, „C.P.”, „I.S.”. **Sunt texte generate ca
  exemplu, nu feedback real de la clienți.** Înainte ca site-ul să devină public, ele trebuie
  șterse sau depublicate din panou — publicarea unor testimoniale inventate ca și cum ar fi
  reale înseamnă practică comercială înșelătoare (ANPC) și, pentru un psiholog, o problemă de
  deontologie profesională (Codul deontologic COPSI). Dacă există feedback real de la clienți,
  el poate fi adăugat din panou, cu acordul lor și anonimizat.

## Backup

`psiho.db` este un singur fișier pe volumul `/data`. Un job zilnic care îl copiază (plus
folderul `uploads`) este suficient ca plan de recuperare pentru un site de această dimensiune.
