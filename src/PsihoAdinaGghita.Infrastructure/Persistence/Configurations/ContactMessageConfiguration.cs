using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Infrastructure.Persistence.Configurations;

public class ContactMessageConfiguration : IEntityTypeConfiguration<ContactMessage>
{
    public void Configure(EntityTypeBuilder<ContactMessage> builder)
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
            .HasMaxLength(40);

        builder.Property(x => x.Subject)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.Message)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(x => x.GdprConsent)
            .IsRequired();

        builder.Property(x => x.IsHandled)
            .IsRequired();

        // Index pentru lista din admin: mesaje nerezolvate, cele mai recente primele.
        builder.HasIndex(x => new { x.IsHandled, x.CreatedAt });
    }
}
