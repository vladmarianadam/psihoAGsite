using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Infrastructure.Persistence.Configurations;

public class TestimonialConfiguration : IEntityTypeConfiguration<Testimonial>
{
    public void Configure(EntityTypeBuilder<Testimonial> builder)
    {
        // Colecția de domain events nu se persistă (plan §4).
        builder.Ignore(x => x.DomainEvents);

        builder.HasKey(x => x.Id);

        builder.Property(x => x.AuthorName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.AuthorRole)
            .HasMaxLength(100);

        builder.Property(x => x.Text)
            .IsRequired()
            .HasMaxLength(2000);

        // Fără constrângere în DB pentru Rating: validarea intervalului 1–5 se face
        // în Application (validatorii FluentValidation), ca să rămână portabil între provideri.
        builder.Property(x => x.Rating)
            .IsRequired();

        builder.Property(x => x.IsApproved)
            .IsRequired();

        builder.Property(x => x.DisplayOrder)
            .IsRequired();

        builder.HasIndex(x => x.DisplayOrder);
    }
}
