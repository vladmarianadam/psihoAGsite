using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Faq.Commands;

public record UpdateFaqItemCommand(
    int Id,
    string Question,
    string AnswerHtml,
    int DisplayOrder,
    bool IsActive) : IRequest<Unit>;

public class UpdateFaqItemCommandValidator : AbstractValidator<UpdateFaqItemCommand>
{
    public UpdateFaqItemCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0)
            .WithMessage("Identificatorul întrebării este invalid.");

        RuleFor(x => x.Question).NotEmpty().MaximumLength(300)
            .WithMessage("Întrebarea este obligatorie (maxim 300 de caractere).");

        RuleFor(x => x.AnswerHtml).NotEmpty()
            .WithMessage("Răspunsul este obligatoriu.");

        RuleFor(x => x.DisplayOrder).GreaterThanOrEqualTo(0)
            .WithMessage("Ordinea de afișare nu poate fi negativă.");
    }
}

public class UpdateFaqItemCommandHandler : IRequestHandler<UpdateFaqItemCommand, Unit>
{
    private readonly IAppDbContext _db;
    private readonly IHtmlSanitizer _sanitizer;

    public UpdateFaqItemCommandHandler(IAppDbContext db, IHtmlSanitizer sanitizer)
    {
        _db = db;
        _sanitizer = sanitizer;
    }

    public async Task<Unit> Handle(UpdateFaqItemCommand request, CancellationToken cancellationToken)
    {
        var item = await _db.FaqItems
            .FirstOrDefaultAsync(f => f.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(FaqItem), request.Id);

        item.Question = request.Question.Trim();
        item.AnswerHtml = _sanitizer.Sanitize(request.AnswerHtml);
        item.DisplayOrder = request.DisplayOrder;
        item.IsActive = request.IsActive;

        await _db.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
