using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Infrastructure.Persistence.Configurations;

public class AvailabilityExceptionConfiguration : IEntityTypeConfiguration<AvailabilityException>
{
    public void Configure(EntityTypeBuilder<AvailabilityException> builder)
    {
        // Colecția de domain events nu se persistă (plan §4).
        builder.Ignore(x => x.DomainEvents);

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Reason)
            .HasMaxLength(200);

        builder.HasIndex(x => x.Date);
    }
}
