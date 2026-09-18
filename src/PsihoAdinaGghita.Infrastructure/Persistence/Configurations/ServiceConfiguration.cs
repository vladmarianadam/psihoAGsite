using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Infrastructure.Persistence.Configurations;

public class ServiceConfiguration : IEntityTypeConfiguration<Service>
{
    public void Configure(EntityTypeBuilder<Service> builder)
    {
        // Colecția de domain events nu se persistă (plan §4).
        builder.Ignore(x => x.DomainEvents);

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(x => x.Slug)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(x => x.ShortDescription)
            .IsRequired()
            .HasMaxLength(500);

        // LongDescriptionHtml: HTML lung din editor — nicio limită de lungime, deci nu se configurează.

        builder.Property(x => x.Price)
            .HasPrecision(10, 2);

        builder.Property(x => x.PriceUnit)
            .HasMaxLength(50);

        builder.Property(x => x.DurationMinutes)
            .IsRequired();

        builder.Property(x => x.IconName)
            .HasMaxLength(50);

        builder.Property(x => x.ImageUrl)
            .HasMaxLength(500);

        // Enum stocat ca text (plan §4).
        builder.Property(x => x.SessionMode)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(x => x.DisplayOrder)
            .IsRequired();

        builder.Property(x => x.IsActive)
            .IsRequired();

        builder.HasIndex(x => x.Slug)
            .IsUnique();

        builder.HasIndex(x => x.DisplayOrder);
    }
}
