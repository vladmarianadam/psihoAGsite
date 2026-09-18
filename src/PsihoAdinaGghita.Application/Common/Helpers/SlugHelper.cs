using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace PsihoAdinaGghita.Application.Common.Helpers;

public static class SlugHelper
{
    /// <summary>
    /// Generează un slug URL-safe din titlu, cu diacriticele românești transliterate
    /// (ă→a, â→a, î→i, ș→s, ț→t).
    /// </summary>
    public static string Generate(string input, int maxLength = 200)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        var normalized = input.Trim().ToLowerInvariant()
            .Replace("ș", "s").Replace("ş", "s")
            .Replace("ț", "t").Replace("ţ", "t")
            .Replace("ă", "a").Replace("â", "a")
            .Replace("î", "i")
            .Replace("&", " si ");

        var decomposed = normalized.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(decomposed.Length);
        foreach (var c in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        }

        var slug = Regex.Replace(sb.ToString().Normalize(NormalizationForm.FormC), @"[^a-z0-9]+", "-");
        slug = slug.Trim('-');

        return slug.Length > maxLength ? slug[..maxLength].TrimEnd('-') : slug;
    }
}
