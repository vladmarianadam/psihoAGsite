namespace PsihoAdinaGghita.Application.Features.Testimonials.Dtos;

/// <summary>Testimonial expus public — doar cele aprobate ajung aici (plan §7).</summary>
public record TestimonialDto(
    int Id,
    string AuthorName,
    string? AuthorRole,
    string Text,
    int Rating,
    int DisplayOrder);

/// <summary>Varianta pentru panoul de administrare, cu starea de aprobare și auditul.</summary>
public record AdminTestimonialDto(
    int Id,
    string AuthorName,
    string? AuthorRole,
    string Text,
    int Rating,
    int DisplayOrder,
    bool IsApproved,
    DateTime CreatedAt,
    DateTime? UpdatedAt);
