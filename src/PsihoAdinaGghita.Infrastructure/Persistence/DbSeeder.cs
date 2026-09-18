using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PsihoAdinaGghita.Application.Common.Helpers;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Domain.Entities;
using PsihoAdinaGghita.Domain.Enums;
using PsihoAdinaGghita.Infrastructure.Options;

namespace PsihoAdinaGghita.Infrastructure.Persistence;

/// <summary>
/// Populează baza de date la pornire (plan §4). Rulează după <c>Database.MigrateAsync()</c> și este
/// idempotentă: fiecare grup de date se inserează doar dacă tabelul corespunzător este gol.
/// </summary>
public class DbSeeder
{
    // Numele categoriilor din plan §4 — folosite și la legarea articolelor demo.
    private const string CategoryAnxietate = "Anxietate și depresie";
    private const string CategoryRelatii = "Relații și cuplu";
    private const string CategoryCopii = "Copii și adolescenți";
    private const string CategoryDezvoltare = "Dezvoltare personală";
    private const string CategoryComportament = "Comportament și decizii";

    private readonly AppDbContext _db;
    private readonly AdminSeedOptions _options;
    private readonly IPasswordHasher _hasher;
    private readonly ILogger<DbSeeder> _logger;

    public DbSeeder(
        AppDbContext db,
        IOptions<AdminSeedOptions> options,
        IPasswordHasher hasher,
        ILogger<DbSeeder> logger)
    {
        _db = db;
        _options = options.Value;
        _hasher = hasher;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var adminCreated = await SeedAdminUserAsync(cancellationToken);

        if (!_options.SeedDemoContent)
        {
            _logger.LogInformation(
                "Seed finalizat. Utilizator administrator creat: {AdminCreated}. Conținutul demo este dezactivat (AdminSeed:SeedDemoContent = false).",
                adminCreated);
            return;
        }

        var categories = await SeedCategoriesAsync(cancellationToken);
        var services = await SeedServicesAsync(cancellationToken);
        var faqItems = await SeedFaqItemsAsync(cancellationToken);
        var testimonials = await SeedTestimonialsAsync(cancellationToken);
        var articles = await SeedArticlesAsync(cancellationToken);

        _logger.LogInformation(
            "Seed finalizat. Administrator creat: {AdminCreated}. Inserate: {Categories} categorii, {Services} servicii, {FaqItems} întrebări frecvente, {Testimonials} testimoniale, {Articles} articole.",
            adminCreated, categories, services, faqItems, testimonials, articles);
    }

    // ---- Administrator ------------------------------------------------------

    private async Task<bool> SeedAdminUserAsync(CancellationToken cancellationToken)
    {
        if (await _db.AdminUsers.AnyAsync(cancellationToken))
            return false;

        var passwordFromConfiguration = !string.IsNullOrWhiteSpace(_options.Password);
        var password = passwordFromConfiguration ? _options.Password : GenerateStrongPassword();

        var username = string.IsNullOrWhiteSpace(_options.Username) ? "admin" : _options.Username.Trim();
        var fullName = string.IsNullOrWhiteSpace(_options.FullName) ? "Adina Gghita" : _options.FullName.Trim();

        _db.AdminUsers.Add(new AdminUser
        {
            Username = username,
            FullName = fullName,
            PasswordHash = _hasher.Hash(password),
            MustChangePassword = true,
        });

        await _db.SaveChangesAsync(cancellationToken);

        if (passwordFromConfiguration)
        {
            // Parola venită din configurație nu se loghează niciodată (plan §10).
            _logger.LogInformation(
                "Utilizatorul administrator „{Username}” a fost creat cu parola din configurație; schimbarea ei este obligatorie la primul login.",
                username);
        }
        else
        {
            // Singurul moment în care parola apare în log: altfel nu ar exista nicio cale de a intra în aplicație.
            _logger.LogWarning(
                "Nu a fost configurată nicio parolă de administrator (AdminSeed:Password). S-a generat una temporară pentru utilizatorul „{Username}”: {TemporaryPassword} — folosește-o la primul login, apoi schimbă-o. Nu va mai fi afișată.",
                username, password);
        }

        return true;
    }

    /// <summary>Parolă temporară puternică (20 de caractere) generată criptografic.</summary>
    private static string GenerateStrongPassword(int length = 20)
    {
        // Fără caractere ambigue (0/O, 1/l/I), ca să poată fi tastată corect de la consolă.
        const string lower = "abcdefghijkmnopqrstuvwxyz";
        const string upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        const string digits = "23456789";
        const string symbols = "!@#$%*-_=+?";
        const string all = lower + upper + digits + symbols;

        var characters = new char[length];
        characters[0] = lower[RandomNumberGenerator.GetInt32(lower.Length)];
        characters[1] = upper[RandomNumberGenerator.GetInt32(upper.Length)];
        characters[2] = digits[RandomNumberGenerator.GetInt32(digits.Length)];
        characters[3] = symbols[RandomNumberGenerator.GetInt32(symbols.Length)];

        for (var i = 4; i < length; i++)
            characters[i] = all[RandomNumberGenerator.GetInt32(all.Length)];

        for (var i = characters.Length - 1; i > 0; i--)
        {
            var j = RandomNumberGenerator.GetInt32(i + 1);
            (characters[i], characters[j]) = (characters[j], characters[i]);
        }

        return new string(characters);
    }

    // ---- Categorii ----------------------------------------------------------

