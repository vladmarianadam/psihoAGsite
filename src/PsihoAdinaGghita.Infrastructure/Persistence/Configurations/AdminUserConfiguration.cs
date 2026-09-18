using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Infrastructure.Persistence.Configurations;

public class AdminUserConfiguration : IEntityTypeConfiguration<AdminUser>
{
    public void Configure(EntityTypeBuilder<AdminUser> builder)
    {
        // Colecția de domain events nu se persistă (plan §4).
        builder.Ignore(x => x.DomainEvents);

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Username)
            .IsRequired()
            .HasMaxLength(50);

        // Hash BCrypt (60 de caractere); marja acoperă o eventuală schimbare de algoritm.
        builder.Property(x => x.PasswordHash)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.FullName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.FailedLoginAttempts)
            .IsRequired();

        builder.Property(x => x.MustChangePassword)
            .IsRequired();

        // Se stochează doar hash-ul refresh token-ului, nu tokenul în clar (plan §10).
        builder.Property(x => x.RefreshTokenHash)
            .HasMaxLength(200);

        builder.HasIndex(x => x.Username)
            .IsUnique();
    }
}
