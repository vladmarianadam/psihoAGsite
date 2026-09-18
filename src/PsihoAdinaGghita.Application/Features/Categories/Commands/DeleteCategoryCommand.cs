using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Categories.Commands;

public record DeleteCategoryCommand(int Id) : IRequest<Unit>;

public class DeleteCategoryCommandValidator : AbstractValidator<DeleteCategoryCommand>
{
    public DeleteCategoryCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0)
            .WithMessage("Identificatorul categoriei este invalid.");
    }
}

public class DeleteCategoryCommandHandler : IRequestHandler<DeleteCategoryCommand, Unit>
{
    private readonly IAppDbContext _db;

    public DeleteCategoryCommandHandler(IAppDbContext db) => _db = db;

    public async Task<Unit> Handle(DeleteCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await _db.Categories
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Category), request.Id);

        // Articolele NU se șterg: FK-ul Article.CategoryId este configurat cu DeleteBehavior.SetNull
        // în CategoryConfiguration (plan §4), deci baza de date le trece automat pe null și rămân
        // publicate, doar fără categorie. Nu ștergem nimic manual aici.
        _db.Categories.Remove(category);
        await _db.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
