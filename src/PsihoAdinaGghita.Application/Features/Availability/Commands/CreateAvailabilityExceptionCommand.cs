using FluentValidation;
using MediatR;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Features.Booking.Services;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Availability.Commands;

/// <summary>Zi liberă (<paramref name="IsClosed"/>) sau interval care înlocuiește programul acelei zile.</summary>
public record CreateAvailabilityExceptionCommand(
    DateOnly Date,
    bool IsClosed,
    TimeOnly? StartTime,
    TimeOnly? EndTime,
    string? Reason) : IRequest<int>;

public class CreateAvailabilityExceptionCommandValidator : AbstractValidator<CreateAvailabilityExceptionCommand>
{
    public CreateAvailabilityExceptionCommandValidator(IDateTimeProvider clock)
    {
        RuleFor(x => x.Date)
            .Must(date => date >= SlotCalculator.LocalToday(clock.UtcNow, TimeZoneInfo.FindSystemTimeZoneById(new BookingSettings().TimeZone)))
            .WithMessage("Data excepției nu poate fi în trecut.");

        RuleFor(x => x.StartTime)
            .NotNull().WithMessage("Ora de început este obligatorie pentru un interval deschis.")
            .When(x => !x.IsClosed);

        RuleFor(x => x.EndTime)
            .NotNull().WithMessage("Ora de sfârșit este obligatorie pentru un interval deschis.")
            .GreaterThan(x => x.StartTime).WithMessage("Ora de sfârșit trebuie să fie după ora de început.")
            .When(x => !x.IsClosed);

        RuleFor(x => x.Reason)
            .MaximumLength(200).WithMessage("Motivul poate avea maxim 200 de caractere.");
    }
}

public class CreateAvailabilityExceptionCommandHandler : IRequestHandler<CreateAvailabilityExceptionCommand, int>
{
    private readonly IAppDbContext _db;

    public CreateAvailabilityExceptionCommandHandler(IAppDbContext db) => _db = db;

    public async Task<int> Handle(CreateAvailabilityExceptionCommand request, CancellationToken cancellationToken)
    {
        var entity = new AvailabilityException
        {
            Date = request.Date,
            IsClosed = request.IsClosed,
            StartTime = request.IsClosed ? null : request.StartTime,
            EndTime = request.IsClosed ? null : request.EndTime,
            Reason = string.IsNullOrWhiteSpace(request.Reason) ? null : request.Reason.Trim(),
        };

        _db.AvailabilityExceptions.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);

        return entity.Id;
    }
}
