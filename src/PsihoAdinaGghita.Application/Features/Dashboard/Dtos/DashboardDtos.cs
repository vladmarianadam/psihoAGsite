using PsihoAdinaGghita.Domain.Enums;

namespace PsihoAdinaGghita.Application.Features.Dashboard.Dtos;

public record DashboardArticleDto(
    int Id,
    string Title,
    string Slug,
    int ViewCount,
    ArticleStatus Status);

public record DashboardAppointmentDto(
    int Id,
    string FullName,
    string Email,
    string Phone,
    string? ServiceName,
    SessionMode PreferredMode,
    bool IsHandled,
    DateTime CreatedAt);

public record DashboardStatsDto(
    int TotalArticles,
    int PublishedArticles,
    int DraftArticles,
    int NewAppointmentRequests,
    int TotalAppointmentRequests,
    int NewContactMessages,
    int TotalViews,
    IReadOnlyList<DashboardArticleDto> MostViewedArticles,
    IReadOnlyList<DashboardAppointmentDto> LatestAppointmentRequests);
