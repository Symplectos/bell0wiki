---
title: DirectWrite in Direct2D
description: This optional tutorial briefly describes the new features of DirectWrite and explains how to use DirectWrite within Direct2D efficiently.
---

> You must stay drunk on writing so reality cannot destroy you.
>
> – Ray Bradbury, Zen in the Art of Writing

This optional tutorial will explain some of the new features of DirectWrite in Windows 8 and Windows 10.

For further details, check
the [MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/hh802480(v=vs.85).aspx#_________what_s_new_in_windows_8).

## Windows 8

With Windows 8, DirectWrite supports additional font properties such as super- and subscripts,
the [PANOSE](https://en.wikipedia.org/wiki/PANOSE) system by Benjamin Bauermeister and Unicode ranges. On the layout
front, spacing has been improved.

## Windows 8.1

With Windows 8.1, DirectWrite supports colour fonts powered by Direct2D.

## Windows 10

Starting in Windows 10, fonts that are included with Windows are available in an online service and are accessible via
DirectWrite on any Windows 10 device. This applies to all Windows 10 editions, including Windows 10 Mobile, Xbox and
HoloLens as well as the desktop client. This allows applications to display content using any Windows font, even if the
font is not currently installed on the device.

### Font set APIs

DirectWrite's font collection interfaces provide a view to a collection of fonts that is organized by font families,
using weight, stretch, and style as sub-family attributes.

### Text Layouts

DirectWrite’s text format and text layout interfaces support new line-spacing modes. In earlier versions, DirectWrite’s
text layout implementation allowed for line spacing in which the height of each line was set automatically based on the
tallest item within a line (the “default” mode), or line spacing with all lines set to a uniform height determined by
the application (the “uniform” mode). In Windows 10, an additional “proportional” line-spacing mode is supported that
gives applications more options for line-spacing behaviour.

## Windows 10 Anniversary Update

Starting in Windows 10 Anniversary Update, DirectWrite provides built-in support for a wider variety of color font
formats. Direct2D, which uses DirectWrite for text rendering, supports these colour font formats automatically when the
*D2D1_DRAW_TEXT_OPTIONS_ENABLE_COLOR_FONT* flag is enabled.

In addition, support for Adobe Typekit and OpenType collections using CFF outlines was added.

## Windows 10 Creators Update

Windows 10 included APIs that allow apps to easily access fonts from a Windows font service. In the Windows 10 Creators
Update, APIs for remote fonts are extended to allow easy access to fonts from other sources on the Web that can be
accessed using HTTP or HTTPS.

With this update, DirectWrite supports OpenType Font Variations.

---

None of those updates are particularly interesting for us, but we nevertheless want to make sure to have a very
efficient implementation of DirectWrite in Direct2D.

## Drawing Text in Direct2D

Direct2D text rendering functionality is offered in two parts. The first part, exposed as the *DrawText* and
*DrawTextLayout* methods, enables us to pass either a string and formatting parameters or a DWrite text layout object
for multiple formats.

The second option to render text, is to use draw glyphs using the *ID2D1RenderTarget::DrawGlyphRun* method.

### DrawText

[DrawText](https://msdn.microsoft.com/en-us/library/windows/desktop/dd371919(v=vs.85).aspx) is very simply to use. It
takes a Unicode string, a foreground brush, a single format object and a destination rectangle. It will lay out and
render the whole string within the layout rectangle, and optionally clip it.

### DrawTextLayout

[DrawTextLayout](https://msdn.microsoft.com/en-us/library/windows/desktop/dd371913(v=vs.85).aspx) is a bit more advanced
than the simple DrawText method. By creating
an [IDWriteTextLayout](https://msdn.microsoft.com/en-us/library/windows/desktop/dd316718(v=vs.85).aspx) object, it is
possible to measure and arrange text as desired. With text layouts, multiple fonts, styles, underlines and
strike-throughs are supported as well.

The DrawTextLayout method proved by Direct2D directly accepts such text layout objects as input and renders the text at
a given position.

The huge advantage of this method is that when using text layouts, the glyph positions are cached in the layout, which
means that a large performance gain is possible by reusing the same layout object for multiple draw calls, basically
avoiding having to recalculate glyph positions for each call.

### DrawGlyphRun

Finally, it is possible to implement
the [IDWriteTextRenderer](https://msdn.microsoft.com/en-us/library/windows/desktop/dd371523(v=vs.85).aspx) interface and
to call [DrawGlyphRun](https://msdn.microsoft.com/en-us/library/windows/desktop/dd371526(v=vs.85).aspx)
and [FillRectangle](https://msdn.microsoft.com/en-us/library/windows/desktop/dd371954(v=vs.85).aspx) *manually*.

## Efficiency

### DrawText or DrawTextLayout

DrawTextLayout draws an existing DWriteTextLayout object to the RenderTarget, while DrawText first has to construct a
DirectWrite layout, based on the parameters that are passed in. If the same text has to be rendered multiple times,
using DrawTextLayout instead of DrawText is a lot more efficient because DrawText has to create a layout every time that
it is called.

### Antialiasing

Using the antialias mode *D2D1_TEXT_ANTIALIAS_MODE_GRAYSCALE* explicitly is very efficient. The quality of rendering
grayscale text is comparable to ClearType but is much faster.

We can set this globally using the Direct2D device context.

```cpp
devCon->SetTextAntialiasMode(D2D1_TEXT_ANTIALIAS_MODE_GRAYSCALE);
```

## DXGI

As we have seen, Direct2D interoperates seamlessly with Direct3D surfaces. When rendering to a DXGI surface, Direct2D
saves the state of the Direct3D devices while rendering and restores it when rendering is completed. Every time that a
batch of Direct2D rendering is completed, the cost of this save and restore and the cost of flushing all the 2D
operations are paid, and yet, the Direct3D device is not flushed. Therefore, to increase performance, the number of
rendering switches between Direct2D and Direct3D must be limited.

To adhere to this principle, we have to change the *printFPS* function:

```cpp
void Direct2D::printFPS(const Microsoft::WRL::ComPtr<ID2D1SolidColorBrush> brush)
{
	if (dxApp->showFPS && textLayoutFPS)
	{
		// draw the text
		devCon->DrawTextLayout(D2D1::Point2F(2.5f, 5.0f), textLayoutFPS.Get(), brush.Get());
	}
}
```

We just have to make sure to call the printFPS method within a Direct2D drawing block:

```cpp
util::Expected<int> DirectXGame::render(double /*farSeer*/)
{
	// clear the back buffer and the depth/stencil buffer
	d3d->clearBuffers();

	////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////// Direct2D /////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////////
	d2d->devCon->BeginDraw();

	// print FPS information
	d2d->printFPS(d2d->blackBrush.Get());

	if(FAILED(d2d->devCon->EndDraw()))
		return std::runtime_error("Failed to draw 2D graphics!");
	
	////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////// Direct3D /////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////////
	
	// present the scene
	if (!d3d->present().wasSuccessful())
		return std::runtime_error("Failed to present the scene!");

	// return success
	return 0;
}
```

---

The next tutorial will introduce Direct2D itself.

---

## References

* Microsoft Developer Network ([MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/ee663274(v=vs.85)))
* Wikipedia