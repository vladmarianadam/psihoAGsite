using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Common.Models;
using PsihoAdinaGghita.Application.Features.Appointments.Dtos;

namespace PsihoAdinaGghita.Application.Features.Appointments.Queries;

public record GetAppointmentRequestsQuery(int Page = 1, int PageSize = 20, bool? IsHandled = null)
    : IRequest<PagedResult<AppointmentRequestDto>>;

public class GetAppointmentRequestsQueryValidator : AbstractValidator<GetAppointmentRequestsQuery>
{
    public GetAppointmentRequestsQueryValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("Pagina trebuie să fie cel puțin 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 50).WithMessage("Numărul de elemente pe pagină trebuie să fie între 1 și 50.");
    }
}

public class GetAppointmentRequestsQueryHandler
    : IRequestHandler<GetAppointmentRequestsQuery, PagedResult<AppointmentRequestDto>>
{
    private readonly IAppDbContext _db;

    public GetAppointmentRequestsQueryHandler(IAppDbContext db) => _db = db;

    public async Task<PagedResult<AppointmentRequestDto>> Handle(
        GetAppointmentRequestsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _db.AppointmentRequests.AsNoTracking();

        if (request.IsHandled.HasValue)
            query = query.Where(x => x.IsHandled == request.IsHandled.Value);

        var totalCount = await query.CountAsync(cancellationToken);

        // Proiecție fără a materializa entitatea; PreferredMode se convertește la text
        // după citire, fiindcă enumul e persistat prin value converter.
        var rows = await query
            .OrderByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.Id)
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
                x.CreatedAt))
            .ToList();

        return new PagedResult<AppointmentRequestDto>(items, request.Page, request.PageSize, totalCount);
    }
}
