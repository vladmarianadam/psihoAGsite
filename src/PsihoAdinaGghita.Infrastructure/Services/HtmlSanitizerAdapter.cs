using AngleSharp.Css.Dom;
using AngleSharp.Dom;
using Ganss.Xss;

// Ganss.Xss expune și el o interfață IHtmlSanitizer — alias ca să nu fie ambiguitate.
using IAppHtmlSanitizer = PsihoAdinaGghita.Application.Common.Interfaces.IHtmlSanitizer;

namespace PsihoAdinaGghita.Infrastructure.Services;

/// <summary>
/// Sanitizare HTML pe server, cu whitelist strictă potrivită output-ului editorului TipTap (plan §7).
/// Instanța de <see cref="HtmlSanitizer"/> se creează o singură dată (serviciul e înregistrat Singleton).
/// </summary>
public class HtmlSanitizerAdapter : IAppHtmlSanitizer
{
    private static readonly string[] AllowedTags =
    {
        "p", "br", "strong", "b", "em", "i", "u", "s",
        "h2", "h3", "h4",
        "ul", "ol", "li",
        "blockquote", "a", "img", "figure", "figcaption", "hr",
        "code", "pre", "span",
        "table", "thead", "tbody", "tr", "th", "td",
    };

    private static readonly string[] AllowedAttributes =
    {
        "href", "title", "target", "rel",   // a
        "src", "alt", "width", "height", "loading",   // img
        "colspan", "rowspan",   // th / td
        "class",
        "style",   // filtrat mai jos: doar text-align
    };

    /// <summary>Fără <c>data:</c> — imaginile vin din /uploads, nu inline (plan §7).</summary>
    private static readonly string[] AllowedSchemes = { "http", "https", "mailto", "tel" };

    private static readonly string[] AllowedCssProperties = { "text-align" };

    private static readonly string[] UriAttributes = { "href", "src" };

    private readonly HtmlSanitizer _sanitizer;

    public HtmlSanitizerAdapter()
    {
        _sanitizer = new HtmlSanitizer(new HtmlSanitizerOptions
        {
            AllowedTags = NewSet(AllowedTags),
            AllowedAttributes = NewSet(AllowedAttributes),
            AllowedCssProperties = NewSet(AllowedCssProperties),
            AllowedSchemes = NewSet(AllowedSchemes),
            // Set gol = fără filtrare pe nume de clase (atributul class rămâne permis ca întreg).
            AllowedCssClasses = NewSet(Array.Empty<string>()),
            AllowedAtRules = new HashSet<CssRuleType>(),
            UriAttributes = NewSet(UriAttributes),
            AllowDataAttributes = false,
            AllowCssCustomProperties = false,
        });

        // Tagurile nepermise se elimină împreună cu conținutul lor (ex. <script>).
        _sanitizer.KeepChildNodes = false;
        _sanitizer.PostProcessNode += OnPostProcessNode;

        // URL-urile relative (/uploads/...) trec neatinse: Sanitize e apelat fără baseUrl.
    }

    public string Sanitize(string? html)
        => string.IsNullOrWhiteSpace(html) ? string.Empty : _sanitizer.Sanitize(html);

    /// <summary>Linkurile care se deschid în tab nou primesc obligatoriu rel="noopener noreferrer".</summary>
    private static void OnPostProcessNode(object? sender, PostProcessNodeEventArgs e)
    {
        if (e.Node is not IElement element) return;
        if (!element.NodeName.Equals("A", StringComparison.OrdinalIgnoreCase)) return;

        var target = element.GetAttribute("target");
        if (string.Equals(target, "_blank", StringComparison.OrdinalIgnoreCase))
            element.SetAttribute("rel", "noopener noreferrer");
    }

    private static ISet<string> NewSet(IEnumerable<string> values)
        => new HashSet<string>(values, StringComparer.OrdinalIgnoreCase);
}
