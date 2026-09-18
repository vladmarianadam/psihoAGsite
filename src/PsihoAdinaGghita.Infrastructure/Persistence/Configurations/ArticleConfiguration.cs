using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Infrastructure.Persistence.Configurations;

public class ArticleConfiguration : IEntityTypeConfiguration<Article>
{
    public void Configure(EntityTypeBuilder<Article> builder)
    {
        // Colecția de domain events nu se persistă (plan §4).
        builder.Ignore(x => x.DomainEvents);

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.Slug)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.Excerpt)
            .IsRequired()
            .HasMaxLength(500);

        // HTML lung din editor — fără limită de lungime.
        builder.Property(x => x.ContentHtml)
            .IsRequired();

        builder.Property(x => x.CoverImageUrl)
            .HasMaxLength(500);

        builder.Property(x => x.CoverImageAlt)
            .HasMaxLength(200);

        builder.Property(x => x.MetaTitle)
            .HasMaxLength(200);

        builder.Property(x => x.MetaDescription)
            .HasMaxLength(300);

        // Enum stocat ca text, pentru lizibilitate în DB și stabilitate la reordonare.
        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(x => x.ReadingMinutes)
            .IsRequired();

        builder.Property(x => x.ViewCount)
            .IsRequired();

        builder.HasIndex(x => x.Slug)
            .IsUnique();

        // Index compus pentru listarea publică (articole publicate, ordonate descrescător după dată).
        builder.HasIndex(x => new { x.Status, x.PublishedAt });

        // Relația Article → Category este configurată în CategoryConfiguration
        // (HasMany(Articles) / WithOne(Category), FK CategoryId, DeleteBehavior.SetNull).
        builder.HasIndex(x => x.CategoryId);
    }
}