    private async Task<int> SeedCategoriesAsync(CancellationToken cancellationToken)
    {
        if (await _db.Categories.AnyAsync(cancellationToken))
            return 0;

        var categories = new List<Category>
        {
            new()
            {
                Name = CategoryAnxietate,
                Description = "Despre atacurile de panică, îngrijorarea persistentă și stările depresive: cum se manifestă și ce funcționează în terapie.",
                DisplayOrder = 1,
            },
            new()
            {
                Name = CategoryRelatii,
                Description = "Comunicare, conflicte care se repetă, încredere și intimitate. Resurse pentru cupluri și pentru cei care traversează o despărțire.",
                DisplayOrder = 2,
            },
            new()
            {
                Name = CategoryCopii,
                Description = "Emoții greu de gestionat, adaptarea la școală, somn, limite și pubertate. Articole scrise pentru părinți care vor să înțeleagă, nu doar să corecteze.",
                DisplayOrder = 3,
            },
            new()
            {
                Name = CategoryDezvoltare,
                Description = "Stimă de sine, echilibru între muncă și viața personală, gestionarea stresului și obiceiuri sănătoase pe termen lung.",
                DisplayOrder = 4,
            },
            new()
            {
                Name = CategoryComportament,
                Description = "Amânarea, deciziile dificile, perfecționismul și tiparele de comportament care ne țin pe loc, explicate pe înțelesul tuturor.",
                DisplayOrder = 5,
            },
        };

        foreach (var category in categories)
            category.Slug = SlugHelper.Generate(category.Name);

        _db.Categories.AddRange(categories);
        await _db.SaveChangesAsync(cancellationToken);

        return categories.Count;
    }

    // ---- Servicii -----------------------------------------------------------

