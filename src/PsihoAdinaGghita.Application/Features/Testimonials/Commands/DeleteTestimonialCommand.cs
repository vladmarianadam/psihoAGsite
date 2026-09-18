using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Testimonials.Commands;

public record DeleteTestimonialCommand(int Id) : IRequest<Unit>;

public class DeleteTestimonialCommandValidator : AbstractValidator<DeleteTestimonialCommand>
{
    public DeleteTestimonialCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0)
            .WithMessage("Identificatorul testimonialului este invalid.");
    }
}

public class DeleteTestimonialCommandHandler : IRequestHandler<DeleteTestimonialCommand, Unit>
{
    private readonly IAppDbContext _db;
    public DeleteTestimonialCommandHandler(IAppDbContext db) => _db = db;

    public async Task<Unit> Handle(DeleteTestimonialCommand request, CancellationToken cancellationToken)
    {
        var testimonial = await _db.Testimonials
            .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Testimonial), request.Id);

        _db.Testimonials.Remove(testimonial);
        await _db.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
