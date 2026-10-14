using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Common.Models;
using PsihoAdinaGghita.Application.Features.Appointments.Dtos;
using PsihoAdinaGghita.Domain.Enums;

namespace PsihoAdinaGghita.Application.Features.Appointments.Queries;

/// <summary>
/// <paramref name="Status"/> = tabul din panou: Pending, Confirmed (doar viitoare) sau
/// History (respinse, anulate, vechi și confirmate trecute). Null = toate.
/// </summary>
public record GetAppointmentRequestsQuery(int Page = 1, int PageSize = 20, bool? IsHandled = null, string? Status = null)
    : IRequest<PagedResult<AppointmentRequestDto>>;

public class GetAppointmentRequestsQueryValidator : AbstractValidator<GetAppointmentRequestsQuery>
{
    public static readonly string[] Tabs = ["Pending", "Confirmed", "History"];

    public GetAppointmentRequestsQueryValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("Pagina trebuie să fie cel puțin 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 50).WithMessage("Numărul de elemente pe pagină trebuie să fie între 1 și 50.");

        RuleFor(x => x.Status)
            .Must(status => Tabs.Contains(status, StringComparer.OrdinalIgnoreCase))
            .WithMessage("Filtrul de stare trebuie să fie Pending, Confirmed sau History.")
            .When(x => x.Status is not null);
    }
}

public class GetAppointmentRequestsQueryHandler
    : IRequestHandler<GetAppointmentRequestsQuery, PagedResult<AppointmentRequestDto>>
{
    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _clock;

    public GetAppointmentRequestsQueryHandler(IAppDbContext db, IDateTimeProvider clock)
    {
        _db = db;
        _clock = clock;
    }

    public async Task<PagedResult<AppointmentRequestDto>> Handle(
        GetAppointmentRequestsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _db.AppointmentRequests.AsNoTracking();
        var now = _clock.UtcNow;

        if (request.IsHandled.HasValue)
            query = query.Where(x => x.IsHandled == request.IsHandled.Value);

        query = request.Status?.ToLowerInvariant() switch
        {
            "pending" => query
                .Where(x => x.Status == AppointmentStatus.Pending)
                .OrderBy(x => x.StartAt).ThenBy(x => x.Id),
            "confirmed" => query
                .Where(x => x.Status == AppointmentStatus.Confirmed && x.EndAt >= now)
                .OrderBy(x => x.StartAt).ThenBy(x => x.Id),
            "history" => query
                .Where(x => x.Status == AppointmentStatus.Rejected
                    || x.Status == AppointmentStatus.Cancelled
                    || x.Status == AppointmentStatus.Legacy
                    || (x.Status == AppointmentStatus.Confirmed && x.EndAt < now))
                .OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.Id),
            _ => query.OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.Id),
        };

        var totalCount = await query.CountAsync(cancellationToken);

        // Proiecție fără a materializa entitatea; enumurile se convertesc la text
        // după citire, fiindcă sunt persistate prin value converter.
        var rows = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new
            {
                x.Id,
                x.FullName,
                x.Email,
                x.Phone,
                x.ServiceId,
                ServiceName = x.Service != null ? x.Service.Name : null,
                x.PreferredMode,
                x.PreferredTimeframe,
                x.Message,
                x.IsHandled,
                x.Notes,
                x.CreatedAt,
                x.Status,
                x.StartAt,
                x.EndAt,
                x.RejectReason,
                x.GoogleSyncState,
                x.ConfirmedAt,
                x.CancelledAt,
            })
            .ToListAsync(cancellationToken);

        var items = rows
            .Select(x => new AppointmentRequestDto(
                x.Id,
                x.FullName,
                x.Email,
                x.Phone,
                x.ServiceId,
                x.ServiceName,
                x.PreferredMode.ToString(),
                x.PreferredTimeframe,
                x.Message,
                x.IsHandled,
                x.Notes,
                x.CreatedAt,
                x.Status.ToString(),
                Utc(x.StartAt),
                Utc(x.EndAt),
                x.RejectReason,
                x.GoogleSyncState.ToString(),
                Utc(x.ConfirmedAt),
                Utc(x.CancelledAt)))
            .ToList();

        return new PagedResult<AppointmentRequestDto>(items, request.Page, request.PageSize, totalCount);
    }

    /// <summary>SQLite întoarce Kind=Unspecified; marcăm UTC ca JSON-ul să aibă sufixul Z.</summary>
    private static DateTime? Utc(DateTime? value) =>
        value is null ? null : DateTime.SpecifyKind(value.Value, DateTimeKind.Utc);
}
