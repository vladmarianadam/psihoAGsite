using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Testimonials.Commands;

public record ApproveTestimonialCommand(int Id, bool IsApproved) : IRequest<Unit>;

public class ApproveTestimonialCommandValidator : AbstractValidator<ApproveTestimonialCommand>
{
    public ApproveTestimonialCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0)
            .WithMessage("Identificatorul testimonialului este invalid.");
    }
}

public class ApproveTestimonialCommandHandler : IRequestHandler<ApproveTestimonialCommand, Unit>
{
    private readonly IAppDbContext _db;
    public ApproveTestimonialCommandHandler(IAppDbContext db) => _db = db;

    public async Task<Unit> Handle(ApproveTestimonialCommand request, CancellationToken cancellationToken)
    {
        var testimonial = await _db.Testimonials
            .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Testimonial), request.Id);

        testimonial.IsApproved = request.IsApproved;
        await _db.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
