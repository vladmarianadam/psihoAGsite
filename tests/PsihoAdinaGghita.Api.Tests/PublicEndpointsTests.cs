using System.Net;
using System.Net.Http.Json;
using PsihoAdinaGghita.Application.Features.Categories.Dtos;
using PsihoAdinaGghita.Application.Features.Services.Dtos;

namespace PsihoAdinaGghita.Api.Tests;

public class PublicEndpointsTests : IClassFixture<PsihoApiFactory>
{
    private readonly PsihoApiFactory _factory;

    public PublicEndpointsTests(PsihoApiFactory factory) => _factory = factory;

    [Theory]
    [InlineData("/api/categories")]
    [InlineData("/api/services")]
    [InlineData("/api/testimonials")]
    [InlineData("/api/faq")]
    [InlineData("/api/articles?page=1&pageSize=3")]
    public async Task Endpointurile_publice_raspund_fara_autentificare(string url)
    {
        var response = await _factory.CreateClient().GetAsync(url);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Seed_ul_populeaza_categorii_si_servicii()
    {
        var client = _factory.CreateClient();

        var categories = await client.GetFromJsonAsync<List<CategoryDto>>("/api/categories");
        var services = await client.GetFromJsonAsync<List<ServiceListItemDto>>("/api/services");

        Assert.NotNull(categories);
        Assert.NotEmpty(categories);
        Assert.NotNull(services);
        Assert.NotEmpty(services);
        Assert.All(services, s => Assert.False(string.IsNullOrWhiteSpace(s.Slug)));
    }

    [Fact]
    public async Task Articolul_publicat_este_accesibil_dupa_slug_si_isi_numara_vizualizarile()
    {
        var client = _factory.CreateClient();

        var list = await client.GetFromJsonAsync<PagedArticles>("/api/articles?page=1&pageSize=1");
        var slug = list!.Items[0].Slug;

        var first = await client.GetFromJsonAsync<ArticleView>($"/api/articles/{slug}");
        await client.GetAsync($"/api/articles/{slug}");
        var third = await client.GetFromJsonAsync<ArticleView>($"/api/articles/{slug}");

        Assert.NotNull(first);
        Assert.True(third!.ViewCount > first!.ViewCount, "ViewCount trebuie să crească la fiecare afișare.");
    }

    [Fact]
    public async Task Slug_inexistent_intoarce_404()
    {
        var response = await _factory.CreateClient().GetAsync("/api/articles/articol-care-nu-exista");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Robots_txt_blocheaza_panoul_de_management()
    {
        var body = await _factory.CreateClient().GetStringAsync("/robots.txt");

        Assert.Contains("Disallow: /management", body);
        Assert.Contains("Sitemap:", body);
    }

    [Fact]
    public async Task Sitemap_ul_nu_expune_rutele_de_management()
    {
        var body = await _factory.CreateClient().GetStringAsync("/sitemap.xml");

        Assert.Contains("<urlset", body);
        Assert.DoesNotContain("/management", body);
    }

    [Fact]
    public async Task Raspunsurile_au_headerele_de_securitate()
    {
        var response = await _factory.CreateClient().GetAsync("/api/faq");

        Assert.True(response.Headers.Contains("X-Content-Type-Options"));
        Assert.True(response.Headers.Contains("Content-Security-Policy"));
        Assert.True(response.Headers.Contains("Referrer-Policy"));
    }

    private record PagedArticles(List<ArticleSlugOnly> Items);

    private record ArticleSlugOnly(string Slug);

    private record ArticleView(string Slug, int ViewCount);
}
