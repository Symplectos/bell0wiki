---
title: Direct2D - A Revision
description: This optional short tutorial covers the updates DIrect2D received over the years as well as a few efficiency paradigms.
---

> Upward, not Northward
>
> – Edwin A. Abbott

Direct2D is a hardware-accelerate, immediate-mode 2D graphics API that provides high-performance and high-quality
rendering for 2D geometries, bitmaps and text. We have already used Direct2D with DirectWrite to render text in the
previous tutorials, and text rendering is implemented in the DirectX Game Framework.

In this tutorial, we learn more about Direct2D itself, thankfully, the Direct2D API was designed to interoperate well
with Direct3D, thus, for example, we could use Direct2D to create a User Interface or Heads-Up Display for 3D games. In
fact, starting with Windows 8, Direct2D is built using Direct3D 11.1.

If no hardware acceleration is available, Direct2D includes a high-performance software rasterizer (we talked about this
when we learned about Direct3D as well).

By providing a single API that combines the performance of Direct3D and high availability by providing software
fallback, Direct2D provides a single implementation for high-performance rendering in many different scenarios.

The goal of the *Flatland* tutorials is to eventually program a few two-dimensional games. Later on, Direct2D will be an
invaluable asset to create 2D arts for 3D games.

## What's new in Direct2D