    private async Task<int> SeedServicesAsync(CancellationToken cancellationToken)
    {
        if (await _db.Services.AnyAsync(cancellationToken))
            return 0;

        var services = new List<Service>
        {
            new()
            {
                Name = "Psihoterapie individuală",
                ShortDescription = "Un spațiu confidențial, doar al tău, în care putem lucra pe anxietate, stări depresive, epuizare sau evenimente dificile de viață. Lucrăm împreună la ritmul tău, cu obiective stabilite de comun acord.",
                LongDescriptionHtml =
                    """
                    <p>Psihoterapia individuală este o colaborare între tine și mine, construită pe încredere și pe un ritm pe care îl stabilim împreună. În primele ședințe ne concentrăm pe a înțelege ce te aduce în cabinet, ce ai încercat deja și ce ți-ar plăcea să fie diferit. Din această imagine comună formulăm obiective concrete, la care revenim periodic.</p>
                    <p>Abordarea mea este integrativă, cu accent pe terapia cognitiv-comportamentală: identificăm gândurile automate și comportamentele care întrețin suferința și exersăm alternative, atât în ședință, cât și între ședințe. Când tema o cere, folosim și tehnici de reglare emoțională, mindfulness sau lucru cu istoria personală.</p>
                    <p>O ședință durează 50 de minute și, la început, are loc de obicei săptămânal. Frecvența se poate rări pe măsură ce apar schimbările pe care le urmărim. Nu există un număr fix de ședințe: unele teme se clarifică în 8–12 întâlniri, altele cer un proces mai lung.</p>
                    <p><strong>Pentru cine este potrivit:</strong></p>
                    <ul>
                      <li>Persoane care trăiesc anxietate, atacuri de panică sau îngrijorare permanentă.</li>
                      <li>Persoane cu stări depresive, lipsă de energie sau pierderea sensului.</li>
                      <li>Cei care trec printr-o pierdere, o despărțire sau o schimbare majoră de viață.</li>
                      <li>Oricine simte epuizare profesională și nu mai găsește resurse pentru cotidian.</li>
                      <li>Persoane care vor să se înțeleagă mai bine, fără să existe un diagnostic.</li>
                    </ul>
                    """,
                Price = 250m,
                PriceUnit = "/ ședință 50 min",
                DurationMinutes = 50,
                SessionMode = SessionMode.Both,
                IconName = "Psychology",
                DisplayOrder = 1,
                IsActive = true,
            },
            new()
            {
                Name = "Terapie de cuplu",
                ShortDescription = "Ședințe pentru cupluri care se ceartă mereu despre același lucru, s-au îndepărtat sau trec printr-o criză de încredere. Lucrăm pe comunicare, nevoi nespuse și reconstrucția legăturii.",
                LongDescriptionHtml =
                    """
                    <p>În terapia de cuplu nu caut să stabilesc cine are dreptate. Rolul meu este să fac vizibil tiparul în care intrați amândoi atunci când apare tensiunea și să vă ajut să vă auziți din nou, dincolo de reproșuri. Prima întâlnire este comună; uneori propun și câte o ședință individuală, pentru a înțelege mai bine perspectiva fiecăruia.</p>
                    <p>Lucrăm cu situații reale din ultimele săptămâni: cine spune ce, ce interpretează celălalt, unde se rupe conversația. În loc de sfaturi generale, exersăm în ședință moduri concrete de a formula o nemulțumire, de a cere ceva și de a repara după un conflict.</p>
                    <p>Ședințele durează 80 de minute, pentru ca amândoi să aveți spațiu real de vorbit, și au loc de obicei la două săptămâni, ca să existe timp pentru exercițiu între întâlniri. Confidențialitatea se aplică relației, nu unuia dintre parteneri împotriva celuilalt.</p>
                    <p><strong>Pentru cine este potrivit:</strong></p>
                    <ul>
                      <li>Cupluri prinse în conflicte repetitive, care se sting fără să se rezolve.</li>
                      <li>Parteneri care s-au distanțat emoțional sau trăiesc împreună „ca doi colegi de apartament”.</li>
                      <li>Relații afectate de o infidelitate sau de o ruptură de încredere.</li>
                      <li>Cupluri care traversează o schimbare importantă: mutare, naștere, boală, șomaj.</li>
                      <li>Parteneri care vor să decidă în mod asumat dacă merg mai departe împreună sau separat.</li>
                    </ul>
                    """,
                Price = 350m,
                PriceUnit = "/ ședință 80 min",
                DurationMinutes = 80,
                SessionMode = SessionMode.Both,
                IconName = "Favorite",
                DisplayOrder = 2,
                IsActive = true,
            },
            new()
            {
                Name = "Consiliere pentru copii și adolescenți",
                ShortDescription = "Sprijin pentru copii și adolescenți care trec prin anxietate, dificultăți la școală, furie greu de gestionat sau schimbări în familie. Părinții sunt parte din proces, la fiecare pas.",
                LongDescriptionHtml =
                    """
                    <p>Copiii nu vin în cabinet spunând „am anxietate”. Ei ne arată ce simt prin somn agitat, dureri de burtă dimineața, refuzul de a merge la școală, izbucniri de furie sau retragere. Prima întâlnire este cu părinții, ca să înțeleg contextul și istoria, iar de la a doua lucrez direct cu copilul, adaptând instrumentele la vârsta lui.</p>
                    <p>Cu cei mici folosesc joc, desen și povești terapeutice: acestea le permit să exprime ce nu pot încă spune în cuvinte. Cu adolescenții, conversația este centrală, dar plecăm de la temele lor — școală, prieteni, imagine de sine, relații — nu de la agenda adulților.</p>
                    <p>La fiecare 4–5 ședințe programez o întâlnire de feedback cu părinții, în care discutăm direcția și ce se poate schimba acasă. Ce îmi povestește copilul rămâne confidențial; ce transmit părinților sunt teme generale și recomandări, agreate în prealabil cu el.</p>
                    <p><strong>Pentru cine este potrivit:</strong></p>
                    <ul>
                      <li>Copii de la 6 ani și adolescenți până la 18 ani.</li>
                      <li>Anxietate de separare, frică de școală, teamă intensă de evaluare.</li>
                      <li>Furie, opoziție sau comportamente greu de gestionat acasă și la școală.</li>
                      <li>Familii care traversează un divorț, o mutare sau o pierdere.</li>
                      <li>Adolescenți cu stimă de sine scăzută, izolare sau tulburări de somn.</li>
                    </ul>
                    """,
                Price = 250m,
                PriceUnit = "/ ședință 50 min",
                DurationMinutes = 50,
                SessionMode = SessionMode.Cabinet,
                IconName = "ChildCare",
                DisplayOrder = 3,
                IsActive = true,
            },
            new()
            {
                Name = "Consiliere online",
                ShortDescription = "Aceeași ședință de 50 de minute, prin videoconferință securizată. O variantă practică dacă locuiești în altă localitate, călătorești des sau ai un program greu de potrivit cu deplasarea.",
                LongDescriptionHtml =
                    """
                    <p>Ședințele online funcționează după aceleași principii ca cele din cabinet: durează 50 de minute, au loc la o oră fixă și respectă aceeași confidențialitate. Primești un link de conectare înainte de fiecare întâlnire și nu ai nevoie de nicio aplicație complicată — doar de un dispozitiv cu cameră și microfon.</p>
                    <p>Pentru ca ședința să fie utilă, ai nevoie de un spațiu în care să nu fii întrerupt și de o conexiune stabilă. Recomand căștile: îmbunătățesc sunetul și adaugă un strat de intimitate dacă în casă mai sunt și alte persoane. Dacă legătura se întrerupe, continuăm telefonic și recuperăm minutele pierdute.</p>
                    <p>Formatul online este eficient pentru majoritatea temelor de consiliere și psihoterapie individuală. Există însă situații care cer prezență în cabinet — risc suicidar, nevoia unei evaluări complexe sau lucrul cu copii mici — și în aceste cazuri îți voi spune deschis, de la prima discuție.</p>
                    <p><strong>Pentru cine este potrivit:</strong></p>
                    <ul>
                      <li>Persoane din alte orașe sau din diaspora, care vor să lucreze în limba română.</li>
                      <li>Program de lucru aglomerat sau deplasări frecvente.</li>
                      <li>Părinți de copii mici, pentru care drumul până la cabinet este dificil.</li>
                      <li>Situații de mobilitate redusă sau perioade de boală.</li>
                      <li>Cei care se simt mai confortabil vorbind dintr-un mediu familiar.</li>
                    </ul>
                    """,
                Price = 220m,
                PriceUnit = "/ ședință 50 min",
                DurationMinutes = 50,
                SessionMode = SessionMode.Online,
                IconName = "Videocam",
                DisplayOrder = 4,
                IsActive = true,
            },
            new()
            {
                Name = "Evaluare psihologică",
                ShortDescription = "Evaluare structurată prin interviu clinic și teste standardizate, finalizată cu un raport scris și o ședință de discuție a rezultatelor. Utilă când ai nevoie de claritate sau de un document oficial.",
                LongDescriptionHtml =
                    """
                    <p>Evaluarea psihologică este un proces de clarificare: pornim de la întrebarea ta („de ce mă simt așa?”, „ce se întâmplă cu copilul meu la școală?”) și adunăm informații din mai multe surse — interviu clinic, chestionare validate, uneori observație și discuții cu familia.</p>
                    <p>Procesul se desfășoară de obicei în două întâlniri de aproximativ 90 de minute, la care se adaugă timpul de scorare și interpretare. La final primești un raport scris, în limbaj accesibil, cu concluzii, factori de risc și de protecție și recomandări clare privind pașii următori.</p>
                    <p>Rezultatele le discutăm împreună într-o ședință dedicată, în care ai timp să pui întrebări. Un raport nu este o etichetă: este un instrument de lucru, care poate ghida o intervenție terapeutică, o adaptare școlară sau colaborarea cu un medic psihiatru.</p>
                    <p><strong>Pentru cine este potrivit:</strong></p>
                    <ul>
                      <li>Persoane care vor să înțeleagă mai exact nivelul de anxietate, depresie sau stres.</li>
                      <li>Părinți care au nevoie de o imagine clară asupra dificultăților școlare ale copilului.</li>
                      <li>Situații care cer un raport psihologic scris pentru o instituție sau pentru un medic.</li>
                      <li>Cei care doresc o a doua opinie înainte de a începe un proces terapeutic.</li>
                      <li>Persoane care vor un punct de plecare măsurabil, pentru a urmări progresul în timp.</li>
                    </ul>
                    """,
                Price = 400m,
                PriceUnit = "/ evaluare completă",
                DurationMinutes = 90,
                SessionMode = SessionMode.Cabinet,
                IconName = "Assignment",
                DisplayOrder = 5,
                IsActive = true,
            },
        };

        foreach (var service in services)
            service.Slug = SlugHelper.Generate(service.Name);

        _db.Services.AddRange(services);
        await _db.SaveChangesAsync(cancellationToken);

        return services.Count;
    }

