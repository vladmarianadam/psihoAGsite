using FluentValidation;
using MediatR;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Testimonials.Commands;

public record CreateTestimonialCommand(
    string AuthorName,
    string? AuthorRole,
    string Text,
    int Rating,
    bool IsApproved,
    int DisplayOrder) : IRequest<int>;

public class CreateTestimonialCommandValidator : AbstractValidator<CreateTestimonialCommand>
{
    public CreateTestimonialCommandValidator()
    {
        RuleFor(x => x.AuthorName).NotEmpty().MaximumLength(100)
            .WithMessage("Numele autorului este obligatoriu (maxim 100 de caractere).");

        RuleFor(x => x.AuthorRole).MaximumLength(100)
            .WithMessage("Rolul autorului poate avea maxim 100 de caractere.");

        RuleFor(x => x.Text).NotEmpty().MaximumLength(2000)
            .WithMessage("Textul testimonialului este obligatoriu (maxim 2000 de caractere).");

        RuleFor(x => x.Rating).InclusiveBetween(1, 5)
            .WithMessage("Ratingul trebuie să fie între 1 și 5.");

        RuleFor(x => x.DisplayOrder).GreaterThanOrEqualTo(0)
            .WithMessage("Ordinea de afișare nu poate fi negativă.");
    }
}

public class CreateTestimonialCommandHandler : IRequestHandler<CreateTestimonialCommand, int>
{
    private readonly IAppDbContext _db;
    public CreateTestimonialCommandHandler(IAppDbContext db) => _db = db;

    public async Task<int> Handle(CreateTestimonialCommand request, CancellationToken cancellationToken)
    {
        var testimonial = new Testimonial
        {
            AuthorName = request.AuthorName.Trim(),
            AuthorRole = string.IsNullOrWhiteSpace(request.AuthorRole) ? null : request.AuthorRole.Trim(),
            Text = request.Text.Trim(),
            Rating = request.Rating,
            IsApproved = request.IsApproved,
            DisplayOrder = request.DisplayOrder,
        };

        _db.Testimonials.Add(testimonial);
        await _db.SaveChangesAsync(cancellationToken);

        return testimonial.Id;
    }
}
