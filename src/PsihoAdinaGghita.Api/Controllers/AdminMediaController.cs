using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PsihoAdinaGghita.Application.Common.Models;
using PsihoAdinaGghita.Application.Features.Media.Commands;
using PsihoAdinaGghita.Application.Features.Media.Dtos;
using PsihoAdinaGghita.Application.Features.Media.Queries;

namespace PsihoAdinaGghita.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/admin/media")]
public class AdminMediaController : ControllerBase
{
    private readonly ISender _sender;
    public AdminMediaController(ISender sender) => _sender = sender;

    /// <summary>Biblioteca media, paginată, cele mai recente încărcări primele.</summary>
    [HttpGet("")]
    [ProducesResponseType(typeof(PagedResult<MediaAssetDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<MediaAssetDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 24,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetMediaAssetsQuery(page, pageSize), cancellationToken);
        return Ok(result);
    }

    /// <summary>Încarcă o imagine (multipart/form-data).</summary>
    [HttpPost("upload")]
    [RequestSizeLimit(6_000_000)]
    [ProducesResponseType(typeof(MediaAssetDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<MediaAssetDto>> Upload(
        [FromForm] IFormFile? file,
        [FromForm] string? altText,
        CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Fișier lipsă",
                Detail = "Selectați o imagine pentru încărcare.",
            });
        }

        await using var content = file.OpenReadStream();
        var result = await _sender.Send(
            new UploadImageCommand(content, file.FileName, file.ContentType, altText),
            cancellationToken);

        return Ok(result);
    }

    /// <summary>Șterge imaginea de pe disc și înregistrarea din bibliotecă.</summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await _sender.Send(new DeleteImageCommand(id), cancellationToken);
        return NoContent();
    }
}