For further details, see
the [MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/hh802478(v=vs.85).aspx#_________what_s_new_for_windows_8).

### Windows 8

In Windows 8 Direct2D's semantics for devices and device contexts have been updated to more closely resemble the
semantics used by Direct3D. Moreover, starting with Windows 8, Direct2D includes multithreading.

### Windows 8.1

Starting with Windows 8.1, Direct2D is built on top of Direct3D 11.2.

#### Geometries

Starting in Windows 8.1, Direct2D offers geometry realizations which improve geometry rendering performance in certain
situations, without some of the drawbacks of rasterizing geometry to a bitmap.

#### JPEC YCbCr

With this update Direct2D provides support for rendering image data in the JPEG Y’CbCr format, meaning that applications
can now render JPEG content in its native Y’CbCr representation instead of decompressing to BGRA, which significantly
reduces graphics memory consumption and resource creation time.

#### Block Compressed Formats

Starting in Windows 8.1, Direct2D supports bitmaps that contain *DXGI_FORMAT_BC1_UNORM*, *DXGI_FORMAT_BC2_UNORM*, or
*DXGI_FORMAT_BC3_UNORM* pixel data, meaning that applications can replace their image assets with block compressed DDS
images, which once again significantly reduces graphics memory consumption and resource creation time.

#### Rendering Priority

Direct2D now supports for per-device rendering priority, meaning that applications can switch between normal rendering
priority, which is the default, and low rendering priority, in which the device will not block other rendering tasks on
the system. It is recommended to use low rendering priority for tasks that are not critical to user-responsiveness, such
as pre-rendering content, rendering while minimized, and other operations that are typically performed in the
background.

### Windows 10

Windows 10 brought many exciting changes and updates to Direct2D!

#### Sprite Batches

Starting in Windows 10, Direct2D provides support for creating and rendering sprite batches. Compared to the
general-purpose DrawImage method, sprite batches incur dramatically less per-image CPU overhead. This makes them ideal
for scenarios involving hundreds or thousands of concurrent images, such as game sprites or particle systems. We will
talk a lot about this in later tutorials.

#### Gradient Meshes

Direct2D now provides a new primitive for gradient meshes. Gradient meshes are often used by professional illustrators
in graphic design software, and they allow artists to render complex, photo-realistic multicoloured shapes with all the
memory and scalability benefits of vectors.

#### Improved Image Loading

With Windows 10, Direct2D offers a new API for loading images,
the [ID2D1ImageSource](https://msdn.microsoft.com/en-us/library/windows/desktop/dn900413(v=vs.85).aspx). The image
source improves upon existing image loading APIs including CreateBitmapFromWicBitmap, the Bitmap Source effect, and the
YCbCr effect.

The Direct2D image source combines the capabilities of these APIs with support for arbitrarily large images, easy
integration with printing and effects, and numerous optimizations including YCbCr JPEG and indexed JPEG.

We will talk about image loading in a later tutorial.

#### Ink Rendering

Starting in Windows 10, Direct2D provides a new primitive to represent ink strokes. Direct2D ink strokes are defined by
Bézier curves, support different nib shapes and transforms, and may have fixed or variable thickness.

###3 Effect Shader Linking
Direct2D effects are implemented using High-Level Shader Language pixel, vertex and compute shaders. Starting with
Windows 10, Direct2D now automatically analyzes effect graphs for opportunities to combine and execute individual
shaders together.

#### New Effects

In addition to the Effect Shader Linking, Direct2D also includes new built-in effects such as Sepia, Sharpen or
Grayscale effects. Check the MSDN for a complete list.

### Windows 10 Anniversary Update

With this update, Direct2D now supports rendering a wider variety of colour font formats as well as a wider array of
image effects, such as AlphaMasks and Tint effects.

### Windows 10 Creators Update

Starting in Windows 10 Creators Update, Direct2D provides improved colour management capabilities. More importantly,
Direct2D now supports parsing and drawing **SVG** images, allowing artists to render assets produced in their favourite
vector art tools without converting them to raster images first.

---

All in all, Direct2D got quite a few exciting updates. We will update our DirectX Game framework to use the latest
version of Direct2D, and through the Flatland tutorials we will learn how to use most of the features Direct2D provides.

## Efficiency

Although Direct2D is hardware accelerated and is meant for high-performance computing, its features must be used
correctly to maximize throughput. Here is a list of design philosophies that we should try to follow during the upcoming
tutorials.

### Resources

A resource is an allocation of some kind, either in video or system memory. Bitmaps and brushes are examples of
resources. In Direct2D, resources can be created both in software and hardware. Resource creation and deletion on
hardware are expensive operations because they require lots of overhead for communicating with the video card.

In Direct2D, all the rendering commands are, as we have already seen, enclosed between a call to BeginDraw and a call to
EndDraw. After BeginDraw is called, a context typically builds up a batch of rendering commands, but delays processing
of these commands until one of these statements is true:

- EndDraw occurred. When EndDraw is called, it causes any batched drawing operations to complete and returns the status
  of the operation.
- Flush is explicitly called: The Flush method causes the batch to be processed and all pending commands to be issued.
- The buffer holding the rendering commands is full. If this buffer becomes full before the previous two conditions are
  fulfilled, the rendering commands are flushed out.

Until the primitives are flushed, Direct2D keeps internal references to corresponding resources like bitmaps and
brushes.

#### Reuse Resources

As already mentioned, resource creation and deletion is expensive on hardware. So resources should be reused whenever
possible.

Take the example of bitmaps in a game. Usually, bitmaps that make up a scene in a game are all created at the same time,
with all the different variations that are required for later frame-to-frame rendering. At the time of actual scene
rendering and re-rendering, these bitmaps are reused instead of re-created.

Please note however that When a window is resized, some scale-dependent resources such as compatible render targets and
possibly some layer resources must be re-created because the window content has to be redrawn. This can be important for
maintaining the overall quality of the rendered scene.

### Don't Flush (too often)

Because the Flush method causes the batched rendering commands to be processed, it is recommended to not use it. For
most common scenarios, it is best to leave resource management to Direct2D.

## Bitmaps

As mentioned earlier, resource creation and deletion are costly operations in hardware. As bitmaps are used very
regularly, creating bitmaps on the video card is expensive. Reusing them can help speed up the application.

### Large Bitmaps

Video cards typically have a minimum memory allocation size. If an allocation is requested that is smaller than this, a
resource of this minimum size is allocated and the surplus memory is wasted and unavailable for other things.

If you many small bitmaps are needed, a better technique is to allocate one large bitmap and store all the small bitmap
contents in this large bitmap. Then subareas of the larger bitmap can be read where the smaller bitmaps are needed.

This is also known as an atlas, and it comes with the benefit of reducing bitmap creation overhead and the memory waste
of small bitmap allocations. It is recommended to keep most bitmaps to at least 64 KB and limit the number of bitmaps
that are smaller than 4 KB.

These small bitmaps can be pulled out of the larger bitmap when needed by specifying the destination rectangle. For
example, an application has to draw multiple icons. All the bitmaps associated with the icons can be loaded into a large
bitmap up front and at rendering time, they can be retrieved from the large bitmap.

Please not though that a Direct2D bitmap created in video memory is limited to the maximum bitmap size supported by the
adapter on which it is stored. Creating a bitmap larger than that might result in an error and remember that starting
with Windows 8, Direct2D actually provides
an [Atlas](https://msdn.microsoft.com/en-us/library/windows/desktop/hh780337(v=vs.85).aspx) effect.

### Shared Bitmaps

Creating shared bitmaps enables advanced callers to create Direct2D bitmap objects that are backed directly by an
existing object, already compatible with the render target. This avoids creating multiple surfaces and helps in reducing
performance overhead.

Shared bitmaps are usually limited to software targets or to targets interoperable with DXGI. The
CreateBitmapFromDxgiSurface, CreateBitmapFromWicBitmap, and CreateSharedBitmap methods can be used to create shared
bitmaps.

### Copying Bitmaps

Creating a DXGI surface is an expensive operation, so reuse existing surfaces when you can. Rendering is generally a
much more expensive operation than copying. This is because, to improve cache locality, the hardware doesn't actually
store a bitmap in the same memory order that the bitmap is addressed. Instead, the bitmap might be swizzled. The
swizzling is hidden from the CPU either by the driver (which is slow and used only on lower-end parts), or by the memory
manager on the GPU. Because of constraints on how data is written into a render target when rendering, render targets
are typically either not swizzled, or swizzled in a way that is less optimal than can be achieved if you know that you
never have to render to the surface. Therefore, the CopyFrom* methods are provided for copying rectangles from a source
to the Direct2D bitmap.

### Tiled Bitmaps over Dashing

Rendering a dashed line is an expensive operation because of the high quality and accuracy of the underlying algorithm.
For most of the cases not involving rectilinear geometries, the same effect can be generated faster by using tiled
bitmaps.

## Caching

When rendering the same content again and again, it is a good idea to cache the frame contents. There are three
available techniques to cache frames.

### Full scene caching using a color bitmap

When rendering static content, in scenarios like animation, creating another full colour bitmap instead of writing
directly to the screen bitmap is a lot more efficient.

### Per primitive caching using an A8 bitmap and the FillOpacityMask method

When the full scene is not static, but consists of elements like geometry or text that are static, a per primitive
caching technique can be used. This technique preserves the antialiasing characteristics of the primitive being cached
and works with changing brush types. It uses an A8 bitmap where A8 is a kind of pixel format which represents an alpha
channel with 8 bits. A8 bitmaps are useful for drawing geometry or text as a mask.

When the opacity of static content must be changed, instead of manipulating the content itself, the opacity of the mask
can be translated, rotated, skewed, or scaled.

### Per-primitive caching using geometry realizations

Another per-primitive caching technique,
called [geometry realizations](https://msdn.microsoft.com/en-us/library/windows/desktop/dn363632(v=vs.85).aspx),
provides greater flexibility when dealing with geometry. When repeatedly drawing aliased or anti-aliased geometries, it
is faster to convert them to geometry realizations and repeatedly draw the realizations than it is to repeatedly draw
the geometries themselves. Geometry realizations also generally consume less memory than opacity masks (especially for
large geometries), and they are less sensitive to changes in scale.

## Geometries

### Primitives over Geometries

When drawing geometries, it is more efficient to call DrawRectangle than DrawGeometry, as with DrawRectangle, the
geometry is already known, so rendering is faster.

### Static Geometries

In scenarios where the geometry is static, the per-primitive caching techniques explained above should be used. Opacity
masks and geometry realizations can greatly improve the rendering speed of scenes that contain static geometry.

## Multithreading

With the

*D2D1_DEVICE_CONTEXT_OPTIONS_ENABLE_MULTI_THREADED_OPTIMIZATIONS*

flag (which we set when we created our device), Direct2D will distribute rendering across all of the logical cores
present on the system, which can significantly decrease overall rendering time.

Note though that as of Windows 8.1 this only affects path geometries.

## Clipping

In Windows 8 many optimizations have been made to the usage of layers, and it is recommended to use layers instead of
FillGeometry whenever possible.

## Interoperability with Direct3D

As we have seen, Direct2D interoperates seamlessly with Direct3D surfaces. When rendering to a DXGI surface, Direct2D
saves the state of the Direct3D devices while rendering and restores it when rendering is completed. Every time that a
batch of Direct2D rendering is completed, the cost of this save and restore and the cost of flushing all the 2D
operations are paid, and yet, the Direct3D device is not flushed. Therefore, to increase performance, the number of
rendering switches between Direct2D and Direct3D must be limited.

## Pixel Formats

If a render target does not use the alpha channel, it should be created by using the D2D1_ALPHA_MODE_IGNORE alpha mode.
This spares the time that is spent on rendering an alpha channel that is not needed. We have followed this guideline
already in the DirectX Game Framework.

---

In the next tutorial, we will finally start using Direct2D to draw a few primitive geometries.

---

## References

* Microsoft Developer Network ([MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/ee663274(v=vs.85)))
* Wikipedia