    // ---- Întrebări frecvente ------------------------------------------------

    private async Task<int> SeedFaqItemsAsync(CancellationToken cancellationToken)
    {
        if (await _db.FaqItems.AnyAsync(cancellationToken))
            return 0;

        var faqItems = new List<FaqItem>
        {
            new()
            {
                Question = "Cât durează o ședință de psihoterapie?",
                AnswerHtml =
                    """
                    <p>O ședință individuală durează 50 de minute, iar una de cuplu 80 de minute. Evaluările psihologice sunt mai lungi, aproximativ 90 de minute per întâlnire.</p>
                    <p>Intervalul este fix și începe la ora programată, așa că îți recomand să ajungi cu câteva minute mai devreme. Dacă întârzii, ședința se încheie tot la ora stabilită, pentru a nu afecta programarea următoare.</p>
                    """,
                DisplayOrder = 1,
                IsActive = true,
            },
            new()
            {
                Question = "De câte ședințe voi avea nevoie?",
                AnswerHtml =
                    """
                    <p>Nu există un răspuns valabil pentru toată lumea. Pentru o temă bine delimitată — pregătirea unui examen, o decizie dificilă, un atac de panică apărut recent — sunt adesea suficiente 8–12 ședințe. Temele care vin din istoria personală, cum sunt anxietatea de lungă durată sau stima de sine scăzută, cer de obicei un proces mai lung.</p>
                    <p>La prima întâlnire îți pot oferi o estimare realistă, iar la fiecare 4–5 ședințe evaluăm împreună progresul și decidem dacă mergem mai departe, dacă rărim ritmul sau dacă încheiem. Decizia de a continua rămâne întotdeauna a ta.</p>
                    """,
                DisplayOrder = 2,
                IsActive = true,
            },
            new()
            {
                Question = "Cum se desfășoară prima ședință?",
                AnswerHtml =
                    """
                    <p>Prima ședință este o discuție de cunoaștere. Te voi întreba ce te aduce în cabinet, de când durează dificultatea, cum te afectează în viața de zi cu zi și ce ai încercat până acum. Nu trebuie să te pregătești în vreun fel și nu există răspunsuri corecte sau greșite.</p>
                    <p>Îți explic apoi cum lucrez, cum arată cadrul (durată, frecvență, confidențialitate, plată, anulări) și ce obiective ar fi realiste. La final ai toate informațiile ca să decizi dacă vrei să continuăm împreună. Este perfect în regulă să simți nevoia de a mai discuta și cu alt specialist înainte de a alege.</p>
                    """,
                DisplayOrder = 3,
                IsActive = true,
            },
            new()
            {
                Question = "Ce se întâmplă cu informațiile pe care le spun în cabinet?",
                AnswerHtml =
                    """
                    <p>Tot ce discutăm este confidențial. Nu împărtășesc informații despre tine cu familia, angajatorul sau alte persoane fără acordul tău scris, iar notițele de ședință sunt păstrate în condiții de siguranță și separat de datele tale de contact.</p>
                    <p>Există trei excepții impuse de lege și de codul deontologic al profesiei: riscul iminent pentru viața ta sau a altcuiva, situațiile de abuz asupra unui copil sau a unei persoane vulnerabile și solicitarea expresă a unei instanțe de judecată. Îți explic aceste limite la prima ședință, înainte de a începe.</p>
                    """,
                DisplayOrder = 4,
                IsActive = true,
            },
            new()
            {
                Question = "Ședințele online sunt la fel de eficiente ca cele din cabinet?",
                AnswerHtml =
                    """
                    <p>Pentru majoritatea temelor de consiliere și psihoterapie individuală, studiile arată rezultate comparabile cu ale ședințelor față în față. Ai nevoie doar de un spațiu în care să nu fii întrerupt, de o conexiune stabilă și, ideal, de căști.</p>
                    <p>Sunt însă situații în care recomand prezența în cabinet: evaluările psihologice complexe, lucrul cu copiii mici și momentele care presupun un risc crescut pentru siguranța ta. Dacă ne aflăm într-un astfel de caz, îți voi spune deschis și vom găsi împreună varianta potrivită.</p>
                    """,
                DisplayOrder = 5,
                IsActive = true,
            },
            new()
            {
                Question = "Cum se face plata și ce se întâmplă dacă anulez o ședință?",
                AnswerHtml =
                    """
                    <p>Plata se face la finalul fiecărei ședințe, în numerar sau prin transfer bancar, iar pentru ședințele online prin transfer, înainte de întâlnire. La cerere, emit factură. Nu lucrez cu abonamente plătite în avans: fiecare ședință se achită separat.</p>
                    <p>Programările pot fi anulate sau reprogramate gratuit cu cel puțin 24 de ore înainte. Sub acest interval, ședința se tarifează integral, pentru că intervalul rămâne rezervat și nu mai poate fi oferit altcuiva. În situații de urgență medicală găsim, evident, o soluție împreună.</p>
                    """,
                DisplayOrder = 6,
                IsActive = true,
            },
        };

        _db.FaqItems.AddRange(faqItems);
        await _db.SaveChangesAsync(cancellationToken);

        return faqItems.Count;
    }

    // ---- Testimoniale -------------------------------------------------------

