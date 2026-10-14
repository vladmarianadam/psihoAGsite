using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PsihoAdinaGghita.Application.Features.Booking.Commands;
using PsihoAdinaGghita.Application.Features.Booking.Dtos;
using PsihoAdinaGghita.Application.Features.Booking.Queries;

namespace PsihoAdinaGghita.Api.Controllers;

/// <summary>Programarea online din /programare: sloturile libere și rezervarea unui slot.</summary>
[ApiController]
[Route("api/booking")]
[AllowAnonymous]
public class BookingController : ControllerBase
{
    private readonly ISender _sender;

    public BookingController(ISender sender) => _sender = sender;

    [HttpGet("slots")]
    [EnableRateLimiting("booking-read")]
    [ProducesResponseType(typeof(BookingSlotsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<BookingSlotsDto>> GetSlots(
        [FromQuery] GetAvailableSlotsQuery query,
        CancellationToken cancellationToken)
        => Ok(await _sender.Send(query, cancellationToken));

    /// <summary>
    /// Creează o programare Pending. Cererile filtrate de honeypot primesc 200 cu id = 0,
    /// ca botul să nu afle că a fost respins. 409 = slotul nu mai e liber.
    /// </summary>
    [HttpPost("")]
    [EnableRateLimiting("public-forms")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Create(
        [FromBody] CreateBookingCommand command,
        CancellationToken cancellationToken)
    {
        var id = await _sender.Send(command, cancellationToken);

        return id > 0
            ? StatusCode(StatusCodes.Status201Created, new { id })
            : Ok(new { id });
    }
}
