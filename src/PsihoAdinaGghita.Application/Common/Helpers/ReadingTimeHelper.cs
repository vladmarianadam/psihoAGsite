using System.Text.RegularExpressions;

namespace PsihoAdinaGghita.Application.Common.Helpers;

public static class ReadingTimeHelper
{
    private const int WordsPerMinute = 200;

    /// <summary>Minute de citire estimate din HTML-ul articolului (minim 1).</summary>
    public static int Calculate(string? html)
    {
        if (string.IsNullOrWhiteSpace(html))
            return 1;

        var text = Regex.Replace(html, "<[^>]+>", " ");
        text = Regex.Replace(text, "&[a-zA-Z]+;|&#\\d+;", " ");
        var words = text.Split(new[] { ' ', '\t', '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries).Length;

        return Math.Max(1, (int)Math.Ceiling(words / (double)WordsPerMinute));
    }
}