    private async Task<int> SeedTestimonialsAsync(CancellationToken cancellationToken)
    {
        if (await _db.Testimonials.AnyAsync(cancellationToken))
            return 0;

        // Doar iniţiale, conform practicii de confidenţialitate (plan §4).
        var testimonials = new List<Testimonial>
        {
            new()
            {
                AuthorName = "A.M.",
                AuthorRole = "client, 34 de ani",
                Text = "Am venit după al treilea atac de panică, convinsă că am o problemă cardiacă. Am învățat să recunosc ce se întâmplă în corpul meu și să nu mai intru în panică din cauza panicii. După patru luni, atacurile au dispărut aproape complet.",
                Rating = 5,
                IsApproved = true,
                DisplayOrder = 1,
            },
            new()
            {
                AuthorName = "D.R.",
                AuthorRole = "client, 41 de ani",
                Text = "Ne certam de doi ani despre aceleași lucruri. În terapia de cuplu am înțeles că problema nu era subiectul, ci felul în care ne vorbeam. Nu a fost ușor, dar acum reușim să discutăm fără să ne rănim.",
                Rating = 5,
                IsApproved = true,
                DisplayOrder = 2,
            },
            new()
            {
                AuthorName = "C.P.",
                AuthorRole = "mamă, 38 de ani",
                Text = "Fiul meu refuza să meargă la școală și nu îmi spunea de ce. Am apreciat răbdarea cu care a fost lăsat să se deschidă în ritmul lui și faptul că am primit, ca părinți, indicații clare pentru ce puteam face acasă.",
                Rating = 5,
                IsApproved = true,
                DisplayOrder = 3,
            },
            new()
            {
                AuthorName = "I.S.",
                AuthorRole = "client, 29 de ani",
                Text = "Lucrez în IT și ajunsesem la epuizare totală. Ședințele online au fost singura variantă care s-a potrivit cu programul meu. Am plecat de aici cu limite mai clare și cu senzația că îmi trăiesc din nou viața.",
                Rating = 5,
                IsApproved = true,
                DisplayOrder = 4,
            },
        };

        _db.Testimonials.AddRange(testimonials);
        await _db.SaveChangesAsync(cancellationToken);

        return testimonials.Count;
    }

    // ---- Articole -----------------------------------------------------------

