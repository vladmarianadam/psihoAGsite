using System.Net;

namespace PsihoAdinaGghita.Infrastructure.Email.Templates;

/// <summary>
/// Layout HTML comun pentru emailurile de notificare. Paleta din plan §6:
/// fundal #FAF8F5, accent principal #4A6D7C, text #2C3639, accent secundar #C9A882.
/// </summary>
public static class EmailLayout
{
    private const string Background = "#FAF8F5";
    private const string Primary = "#4A6D7C";
    private const string Secondary = "#C9A882";
    private const string Text = "#2C3639";
    private const string Surface = "#FFFFFF";
    private const string Muted = "#7A8688";
    private const string FontStack =
        "Georgia, 'Times New Roman', 'Segoe UI', Arial, Helvetica, sans-serif";

    /// <summary>
    /// Îmbracă <paramref name="innerHtml"/> într-un layout de email compatibil cu clienții de mail:
    /// tabele, stiluri inline, lățime maximă 600px (fără CSS extern, fără flex/grid).
    /// </summary>
    public static string Wrap(string title, string innerHtml)
    {
        var safeTitle = WebUtility.HtmlEncode(title ?? string.Empty);
        var body = innerHtml ?? string.Empty;

        return $"""
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml" lang="ro">
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>{safeTitle}</title>
        </head>
        <body style="margin:0; padding:0; background-color:{Background}; color:{Text}; font-family:{FontStack}; font-size:16px; line-height:1.6; -webkit-text-size-adjust:100%;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:{Background}; margin:0; padding:0;">
                <tr>
                    <td align="center" style="padding:24px 12px;">
                        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px; background-color:{Surface}; border-radius:8px; border-collapse:separate; overflow:hidden;">
                            <tr>
                                <td style="background-color:{Primary}; padding:24px 28px; text-align:left;">
                                    <span style="display:block; color:#FFFFFF; font-family:{FontStack}; font-size:20px; font-weight:bold; letter-spacing:0.4px;">Cabinet Psihologic Adina Gghita</span>
                                    <span style="display:block; margin-top:6px; color:{Secondary}; font-family:{FontStack}; font-size:13px; letter-spacing:1.2px; text-transform:uppercase;">Notificare de pe site</span>
                                </td>
                            </tr>
                            <tr>
                                <td style="height:4px; background-color:{Secondary}; line-height:4px; font-size:0;">&nbsp;</td>
                            </tr>
                            <tr>
                                <td style="padding:28px;">
                                    <h1 style="margin:0 0 18px 0; color:{Primary}; font-family:{FontStack}; font-size:19px; font-weight:bold; line-height:1.35;">{safeTitle}</h1>
                                    <div style="color:{Text}; font-family:{FontStack}; font-size:16px; line-height:1.6;">
                                        {body}
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style="border-top:1px solid #E7E1D9; padding:18px 28px 24px 28px; text-align:center;">
                                    <span style="display:block; color:{Muted}; font-family:{FontStack}; font-size:12px; line-height:1.5;">Mesaj generat automat de site</span>
                                    <span style="display:block; margin-top:4px; color:{Muted}; font-family:{FontStack}; font-size:12px; line-height:1.5;">Cabinet Psihologic Adina Gghita</span>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """;
    }
}
