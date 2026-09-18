using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Infrastructure.Email.Templates;
using PsihoAdinaGghita.Infrastructure.Options;

namespace PsihoAdinaGghita.Infrastructure.Email;

public class MailKitEmailSender : IEmailSender
{
    private readonly SmtpOptions _options;
    private readonly ILogger<MailKitEmailSender> _logger;

    public MailKitEmailSender(IOptions<SmtpOptions> options, ILogger<MailKitEmailSender> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task<bool> SendAsync(
        string subject,
        string htmlBody,
        string? replyTo = null,
        CancellationToken cancellationToken = default)
    {
        // Dev fără SMTP: logăm doar subiectul, niciodată conținutul (date personale, plan §10).
        if (!_options.Enabled
            || string.IsNullOrWhiteSpace(_options.Host)
            || string.IsNullOrWhiteSpace(_options.ToAddress))
        {
            _logger.LogInformation(
                "SMTP dezactivat sau neconfigurat — emailul nu a fost trimis. Subiect: {Subject}",
                subject);
            return true;
        }

        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_options.FromName, _options.FromAddress));
            message.To.Add(MailboxAddress.Parse(_options.ToAddress));
            message.Subject = subject;

            // Adresa vine din formular; dacă e invalidă o ignorăm în loc să pierdem notificarea.
            if (!string.IsNullOrWhiteSpace(replyTo)
                && MailboxAddress.TryParse(replyTo, out var replyToAddress)
                && replyToAddress is not null)
            {
                message.ReplyTo.Add(replyToAddress);
            }

            var builder = new BodyBuilder
            {
                HtmlBody = EmailLayout.Wrap(subject, htmlBody)
            };
            message.Body = builder.ToMessageBody();

            using var client = new SmtpClient();
            try
            {
                var secureSocketOptions = _options.UseStartTls
                    ? SecureSocketOptions.StartTls
                    : SecureSocketOptions.Auto;

                await client.ConnectAsync(_options.Host, _options.Port, secureSocketOptions, cancellationToken);

                if (!string.IsNullOrWhiteSpace(_options.Username))
                {
                    await client.AuthenticateAsync(_options.Username, _options.Password, cancellationToken);
                }

                await client.SendAsync(message, cancellationToken);
            }
            finally
            {
                if (client.IsConnected)
                {
                    await client.DisconnectAsync(true, CancellationToken.None);
                }
            }

            _logger.LogInformation("Email trimis. Subiect: {Subject}", subject);
            return true;
        }
        catch (Exception ex)
        {
            // Nu aruncăm: cererea salvată în DB nu trebuie pierdută din cauza SMTP (plan §4).
            _logger.LogError(ex, "Trimiterea emailului a eșuat. Subiect: {Subject}", subject);
            return false;
        }
    }
}
