using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Infrastructure.Persistence.Configurations;

public class AppointmentRequestConfiguration : IEntityTypeConfiguration<AppointmentRequest>
{
    public void Configure(EntityTypeBuilder<AppointmentRequest> builder)
    {
        // Colecția de domain events nu se persistă (plan §4).
        builder.Ignore(x => x.DomainEvents);

        builder.HasKey(x => x.Id);

        builder.Property(x => x.FullName)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(x => x.Email)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.Phone)
            .IsRequired()
            .HasMaxLength(40);

        // Enum stocat ca text (plan §4).
        builder.Property(x => x.PreferredMode)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(x => x.PreferredTimeframe)
            .HasMaxLength(200);

        builder.Property(x => x.Message)
            .HasMaxLength(2000);

        builder.Property(x => x.GdprConsent)
            .IsRequired();

        builder.Property(x => x.IsHandled)
            .IsRequired();

        builder.Property(x => x.Notes)
            .HasMaxLength(2000);

        // Ștergerea unui serviciu nu șterge cererile — ServiceId devine NULL (plan §4).
        builder.HasOne(x => x.Service)
            .WithMany()
            .HasForeignKey(x => x.ServiceId)
            .OnDelete(DeleteBehavior.SetNull);

        // Index pentru lista din admin: cereri nerezolvate, cele mai recente primele.
        builder.HasIndex(x => new { x.IsHandled, x.CreatedAt });
    }
}
