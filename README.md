# Cabinet Psihologic Adina Gghita

Site public + panou de management ascuns, implementat după
`../PLAN_IMPLEMENTARE_Cabinet_Psihologic_Adina_Gghita.md`.

- **Backend:** .NET 8, Clean Architecture (Domain / Application / Infrastructure / Api), MediatR,
  FluentValidation, EF Core + SQLite, JWT, MailKit, rate limiting.
- **Frontend:** React 19 + TypeScript + Vite 7, MUI 7, react-router-dom, react-hook-form + zod,
  TipTap (editor articole), DOMPurify, react-helmet-async.

## Structură

```
PsihoAdinaGghita/
├─ src/PsihoAdinaGghita.Domain/          entități, enumuri, BaseEntity
├─ src/PsihoAdinaGghita.Application/     comenzi/queries MediatR, validatori, interfețe
├─ src/PsihoAdinaGghita.Infrastructure/  EF Core (SQLite), migrări, seed, email, JWT, storage
├─ src/PsihoAdinaGghita.Api/             controllere, middleware, Program.cs, wwwroot/uploads
├─ tests/PsihoAdinaGghita.Api.Tests/     teste de integrare (28)
└─ client/                               aplicația React
```

Regula de dependențe: `Api → Infrastructure, Application`, `Infrastructure → Application, Domain`,
`Application → Domain`. Providerul EF (SQLite) există **doar** în Infrastructure.

## Rulare în dezvoltare

Două procese, în două terminale:

```powershell
# 1) API — http://localhost:5180 (Swagger la /swagger)
cd src\PsihoAdinaGghita.Api
dotnet run

# 2) Client — http://localhost:5173
cd client
npm install
npm run dev
```

Clientul apelează API-ul prin proxy-ul Vite (`/api` → `http://localhost:5180`), deci în dev
`VITE_API_BASE_URL` rămâne gol. Portul este definit într-un singur loc: `Properties/launchSettings.json`
pentru API și `vite.config.ts` pentru proxy.

La prima pornire, `Database.MigrateAsync()` creează `psiho.db`, iar `DbSeeder` inserează utilizatorul
admin și conținut demo (5 categorii, 5 servicii, 6 întrebări frecvente, 4 testimoniale, 4 articole).
Seed-ul este idempotent.

### Autentificare în panou

Panoul este la `/management/login` — **nu există niciun link către el** din site-ul public, iar ruta
este exclusă din `sitemap.xml` și blocată în `robots.txt`.

Parola de dezvoltare vine din `appsettings.Development.json` (`AdminSeed:Password`). Utilizatorul de
seed are `MustChangePassword = true`, deci prima acțiune cerută este schimbarea parolei din
*Setări*.

## Secrete

**Nimic sensibil nu intră în `appsettings.json`.** În dezvoltare se folosesc User Secrets:

```powershell
cd src\PsihoAdinaGghita.Api
dotnet user-secrets set "Jwt:SigningKey"   "<minim 32 de bytes aleatori>"
dotnet user-secrets set "AdminSeed:Password" "<parolă temporară puternică>"
dotnet user-secrets set "Smtp:Host"        "smtp.exemplu.ro"
dotnet user-secrets set "Smtp:Username"    "no-reply@exemplu.ro"
dotnet user-secrets set "Smtp:Password"    "<parola SMTP>"
dotnet user-secrets set "Smtp:FromAddress" "no-reply@exemplu.ro"
dotnet user-secrets set "Smtp:ToAddress"   "adina@exemplu.ro"
dotnet user-secrets set "Smtp:Enabled"     "true"
```

În producție aceleași chei se dau ca variabile de mediu
(`Jwt__SigningKey`, `Smtp__Password`, `ConnectionStrings__Default`, `Cors__AllowedOrigins`, …).
Fără `Jwt:SigningKey` de minim 32 de bytes, aplicația **refuză să pornească** în afara dezvoltării.

Cu `Smtp:Enabled = false` emailurile nu se trimit, doar se loghează subiectul — cererile de
programare se salvează oricum în baza de date, deci fluxul funcționează fără SMTP.

## Migrări

Uneltele EF folosesc `AppDbContextFactory` din Infrastructure, ca proiectul Api să nu depindă de
`EntityFrameworkCore.Design`:

```powershell
dotnet dotnet-ef migrations add NumeMigrare `
  --project src\PsihoAdinaGghita.Infrastructure `
  --startup-project src\PsihoAdinaGghita.Infrastructure `
  --output-dir Persistence\Migrations
```

Migrările se aplică automat la pornirea API-ului. `dotnet-ef` 8.0.11 este fixat în
`.config/dotnet-tools.json` (`dotnet tool restore`).

## Teste

```powershell
dotnet test
```

Acoperă: endpointurile publice, faptul că validarea FluentValidation **rulează efectiv** (plan §5),
autorizarea pe `/api/admin/*`, fluxul de login (mesaj generic la eșec, refresh token doar în cookie
HttpOnly), câmpul-capcană anti-spam, headerele de securitate și absența rutelor de management din
`sitemap.xml`.

Fiecare clasă de teste pornește propria instanță de API pe o bază SQLite temporară — altfel
politicile de rate limiting (`login`: 5/15 min, `public-forms`: 3/oră) ar face testele să se
influențeze reciproc.

## Build de producție

```powershell
cd client
npm run build                      # → client/dist

cd ..
dotnet publish src\PsihoAdinaGghita.Api -c Release -o publish
```

Pentru un singur proces și zero probleme de CORS, copiază `client/dist/*` în
`publish/wwwroot/`. `Program.cs` activează `MapFallbackToFile("index.html")` doar dacă găsește
`wwwroot/index.html`, deci rutarea client-side funcționează la refresh pe `/blog/articol`.

De reținut la deploy:

- `wwwroot/uploads` trebuie păstrat între deploy-uri (volum sau folder persistent) — conține
  imaginile încărcate din panou.
- `psiho.db` este un singur fișier: backup înainte de fiecare deploy și job zilnic de copiere.
- HTTPS obligatoriu; în producție se activează HSTS și redirectul HTTP → HTTPS.
- `Cors:AllowedOrigins` și `Site:PublicUrl` se setează pe domeniul real (contează pentru
  `sitemap.xml` și `canonical`).

## Ce lipsește (depinde de client)

Primite și integrate: textul „Despre mine" și atestatele (`resources/despre-mine-psiholog.md`),
portretul (`client/src/assets/adina-gghita-portret*.jpg`), lista reală de servicii și localitatea
cabinetului (Str. Sapienței, Sector 5, București).

Încă de completat, conform plan §11: numărul de la stradă, numărul de atestat COPSI, telefonul și
adresa de e-mail reale, prețurile pentru cele patru servicii afișate momentan fără preț
(intervenție copii/adolescenți, consiliere părinți, examinări copii cu dizabilități, avize
psihologice), fotografiile cabinetului, linkurile de social media, logo-ul și testimonialele cu
acord de publicare.

Până atunci: datele de contact sunt centralizate în `client/src/config/site.ts` (citite din `.env`),
iar în locul fotografiilor de cabinet se afișează substituenți construiți din paleta temei
(`PlaceholderImage`). Fotografiile reale se adaugă cu `PhotoImage`, care primește aceleași props.
