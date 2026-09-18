using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Testimonials.Commands;

public record UpdateTestimonialCommand(
    int Id,
    string AuthorName,
    string? AuthorRole,
    string Text,
    int Rating,
    bool IsApproved,
    int DisplayOrder) : IRequest<Unit>;

public class UpdateTestimonialCommandValidator : AbstractValidator<UpdateTestimonialCommand>
{
    public UpdateTestimonialCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0)
            .WithMessage("Identificatorul testimonialului este invalid.");

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

public class UpdateTestimonialCommandHandler : IRequestHandler<UpdateTestimonialCommand, Unit>
{
    private readonly IAppDbContext _db;
    public UpdateTestimonialCommandHandler(IAppDbContext db) => _db = db;

    public async Task<Unit> Handle(UpdateTestimonialCommand request, CancellationToken cancellationToken)
    {
        var testimonial = await _db.Testimonials
            .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Testimonial), request.Id);

        testimonial.AuthorName = request.AuthorName.Trim();
        testimonial.AuthorRole = string.IsNullOrWhiteSpace(request.AuthorRole) ? null : request.AuthorRole.Trim();
        testimonial.Text = request.Text.Trim();
        testimonial.Rating = request.Rating;
        testimonial.IsApproved = request.IsApproved;
        testimonial.DisplayOrder = request.DisplayOrder;

        await _db.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
