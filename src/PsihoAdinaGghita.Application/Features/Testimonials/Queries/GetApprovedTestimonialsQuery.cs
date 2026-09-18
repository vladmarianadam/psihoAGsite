using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Features.Testimonials.Dtos;

namespace PsihoAdinaGghita.Application.Features.Testimonials.Queries;

public record GetApprovedTestimonialsQuery : IRequest<IReadOnlyList<TestimonialDto>>;

public class GetApprovedTestimonialsQueryHandler
    : IRequestHandler<GetApprovedTestimonialsQuery, IReadOnlyList<TestimonialDto>>
{
    private readonly IAppDbContext _db;
    public GetApprovedTestimonialsQueryHandler(IAppDbContext db) => _db = db;

    public async Task<IReadOnlyList<TestimonialDto>> Handle(
        GetApprovedTestimonialsQuery request,
        CancellationToken cancellationToken)
    {
        return await _db.Testimonials
            .AsNoTracking()
            .Where(t => t.IsApproved)
            .OrderBy(t => t.DisplayOrder)
            .ThenByDescending(t => t.CreatedAt)
            .Select(t => new TestimonialDto(
                t.Id,
                t.AuthorName,
                t.AuthorRole,
                t.Text,
                t.Rating,
                t.DisplayOrder))
            .ToListAsync(cancellationToken);
    }
}
