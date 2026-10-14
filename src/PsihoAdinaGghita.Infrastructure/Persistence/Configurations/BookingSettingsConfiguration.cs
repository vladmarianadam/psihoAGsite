using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Infrastructure.Persistence.Configurations;

public class BookingSettingsConfiguration : IEntityTypeConfiguration<BookingSettings>
{
    public void Configure(EntityTypeBuilder<BookingSettings> builder)
    {
        // Colecția de domain events nu se persistă (plan §4).
        builder.Ignore(x => x.DomainEvents);

        builder.HasKey(x => x.Id);

        builder.Property(x => x.TimeZone)
            .IsRequired()
            .HasMaxLength(64);
    }
}
