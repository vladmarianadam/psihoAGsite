using PsihoAdinaGghita.Application.Common.Interfaces;

namespace PsihoAdinaGghita.Infrastructure.Services;

public class SystemDateTimeProvider : IDateTimeProvider
{
    public DateTime UtcNow => DateTime.UtcNow;
}
