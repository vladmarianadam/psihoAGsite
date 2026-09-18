using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PsihoAdinaGghita.Application.Features.Appointments.Commands;

namespace PsihoAdinaGghita.Api.Controllers;

[ApiController]
[Route("api/appointments")]
[AllowAnonymous]
public class AppointmentsController : ControllerBase
{
    private readonly ISender _sender;

    public AppointmentsController(ISender sender) => _sender = sender;

    /// <summary>
    /// Trimite o cerere de programare. Cererile filtrate de honeypot primesc tot un
    /// răspuns de succes, cu id = 0, ca botul să nu afle că a fost respins (plan §4).
    /// </summary>
    [HttpPost("")]
    [EnableRateLimiting("public-forms")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Create(
        [FromBody] CreateAppointmentRequestCommand command,
        CancellationToken cancellationToken)
    {
        var id = await _sender.Send(command, cancellationToken);

        return id > 0
            ? StatusCode(StatusCodes.Status201Created, new { id })
            : Ok(new { id });
    }
}