    private async Task<int> SeedArticlesAsync(CancellationToken cancellationToken)
    {
        if (await _db.Articles.AnyAsync(cancellationToken))
            return 0;

        var categoryIdsBySlug = await _db.Categories
            .AsNoTracking()
            .ToDictionaryAsync(c => c.Slug, c => c.Id, cancellationToken);

        var articles = new List<Article>
        {
            new()
            {
                Title = "Atacurile de panică: ce se întâmplă în corpul tău și cum poți interveni",
                Excerpt = "Un atac de panică nu este un semn de slăbiciune și nici un infarct, deși seamănă înșelător de bine cu unul. Îți explic ce se întâmplă fiziologic în acele minute și ce poți face concret, atât în timpul crizei, cât și între episoade.",
                CategoryId = CategoryIdOrNull(categoryIdsBySlug, CategoryAnxietate),
                MetaTitle = "Atacurile de panică: cauze, simptome și ce poți face",
                MetaDescription = "Ce se întâmplă în corp în timpul unui atac de panică, cum îl recunoști, ce ajută în acele minute și când merită să ceri ajutorul unui psiholog.",
                PublishedAt = DateTime.UtcNow.AddDays(-9),
                ContentHtml =
                    """
                    <p>Aproape toți oamenii care ajung în cabinet după primul atac de panică spun aceeași propoziție: „am crezut că mor”. Bătăi puternice ale inimii, senzația că nu mai intră aer, amorțeli, transpirație, o teamă imensă și difuză. Mulți ajung întâi la urgențe, fac electrocardiogramă și analize, și primesc un verdict care în loc să liniștească, nedumerește: „nu aveți nimic”. Vestea bună este că explicația există și este mult mai simplă decât pare.</p>

                    <h2>Ce se întâmplă, de fapt, în corpul tău</h2>
                    <p>Un atac de panică este o reacție de alarmă declanșată greșit. Sistemul nervos interpretează un semnal — o senzație corporală, un gând, un context aglomerat — ca pe un pericol real și pornește răspunsul „luptă sau fugi”. Se eliberează adrenalină, inima bate mai repede pentru a trimite sânge în mușchi, respirația se accelerează, pupilele se dilată, digestia se oprește. Toate aceste modificări sunt utile dacă ar trebui să fugi de un pericol. Problema este că nu există niciun pericol de care să fugi, așa că energia mobilizată rămâne în corp și se traduce în senzații intense.</p>
                    <p>Respirația accelerată joacă un rol special. Când respiri prea repede, elimini prea mult dioxid de carbon, iar acest dezechilibru produce exact simptomele care sperie cel mai mult: amețeală, furnicături în mâini și în jurul gurii, senzația de irealitate, presiune în piept. Corpul nu este în pericol, dar chimia sângelui s-a schimbat pentru câteva minute.</p>

                    <h2>Cum recunoști un atac de panică</h2>
                    <p>Un atac de panică urcă rapid, atinge intensitatea maximă în aproximativ zece minute și apoi scade, chiar dacă nu faci nimic. Adrenalina se metabolizează, iar corpul nu poate menține acest nivel de activare la nesfârșit. Semnele tipice sunt:</p>
                    <ul>
                      <li>palpitații sau bătăi neregulate ale inimii;</li>
                      <li>senzația că nu poți respira suficient de adânc;</li>
                      <li>transpirație, tremur, valuri de căldură sau frig;</li>
                      <li>amețeală, senzația că leșini sau că nu ești în propriul corp;</li>
                      <li>frica de a-ți pierde controlul, de a înnebuni sau de a muri.</li>
                    </ul>
                    <p>Ce transformă un episod izolat într-o tulburare de panică nu este atacul în sine, ci frica de următorul. Începi să eviți metroul, sala de sport, cafeaua, drumurile lungi. Fiecare evitare confirmă ideea că situația era periculoasă, iar spațiul în care te simți în siguranță se micșorează treptat.</p>

                    <h2>Trei lucruri care ajută în acele minute</h2>
                    <p>În primul rând, prelungește expirul. Nu inspira adânc — asta agravează hiperventilația. Expiră lent, pe gură, timp de șase secunde, apoi inspiră pe nas timp de patru. Repetă un minut. În al doilea rând, ancorează-te în prezent: numește cu voce tare cinci obiecte pe care le vezi, patru sunete pe care le auzi, trei senzații pe piele. În al treilea rând, nu fugi din situație. Dacă rămâi, corpul învață că locul acela nu era periculos.</p>
                    <blockquote>Atacul de panică nu este dovada că ceva este în neregulă cu tine. Este dovada că sistemul tău de alarmă funcționează — doar că s-a pornit la momentul nepotrivit.</blockquote>
                    <p>Între episoade, ceea ce contează cel mai mult este somnul regulat, mișcarea fizică zilnică și reducerea cofeinei. Nu pentru că acestea ar vindeca panica, ci pentru că scad nivelul general de activare al sistemului nervos și fac declanșarea mai puțin probabilă.</p>

                    <h2>Când merită să ceri ajutor specializat</h2>
                    <p>Dacă atacurile se repetă, dacă începi să eviți locuri sau activități, dacă îți verifici constant pulsul sau dacă trăiești cu teama permanentă a următorului episod, un proces terapeutic scurtează semnificativ drumul. Terapia cognitiv-comportamentală are rezultate foarte bune în panică: lucrăm pe interpretările catastrofice ale senzațiilor corporale și, treptat, pe expunerea graduală la situațiile evitate.</p>
                    <p>Înainte de a începe, este util un consult medical care să excludă cauzele fizice — probleme tiroidiene, anemie, aritmii. Odată clarificat acest aspect, putem lucra liniștiți pe mecanismul psihologic. Majoritatea oamenilor cu care lucrez observă o scădere clară a frecvenței atacurilor în primele două luni, iar cei mai mulți ajung să nu mai organizeze viața în funcție de ele.</p>
                    """,
            },
            new()
            {
                Title = "Semnele depresiei pe care le trecem cu vederea",
                Excerpt = "Depresia nu arată întotdeauna ca tristețea din filme. De multe ori se ascunde în iritabilitate, oboseală care nu trece și în senzația că totul necesită un efort uriaș. Iată semnele pe care merită să le iei în serios.",
                CategoryId = CategoryIdOrNull(categoryIdsBySlug, CategoryAnxietate),
                MetaTitle = "Semnele depresiei: ce să observi și când să ceri ajutor",
                MetaDescription = "Cum se manifestă depresia dincolo de tristețe: oboseală, iritabilitate, pierderea plăcerii, probleme de somn. Ce ajută și când e nevoie de specialist.",
                PublishedAt = DateTime.UtcNow.AddDays(-24),
                ContentHtml =
                    """
                    <p>Mulți oameni ajung la psiholog spunând „nu sunt trist, doar nu mai am chef de nimic”. Imaginea populară a depresiei — cineva care plânge în întuneric — acoperă doar o parte din realitate. La fel de des, depresia arată ca o oboseală care nu trece după somn, ca o iritabilitate nouă față de cei apropiați sau ca senzația că orice sarcină banală cere un efort disproporționat.</p>

                    <h2>Cele două simptome centrale</h2>
                    <p>Din punct de vedere clinic, două elemente stau la baza unui episod depresiv: dispoziția scăzută cea mai mare parte a zilei, aproape în fiecare zi, și pierderea interesului sau a plăcerii în activități care înainte contau. Al doilea, numit anhedonie, este cel mai des trecut cu vederea. Nu doare, nu se vede din exterior, dar golește viața de conținut. Muzica nu mai emoționează, mâncarea nu mai are gust, întâlnirile cu prietenii devin o obligație.</p>
                    <p>Pentru un diagnostic, aceste simptome trebuie să dureze cel puțin două săptămâni și să afecteze funcționarea zilnică. O zi proastă nu este depresie, iar tristețea după o pierdere este o reacție firească, nu o boală.</p>

                    <h2>Semnele mai puțin evidente</h2>
                    <p>Iată manifestările pe care oamenii le atribuie de obicei altor cauze — stres, vârstă, un job solicitant:</p>
                    <ul>
                      <li>trezirea cu două-trei ore mai devreme decât de obicei, fără să mai poți adormi;</li>
                      <li>oboseală prezentă de dimineață, care nu se ameliorează după odihnă;</li>
                      <li>dificultăți de concentrare: citești o pagină de trei ori și nu rămâne nimic;</li>
                      <li>iritabilitate și izbucniri de furie disproporționate, mai frecvente la bărbați și la adolescenți;</li>
                      <li>dureri difuze — de cap, de spate, de stomac — fără o cauză medicală identificată;</li>
                      <li>schimbări în apetit și în greutate, în oricare direcție;</li>
                      <li>autocritică severă: convingerea că ești o povară sau că nu meriți efortul altora.</li>
                    </ul>
                    <p>Un semn discret, dar important, este încetinirea deciziilor mărunte. Ce să gătești, ce să te îmbraci, la ce mesaj să răspunzi mai întâi — alegeri care înainte se făceau automat devin epuizante. Nu este lene și nu este lipsă de voință: este o consecință a modului în care depresia afectează energia și motivația.</p>

                    <h2>De ce așteptăm atât de mult</h2>
                    <p>Cel mai frecvent motiv al amânării este comparația. „Alții au probleme reale”, „nu am de ce să mă plâng”, „nu e chiar atât de rău”. Depresia are însă un efect perfid: îți distorsionează exact judecata cu care ai evalua nevoia de ajutor. Un al doilea motiv este teama de etichetă, iar un al treilea, convingerea că trebuie să te descurci singur.</p>
                    <blockquote>Nu ai nevoie de o justificare suficient de dramatică pentru a cere ajutor. Faptul că viața ta a devenit mai grea decât ar trebui să fie este un motiv întemeiat.</blockquote>

                    <h2>Ce ajută și ce nu</h2>
                    <p>Ce ajută, susținut de cercetare: activarea comportamentală, adică reintroducerea graduală a activităților care aduceau satisfacție, chiar dacă la început nu ai chef; mișcarea fizică regulată, la nivelul unei plimbări de treizeci de minute; un ritm stabil de somn; contactul social minim, chiar și când tentația e să anulezi totul; psihoterapia, iar în formele moderate și severe, tratamentul medicamentos prescris de un medic psihiatru.</p>
                    <p>Ce nu ajută: să aștepți să apară motivația înainte de a acționa — în depresie ordinea se inversează, acțiunea vine prima și motivația urmează. Nici izolarea, nici alcoolul, nici „gândirea pozitivă” forțată nu rezolvă nimic.</p>
                    <p>Dacă te regăsești în cele descrise aici de mai bine de două săptămâni, o primă discuție cu un psiholog te ajută să vezi clar unde te afli. Iar dacă ai gânduri legate de a-ți face rău, nu aștepta o programare: sună la 112 sau la o linie de sprijin în aceeași zi. Aceste gânduri sunt un simptom care se tratează, nu o concluzie despre viața ta.</p>
                    """,
            },
            new()
            {
                Title = "Comunicarea în cuplu: cum să vorbiți despre ce doare, fără să vă răniți",
                Excerpt = "Majoritatea cuplurilor nu se ceartă din cauza subiectelor, ci din cauza felului în care le abordează. Patru schimbări concrete în modul de a începe și de a repara o conversație dificilă.",
                CategoryId = CategoryIdOrNull(categoryIdsBySlug, CategoryRelatii),
                MetaTitle = "Comunicarea în cuplu: 4 schimbări care reduc conflictele",
                MetaDescription = "Cum să începi o discuție dificilă cu partenerul, ce să faci când tensiunea urcă și cum se repară o ceartă. Sfaturi practice din terapia de cuplu.",
                PublishedAt = DateTime.UtcNow.AddDays(-38),
                ContentHtml =
                    """
                    <p>Când un cuplu ajunge în cabinet, primul lucru pe care îl cer este să îmi povestească ultima ceartă, în detaliu. Aproape întotdeauna reiese că subiectul — vasele, banii, timpul petrecut cu familia extinsă — era doar declanșatorul. Ceea ce a produs rana a fost felul în care a început discuția și ce a urmat în primele două minute.</p>

                    <h2>Primele trei propoziții decid tot</h2>
                    <p>Cercetarea pe cupluri arată că deznodământul unei conversații dificile poate fi prezis din felul în care este deschisă. Un început critic — „iar ai uitat”, „tu niciodată nu” — activează imediat apărarea celuilalt, iar de acolo conversația nu mai este despre problemă, ci despre vinovăție. Un început descriptiv păstrează șansa unei rezolvări.</p>
                    <p>Diferența practică este mică, dar decisivă. În loc de „ești complet indiferent față de casa asta”, încearcă: „aseară am rămas singură cu toată bucătăria și m-am simțit epuizată; am nevoie să împărțim mai clar treburile”. Ai spus același lucru, dar ai vorbit despre tine și despre o nevoie, nu despre defectele partenerului.</p>

                    <h2>Ce se întâmplă când tensiunea urcă</h2>
                    <p>Peste un anumit prag de activare fiziologică — puls peste aproximativ o sută de bătăi pe minut — capacitatea de a asculta și de a raționa scade dramatic. Corpul intră în modul de apărare. În acel moment, oricât de bune ar fi intențiile, conversația nu mai poate produce nimic constructiv. Singura soluție reală este pauza.</p>
                    <p>O pauză utilă are trei condiții: se anunță („am nevoie de douăzeci de minute, nu plec, mă întorc”), durează cel puțin douăzeci de minute și nu se petrece repetând mental argumentele. Plimbare, duș, o sarcină banală — orice care lasă corpul să se liniștească.</p>
                    <blockquote>Nu poți rezolva o problemă de cuplu în timp ce corpul tău crede că este atacat. Pauza nu este fugă, este condiția unei discuții reale.</blockquote>

                    <h2>Patru schimbări care se pot exersa de mâine</h2>
                    <ul>
                      <li><strong>Începe cu tine, nu cu celălalt.</strong> Descrie situația, spune ce ai simțit, formulează o cerere concretă. Trei propoziții, fără istoric și fără „mereu”.</li>
                      <li><strong>Repetă înainte de a răspunde.</strong> „Deci ai simțit că te-am lăsat singură cu decizia?” Verificarea înțelegerii scade tensiunea mai mult decât orice argument.</li>
                      <li><strong>Cere pauză când ești copleșit.</strong> Cu un termen clar de revenire, altfel pauza devine abandon.</li>
                      <li><strong>Repară după ceartă.</strong> Nu ignora incidentul. O frază de tipul „am reacționat urât ieri, îmi pare rău, hai să reluăm” face mai mult decât o săptămână de tăcere politicoasă.</li>
                    </ul>
                    <p>Un al cincilea element, mai puțin spectaculos, cântărește enorm: raportul dintre momentele plăcute și cele tensionate. Cuplurile care rezistă nu sunt cele care nu se ceartă, ci cele care acumulează suficientă bunăvoință între certuri — o glumă, o atingere, un mulțumesc, cinci minute de atenție reală la sfârșitul zilei.</p>

                    <h2>Când terapia de cuplu face diferența</h2>
                    <p>Există tipare pe care un cuplu nu le poate vedea din interior: unul care cere apropiere insistent și celălalt care se retrage, iar fiecare comportament îl întreține pe celălalt. În ședință devin vizibile în câteva minute, pentru că am o poziție din care le pot numi fără să acuz pe nimeni.</p>
                    <p>Merită să veniți dacă vă certați despre același lucru de mai bine de câteva luni, dacă tăcerea a devenit mai lungă decât conversația, dacă a existat o ruptură de încredere sau dacă vreți să decideți asumat, nu prin epuizare, dacă mergeți mai departe împreună. Terapia de cuplu nu garantează că rămâneți împreună — garantează că decizia va fi luată în cunoștință de cauză, nu în mijlocul unei certe.</p>
                    """,
            },
            new()
            {
                Title = "Anxietatea la copii: cum o recunoști și cum îl poți sprijini",
                Excerpt = "Copiii anxioși rareori spun „mi-e frică”. Vorbesc, în schimb, despre dureri de burtă dimineața, refuză școala sau se agață de părinte. Ce este util să faci și ce, deși pare firesc, întreține problema.",
                CategoryId = CategoryIdOrNull(categoryIdsBySlug, CategoryCopii),
                MetaTitle = "Anxietatea la copii: semne, greșeli frecvente și sprijin",
                MetaDescription = "Cum se manifestă anxietatea la copii, de ce liniștirea excesivă nu ajută și ce pot face părinții concret. Când este nevoie de un psiholog pentru copii.",
                PublishedAt = DateTime.UtcNow.AddDays(-55),
                ContentHtml =
                    """
                    <p>„Nu mă simt bine, mă doare burtica, pot să nu merg azi la școală?” Dacă auzi această propoziție de mai multe dimineți la rând, iar durerea dispare miraculos la ora zece, este foarte probabil că nu ai de-a face cu o problemă digestivă, ci cu anxietate. Copiii nu au încă vocabularul emoțional al adulților; ei își exprimă frica prin corp și prin comportament.</p>

                    <h2>Cum arată anxietatea la vârste mici</h2>
                    <p>Un anumit nivel de frică este normal și chiar util la fiecare etapă de dezvoltare: teama de străini la un an, de întuneric și de monștri la patru-cinci ani, de eșec și de respingere socială la adolescență. Devine o problemă atunci când este disproporționată față de situație, când durează săptămâni și, mai ales, când limitează viața copilului — nu mai merge la petreceri, nu mai doarme singur, nu mai răspunde la clasă.</p>
                    <p>Semnele care merită atenție:</p>
                    <ul>
                      <li>dureri de cap sau de burtă recurente, mai ales dimineața și în zilele de școală;</li>
                      <li>dificultăți de adormire, coșmaruri, revenirea în patul părinților;</li>
                      <li>întrebări repetate de tipul „ești sigur că vii să mă iei?”, „dacă se întâmplă ceva?”;</li>
                      <li>refuzul unor activități pe care înainte le plăcea;</li>
                      <li>iritabilitate, plâns ușor, izbucniri de furie la solicitări mărunte;</li>
                      <li>perfecționism: ștergerea repetată a temei, refuzul de a începe ceva ce nu poate face perfect;</li>
                      <li>regresii — vorbire de bebeluș, enurezis, agățare de părinte — după o schimbare importantă.</li>
                    </ul>

                    <h2>Capcana liniștirii excesive</h2>
                    <p>Reacția firească a oricărui părinte este să liniștească: „nu se întâmplă nimic”, „nu ai de ce să te temi”, iar dacă plânsul continuă, să scutească copilul de situația care îl sperie. Pe termen scurt funcționează impecabil — copilul se calmează imediat. Pe termen lung, întărește exact convingerea de care vrem să scăpăm: că situația era într-adevăr periculoasă și că el nu ar fi făcut față singur.</p>
                    <p>Același mecanism apare la răspunsurile repetate. Când un copil întreabă a zecea oară dacă vei veni să îl iei, a zecea confirmare nu îl liniștește mai mult decât prima; doar hrănește nevoia de reasigurare. Alternativa nu este să îl ignori, ci să numești ce se întâmplă: „Ai întrebat deja și ți-am răspuns. Observ că îngrijorarea vrea să mai întrebi. Ce ai putea să îți spui tu singur acum?”</p>
                    <blockquote>Scopul nu este ca copilul să nu mai simtă frică, ci să descopere că poate face un lucru important și în timp ce îi este frică.</blockquote>

                    <h2>Ce ajută concret</h2>
                    <p>Validează emoția, dar exprimă încredere în capacitatea lui: „Înțeleg că ți-e greu să intri singur în clasă. E firesc să fie greu prima dată. Și cred că poți.” Formula are două părți și amândouă contează — recunoașterea trăirii și încrederea explicită.</p>
                    <p>Împarte situația temută în pași mici și urcă treptat. Dacă îi e frică să doarmă singur, nu treci direct la o noapte întreagă: începe cu adormirea în camera lui, cu tine pe un scaun lângă pat, apoi lângă ușă, apoi pe hol. Fiecare pas se repetă până devine plictisitor, apoi se avansează. Lăudați efortul, nu rezultatul.</p>
                    <p>Menține rutina, mai ales somnul, și redu expunerea la știri anxiogene. Verifică-ți și propria reacție: copiii citesc tensiunea din vocea și din corpul părintelui mai repede decât conținutul cuvintelor. Un părinte care își reglează propria îngrijorare oferă cea mai bună lecție de gestionare a fricii.</p>

                    <h2>Când să ceri ajutorul unui specialist</h2>
                    <p>Programează o consultație dacă frica durează de peste o lună și nu scade, dacă apare refuzul școlar, dacă somnul sau apetitul sunt afectate constant, dacă copilul evită tot mai multe situații sau dacă spune despre sine lucruri dure, de tipul „sunt un prost”. Anxietatea copilului răspunde foarte bine la intervenție timpurie, iar părinții sunt parte din proces: primesc instrumente pe care le folosesc acasă, unde se produce, de fapt, cea mai mare parte a schimbării.</p>
                    """,
            },
        };

        foreach (var article in articles)
        {
            article.Slug = SlugHelper.Generate(article.Title);
            article.Status = ArticleStatus.Published;
            article.ReadingMinutes = ReadingTimeHelper.Calculate(article.ContentHtml);
            // Clientul nu are încă fotografii proprii; coperțile se adaugă din management.
            article.CoverImageUrl = null;
            article.CoverImageAlt = null;
            article.CreatedAt = article.PublishedAt ?? DateTime.UtcNow;
        }

        _db.Articles.AddRange(articles);
        await _db.SaveChangesAsync(cancellationToken);

        return articles.Count;
    }

    private static int? CategoryIdOrNull(IReadOnlyDictionary<string, int> categoryIdsBySlug, string categoryName) =>
        categoryIdsBySlug.TryGetValue(SlugHelper.Generate(categoryName), out var id) ? id : null;
}
