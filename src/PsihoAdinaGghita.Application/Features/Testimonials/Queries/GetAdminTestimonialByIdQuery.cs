using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Features.Testimonials.Dtos;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Testimonials.Queries;

public record GetAdminTestimonialByIdQuery(int Id) : IRequest<AdminTestimonialDto>;

public class GetAdminTestimonialByIdQueryHandler
    : IRequestHandler<GetAdminTestimonialByIdQuery, AdminTestimonialDto>
{
    private readonly IAppDbContext _db;
    public GetAdminTestimonialByIdQueryHandler(IAppDbContext db) => _db = db;

    public async Task<AdminTestimonialDto> Handle(
        GetAdminTestimonialByIdQuery request,
        CancellationToken cancellationToken)
    {
        var dto = await _db.Testimonials
            .AsNoTracking()
            .Where(t => t.Id == request.Id)
            .Select(t => new AdminTestimonialDto(
                t.Id,
                t.AuthorName,
                t.AuthorRole,
                t.Text,
                t.Rating,
                t.DisplayOrder,
                t.IsApproved,
                t.CreatedAt,
                t.UpdatedAt))
            .FirstOrDefaultAsync(cancellationToken);

        return dto ?? throw new NotFoundException(nameof(Testimonial), request.Id);
    }
}
