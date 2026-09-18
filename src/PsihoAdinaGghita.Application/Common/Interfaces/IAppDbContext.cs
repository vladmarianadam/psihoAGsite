using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Common.Interfaces;

/// <summary>
/// Abstracția contextului EF folosită de handlerele MediatR — Application nu
/// cunoaște providerul de persistență (plan §2/§3).
/// </summary>
public interface IAppDbContext
{
    DbSet<Article> Articles { get; }
    DbSet<Category> Categories { get; }
    DbSet<Service> Services { get; }
    DbSet<Testimonial> Testimonials { get; }
    DbSet<AppointmentRequest> AppointmentRequests { get; }
    DbSet<ContactMessage> ContactMessages { get; }
    DbSet<FaqItem> FaqItems { get; }
    DbSet<MediaAsset> MediaAssets { get; }
    DbSet<AdminUser> AdminUsers { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
