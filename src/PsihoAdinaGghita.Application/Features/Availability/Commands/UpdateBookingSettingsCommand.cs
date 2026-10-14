using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Availability.Commands;

/// <summary>Setările programărilor online. Fusul orar nu se modifică din panou.</summary>
public record UpdateBookingSettingsCommand(
    bool IsEnabled,
    int SlotStepMinutes,
    int BufferMinutes,
    int MinNoticeHours,
    int HorizonDays,
    int MaxPendingPerEmail,
    bool UseGoogleFreeBusy) : IRequest<Unit>;

public class UpdateBookingSettingsCommandValidator : AbstractValidator<UpdateBookingSettingsCommand>
{
    public UpdateBookingSettingsCommandValidator()
    {
        RuleFor(x => x.SlotStepMinutes)
            .InclusiveBetween(5, 120).WithMessage("Pasul dintre sloturi trebuie să fie între 5 și 120 de minute.");

        RuleFor(x => x.BufferMinutes)
            .InclusiveBetween(0, 120).WithMessage("Pauza dintre ședințe trebuie să fie între 0 și 120 de minute.");

        RuleFor(x => x.MinNoticeHours)
            .InclusiveBetween(0, 720).WithMessage("Preavizul minim trebuie să fie între 0 și 720 de ore.");

        RuleFor(x => x.HorizonDays)
            .InclusiveBetween(1, 365).WithMessage("Orizontul de programare trebuie să fie între 1 și 365 de zile.");

        RuleFor(x => x.MaxPendingPerEmail)
            .InclusiveBetween(1, 10).WithMessage("Numărul maxim de cereri în așteptare trebuie să fie între 1 și 10.");
    }
}

public class UpdateBookingSettingsCommandHandler : IRequestHandler<UpdateBookingSettingsCommand, Unit>
{
    private readonly IAppDbContext _db;

    public UpdateBookingSettingsCommandHandler(IAppDbContext db) => _db = db;

    public async Task<Unit> Handle(UpdateBookingSettingsCommand request, CancellationToken cancellationToken)
    {
        var settings = await _db.BookingSettings.FirstOrDefaultAsync(cancellationToken);
        if (settings is null)
        {
            settings = new BookingSettings();
            _db.BookingSettings.Add(settings);
        }

        settings.IsEnabled = request.IsEnabled;
        settings.SlotStepMinutes = request.SlotStepMinutes;
        settings.BufferMinutes = request.BufferMinutes;
        settings.MinNoticeHours = request.MinNoticeHours;
        settings.HorizonDays = request.HorizonDays;
        settings.MaxPendingPerEmail = request.MaxPendingPerEmail;
        settings.UseGoogleFreeBusy = request.UseGoogleFreeBusy;

        await _db.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
