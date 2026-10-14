using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PsihoAdinaGghita.Application.Common.Models;
using PsihoAdinaGghita.Application.Features.Appointments.Commands;
using PsihoAdinaGghita.Application.Features.Appointments.Dtos;
using PsihoAdinaGghita.Application.Features.Appointments.Queries;
using PsihoAdinaGghita.Application.Features.Contact.Commands;
using PsihoAdinaGghita.Application.Features.Contact.Dtos;
using PsihoAdinaGghita.Application.Features.Contact.Queries;

namespace PsihoAdinaGghita.Api.Controllers;

/// <summary>Gestionarea cererilor de programare și a mesajelor de contact din panou (plan §5).</summary>
[ApiController]
[Authorize]
[Route("api/admin")]
public class AdminAppointmentsController : ControllerBase
{
    private readonly ISender _sender;

    public AdminAppointmentsController(ISender sender) => _sender = sender;

    [HttpGet("appointments")]
    [ProducesResponseType(typeof(PagedResult<AppointmentRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PagedResult<AppointmentRequestDto>>> GetAppointments(
        [FromQuery] GetAppointmentRequestsQuery query,
        CancellationToken cancellationToken)
        => Ok(await _sender.Send(query, cancellationToken));

    [HttpPut("appointments/{id:int}/handled")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkAppointmentHandled(
        int id,
        [FromBody] MarkAppointmentHandledCommand command,
        CancellationToken cancellationToken)
    {
        await _sender.Send(command with { Id = id }, cancellationToken);
        return NoContent();
    }

    /// <summary>Pending → Confirmed: eveniment în Google Calendar + email cu invite.ics clientului.</summary>
    [HttpPut("appointments/{id:int}/confirm")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ConfirmAppointment(int id, CancellationToken cancellationToken)
    {
        await _sender.Send(new ConfirmAppointmentCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpPut("appointments/{id:int}/reject")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> RejectAppointment(
        int id,
        [FromBody] RejectAppointmentCommand command,
        CancellationToken cancellationToken)
    {
        await _sender.Send(command with { Id = id }, cancellationToken);
        return NoContent();
    }

    [HttpPut("appointments/{id:int}/cancel")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CancelAppointment(
        int id,
        [FromBody] CancelAppointmentCommand command,
        CancellationToken cancellationToken)
    {
        await _sender.Send(command with { Id = id }, cancellationToken);
        return NoContent();
    }

    [HttpPost("appointments/{id:int}/resync")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ResyncAppointment(int id, CancellationToken cancellationToken)
    {
        await _sender.Send(new ResyncAppointmentCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpDelete("appointments/{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAppointment(int id, CancellationToken cancellationToken)
    {
        await _sender.Send(new DeleteAppointmentRequestCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpGet("contact-messages")]
    [ProducesResponseType(typeof(PagedResult<ContactMessageDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PagedResult<ContactMessageDto>>> GetContactMessages(
        [FromQuery] GetContactMessagesQuery query,
        CancellationToken cancellationToken)
        => Ok(await _sender.Send(query, cancellationToken));

    [HttpPut("contact-messages/{id:int}/handled")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkContactMessageHandled(
        int id,
        [FromBody] MarkContactMessageHandledCommand command,
        CancellationToken cancellationToken)
    {
        await _sender.Send(command with { Id = id }, cancellationToken);
        return NoContent();
    }

    [HttpDelete("contact-messages/{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteContactMessage(int id, CancellationToken cancellationToken)
    {
        await _sender.Send(new DeleteContactMessageCommand(id), cancellationToken);
        return NoContent();
    }
}
