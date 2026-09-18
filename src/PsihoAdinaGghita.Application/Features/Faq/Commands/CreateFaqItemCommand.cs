using FluentValidation;
using MediatR;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Faq.Commands;

public record CreateFaqItemCommand(
    string Question,
    string AnswerHtml,
    int DisplayOrder,
    bool IsActive) : IRequest<int>;

public class CreateFaqItemCommandValidator : AbstractValidator<CreateFaqItemCommand>
{
    public CreateFaqItemCommandValidator()
    {
        RuleFor(x => x.Question).NotEmpty().MaximumLength(300)
            .WithMessage("Întrebarea este obligatorie (maxim 300 de caractere).");

        RuleFor(x => x.AnswerHtml).NotEmpty()
            .WithMessage("Răspunsul este obligatoriu.");

        RuleFor(x => x.DisplayOrder).GreaterThanOrEqualTo(0)
            .WithMessage("Ordinea de afișare nu poate fi negativă.");
    }
}

public class CreateFaqItemCommandHandler : IRequestHandler<CreateFaqItemCommand, int>
{
    private readonly IAppDbContext _db;
    private readonly IHtmlSanitizer _sanitizer;

    public CreateFaqItemCommandHandler(IAppDbContext db, IHtmlSanitizer sanitizer)
    {
        _db = db;
        _sanitizer = sanitizer;
    }

    public async Task<int> Handle(CreateFaqItemCommand request, CancellationToken cancellationToken)
    {
        var item = new FaqItem
        {
            Question = request.Question.Trim(),
            // HTML din editor — sanitizat pe server înainte de salvare (plan §7).
            AnswerHtml = _sanitizer.Sanitize(request.AnswerHtml),
            DisplayOrder = request.DisplayOrder,
            IsActive = request.IsActive,
        };

        _db.FaqItems.Add(item);
        await _db.SaveChangesAsync(cancellationToken);

        return item.Id;
    }
}
