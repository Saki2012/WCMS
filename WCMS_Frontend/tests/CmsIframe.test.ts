import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { parseCmsHtml } from "../src/SysCore/Components/CmsHtml/CmsHtml_Parse.tsx";
import { isYoutubeIframeUrl, mergeYoutubeIframeAllow, normalizeYoutubeEmbedUrl } from "../src/SysCore/Components/CmsHtml/CmsIframeUtils.ts";

test("detects only supported YouTube iframe hosts", () =>
{
    assert.equal(isYoutubeIframeUrl("https://www.youtube.com/embed/abc123"), true);
    assert.equal(isYoutubeIframeUrl("https://www.youtube-nocookie.com/embed/abc123"), true);
    assert.equal(isYoutubeIframeUrl("https://youtu.be/abc123"), true);
    assert.equal(isYoutubeIframeUrl("https://youtube.com.example.com/embed/abc123"), false);
    assert.equal(isYoutubeIframeUrl("javascript:https://www.youtube.com/embed/abc123"), false);
});

test("normalizes common YouTube links to embed URLs", () =>
{
    assert.equal(normalizeYoutubeEmbedUrl("https://youtu.be/abc123?t=10"), "https://www.youtube.com/embed/abc123?t=10");
    assert.equal(normalizeYoutubeEmbedUrl("https://www.youtube.com/watch?v=abc123&start=15"), "https://www.youtube.com/embed/abc123?start=15");
    assert.equal(normalizeYoutubeEmbedUrl("https://www.youtube.com/shorts/abc123"), "https://www.youtube.com/embed/abc123");
    assert.equal(normalizeYoutubeEmbedUrl("https://m.youtube.com/embed/abc123?start=30"), "https://www.youtube.com/embed/abc123?start=30");
});

test("merges YouTube permissions without removing or duplicating existing entries", () =>
{
    const allow = mergeYoutubeIframeAllow("autoplay; fullscreen; custom-feature 'self'");
    assert.match(allow, /custom-feature 'self'/);
    assert.equal(allow.split(";").map(item => item.trim()).filter(item => item === "fullscreen").length, 1);
    assert.match(allow, /picture-in-picture/);
});

test("renders YouTube iframe with the existing Bootstrap ratio utilities", () =>
{
    const node = parseCmsHtml(
        '<p><iframe src="https://www.youtube.com/watch?v=abc123" width="1200" height="675" style="width:1200px;height:675px;border:0"></iframe></p>',
        { lang: "TW" as never },
    );
    const markup = renderToStaticMarkup(node);

    assert.match(markup, /class="ratio ratio-16x9 d-block"/);
    assert.match(markup, /src="https:\/\/www\.youtube\.com\/embed\/abc123"/);
    assert.match(markup, /allowfullscreen=""/);
    assert.doesNotMatch(markup, /width="1200"/);
    assert.doesNotMatch(markup, /height="675"/);
});

test("leaves non-YouTube iframe structure unchanged", () =>
{
    const node = parseCmsHtml('<iframe src="https://maps.google.com/maps?q=taipei" width="640" height="480"></iframe>', { lang: "TW" as never });
    const markup = renderToStaticMarkup(node);

    assert.doesNotMatch(markup, /ratio-16x9/);
    assert.match(markup, /width="640"/);
    assert.match(markup, /height="480"/);
});
