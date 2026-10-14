using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Features.Availability.Dtos;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Availability.Commands;

/// <summary>Înlocuiește tot programul săptămânal cu lista primită (listă goală = niciun interval).</summary>
public record ReplaceAvailabilityRulesCommand(IReadOnlyList<AvailabilityRuleInput> Rules) : IRequest<Unit>;

public class ReplaceAvailabilityRulesCommandValidator : AbstractValidator<ReplaceAvailabilityRulesCommand>
{
    public ReplaceAvailabilityRulesCommandValidator()
    {
        RuleFor(x => x.Rules)
            .NotNull().WithMessage("Lista de intervale este obligatorie.");

        RuleForEach(x => x.Rules).ChildRules(rule =>
        {
            rule.RuleFor(r => r.DayOfWeek)
                .InclusiveBetween(0, 6).WithMessage("Ziua săptămânii trebuie să fie între 0 (duminică) și 6 (sâmbătă).");

            rule.RuleFor(r => r.EndTime)
                .GreaterThan(r => r.StartTime).WithMessage("Ora de sfârșit trebuie să fie după ora de început.");
        });

        RuleFor(x => x.Rules)
            .Must(HaveNoOverlaps).WithMessage("Intervalele din aceeași zi nu se pot suprapune.")
            .When(x => x.Rules is not null);
    }

    private static bool HaveNoOverlaps(IReadOnlyList<AvailabilityRuleInput> rules) =>
        rules.GroupBy(r => r.DayOfWeek).All(day =>
        {
            var ordered = day.OrderBy(r => r.StartTime).ToList();
            return ordered.Zip(ordered.Skip(1)).All(pair => pair.First.EndTime <= pair.Second.StartTime);
        });
}

public class ReplaceAvailabilityRulesCommandHandler : IRequestHandler<ReplaceAvailabilityRulesCommand, Unit>
{
    private readonly IAppDbContext _db;

    public ReplaceAvailabilityRulesCommandHandler(IAppDbContext db) => _db = db;

    public async Task<Unit> Handle(ReplaceAvailabilityRulesCommand request, CancellationToken cancellationToken)
    {
        _db.AvailabilityRules.RemoveRange(await _db.AvailabilityRules.ToListAsync(cancellationToken));
        _db.AvailabilityRules.AddRange(request.Rules.Select(r => new AvailabilityRule
        {
            DayOfWeek = (DayOfWeek)r.DayOfWeek,
            StartTime = r.StartTime,
            EndTime = r.EndTime,
        }));

        await _db.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
