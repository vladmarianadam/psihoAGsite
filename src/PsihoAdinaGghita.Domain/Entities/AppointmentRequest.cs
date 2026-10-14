using PsihoAdinaGghita.Domain.Common;
using PsihoAdinaGghita.Domain.Enums;

namespace PsihoAdinaGghita.Domain.Entities;

public class AppointmentRequest : BaseEntity
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public int? ServiceId { get; set; }
    public Service? Service { get; set; }
    public SessionMode PreferredMode { get; set; } = SessionMode.Cabinet;

    /// <summary>Text liber, ex. „dimineața, în timpul săptămânii". Doar la cererile Legacy.</summary>
    public string? PreferredTimeframe { get; set; }
    public string? Message { get; set; }

    /// <summary>Consimțământ GDPR — obligatoriu, validat pe server.</summary>
    public bool GdprConsent { get; set; }
    public bool IsHandled { get; set; }
    public string? Notes { get; set; }

    // ---- Programare pe slot (propunerea A) ----------------------------------

    public AppointmentStatus Status { get; set; } = AppointmentStatus.Legacy;

    /// <summary>Începutul și sfârșitul slotului, în UTC. Null la cererile Legacy.</summary>
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }

    /// <summary>Motivul respingerii sau anulării, trimis clientului.</summary>
    public string? RejectReason { get; set; }

    public string? GoogleEventId { get; set; }
    public SyncState GoogleSyncState { get; set; } = SyncState.NotNeeded;
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
}
