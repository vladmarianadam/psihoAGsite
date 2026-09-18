namespace PsihoAdinaGghita.Application.Common.Interfaces;

/// <summary>
/// Sanitizare HTML pe server la salvare (whitelist de tag-uri) — nu ne bazăm
/// doar pe DOMPurify în client (plan §7).
/// </summary>
public interface IHtmlSanitizer
{
    string Sanitize(string? html);
}
