using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Common.Models;
using PsihoAdinaGghita.Application.Features.Contact.Dtos;

namespace PsihoAdinaGghita.Application.Features.Contact.Queries;

public record GetContactMessagesQuery(int Page = 1, int PageSize = 20, bool? IsHandled = null)
    : IRequest<PagedResult<ContactMessageDto>>;

public class GetContactMessagesQueryValidator : AbstractValidator<GetContactMessagesQuery>
{
    public GetContactMessagesQueryValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("Pagina trebuie să fie cel puțin 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 50).WithMessage("Numărul de elemente pe pagină trebuie să fie între 1 și 50.");
    }
}

public class GetContactMessagesQueryHandler : IRequestHandler<GetContactMessagesQuery, PagedResult<ContactMessageDto>>
{
    private readonly IAppDbContext _db;

    public GetContactMessagesQueryHandler(IAppDbContext db) => _db = db;

    public async Task<PagedResult<ContactMessageDto>> Handle(
        GetContactMessagesQuery request,
        CancellationToken cancellationToken)
    {
        var query = _db.ContactMessages.AsNoTracking();

        if (request.IsHandled.HasValue)
            query = query.Where(x => x.IsHandled == request.IsHandled.Value);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.Id)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new ContactMessageDto(
                x.Id,
                x.FullName,
                x.Email,
                x.Phone,
                x.Subject,
                x.Message,
                x.IsHandled,
                x.CreatedAt))
            .ToListAsync(cancellationToken);

        return new PagedResult<ContactMessageDto>(items, request.Page, request.PageSize, totalCount);
    }
}
