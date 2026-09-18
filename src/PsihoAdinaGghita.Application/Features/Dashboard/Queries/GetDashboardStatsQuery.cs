using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Features.Dashboard.Dtos;
using PsihoAdinaGghita.Domain.Enums;

namespace PsihoAdinaGghita.Application.Features.Dashboard.Queries;

public record GetDashboardStatsQuery : IRequest<DashboardStatsDto>;

public class GetDashboardStatsQueryHandler : IRequestHandler<GetDashboardStatsQuery, DashboardStatsDto>
{
    private const int TopCount = 5;

    private readonly IAppDbContext _db;
    public GetDashboardStatsQueryHandler(IAppDbContext db) => _db = db;

    public async Task<DashboardStatsDto> Handle(GetDashboardStatsQuery request, CancellationToken cancellationToken)
    {
        // Agregările se fac în baza de date (COUNT/SUM), nu prin încărcarea entităților.
        var totalArticles = await _db.Articles.CountAsync(cancellationToken);
        var publishedArticles = await _db.Articles
            .CountAsync(a => a.Status == ArticleStatus.Published, cancellationToken);

        var newAppointmentRequests = await _db.AppointmentRequests
            .CountAsync(a => !a.IsHandled, cancellationToken);
        var totalAppointmentRequests = await _db.AppointmentRequests.CountAsync(cancellationToken);

        var newContactMessages = await _db.ContactMessages
            .CountAsync(m => !m.IsHandled, cancellationToken);

        var totalViews = await _db.Articles.SumAsync(a => a.ViewCount, cancellationToken);

        var mostViewedArticles = await _db.Articles
            .AsNoTracking()
            .OrderByDescending(a => a.ViewCount)
            .ThenByDescending(a => a.Id)
            .Take(TopCount)
            .Select(a => new DashboardArticleDto(a.Id, a.Title, a.Slug, a.ViewCount, a.Status))
            .ToListAsync(cancellationToken);

        var latestAppointmentRequests = await _db.AppointmentRequests
            .AsNoTracking()
            .OrderByDescending(a => a.CreatedAt)
            .ThenByDescending(a => a.Id)
            .Take(TopCount)
            .Select(a => new DashboardAppointmentDto(
                a.Id,
                a.FullName,
                a.Email,
                a.Phone,
                a.Service != null ? a.Service.Name : null,
                a.PreferredMode,
                a.IsHandled,
                a.CreatedAt))
            .ToListAsync(cancellationToken);

        return new DashboardStatsDto(
            totalArticles,
            publishedArticles,
            totalArticles - publishedArticles,
            newAppointmentRequests,
            totalAppointmentRequests,
            newContactMessages,
            totalViews,
            mostViewedArticles,
            latestAppointmentRequests);
    }
}
