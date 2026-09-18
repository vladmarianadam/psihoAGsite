using System.Globalization;
using System.Text;
using System.Xml.Linq;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PsihoAdinaGghita.Application.Features.Seo.Dtos;
using PsihoAdinaGghita.Application.Features.Seo.Queries;

namespace PsihoAdinaGghita.Api.Controllers;

/// <summary>
/// Fișierele SEO servite din rădăcina site-ului (fără prefixul „api”), generate
/// dinamic din conținutul publicat (plan §11).
/// </summary>
[ApiController]
[AllowAnonymous]
[Route("/")]
public class SeoController : ControllerBase
{
    private static readonly XNamespace SitemapNs = "http://www.sitemaps.org/schemas/sitemap/0.9";

    private readonly ISender _sender;
    private readonly IConfiguration _configuration;

    public SeoController(ISender sender, IConfiguration configuration)
    {
        _sender = sender;
        _configuration = configuration;
    }

    [HttpGet("/sitemap.xml")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Sitemap(CancellationToken cancellationToken)
    {
        var entries = await _sender.Send(new GetSitemapEntriesQuery(), cancellationToken);
        var baseUrl = GetPublicUrl();

        var urlset = new XElement(
            SitemapNs + "urlset",
            entries.Select(entry => BuildUrlElement(baseUrl, entry)));

        var document = new XDocument(new XDeclaration("1.0", "utf-8", null), urlset);
        var declaration = document.Declaration?.ToString() ?? "<?xml version=\"1.0\" encoding=\"utf-8\"?>";
        var xml = declaration + Environment.NewLine + document.ToString(SaveOptions.None);

        return Content(xml, "text/xml", Encoding.UTF8);
    }

    [HttpGet("/robots.txt")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult Robots()
    {
        var baseUrl = GetPublicUrl();

        var builder = new StringBuilder();
        builder.AppendLine("User-agent: *");
        builder.AppendLine("Disallow: /management");
        builder.AppendLine("Disallow: /api/");
        builder.AppendLine("Allow: /");
        builder.AppendLine();
        builder.AppendLine($"Sitemap: {baseUrl}/sitemap.xml");

        return Content(builder.ToString(), "text/plain", Encoding.UTF8);
    }

    private static XElement BuildUrlElement(string baseUrl, SitemapEntryDto entry)
    {
        var element = new XElement(SitemapNs + "url",
            new XElement(SitemapNs + "loc", baseUrl + entry.RelativeUrl));

        if (entry.LastModified.HasValue)
        {
            element.Add(new XElement(SitemapNs + "lastmod",
                entry.LastModified.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)));
        }

        element.Add(new XElement(SitemapNs + "changefreq", entry.ChangeFrequency));
        element.Add(new XElement(SitemapNs + "priority",
            entry.Priority.ToString("0.0", CultureInfo.InvariantCulture)));

        return element;
    }

    /// <summary>Baza publică fără slash final, ca să nu se dubleze cu URL-urile relative.</summary>
    private string GetPublicUrl()
    {
        var configured = _configuration["Site:PublicUrl"];
        if (string.IsNullOrWhiteSpace(configured))
            return $"{Request.Scheme}://{Request.Host}";

        return configured.Trim().TrimEnd('/');
    }
}
