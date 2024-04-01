---
title: Viewports and Render Targets
description: This tutorial explains how to set up renders targets and viewpoints in DirectX 11.
---

> There are a dozen views about everything until you know the answer. Then there's never more than one.
>
> – C.S. Lewis, That Hideous Strength

Now that the swap chain is set up, the GPU must be told where exactly it should draw. More precisely,
a [viewport](https://en.wikipedia.org/wiki/Viewport),
for [clipping](https://en.wikipedia.org/wiki/Clipping_%28computer_graphics%29), for example, and
a [depth](https://en.wikipedia.org/wiki/Z-buffering)/[stencil](https://en.wikipedia.org/wiki/Stencil_buffer) buffer,
must be defined.

This tutorial will focus on how to initialize the viewport and the depth/stencil buffer, but any etails about how to use
them, will be postponed to later tutorials. As an example though, the stencil buffer could be used to add shadows to 3D
objects or to create motion blur effects.

For now, we simply want to render to the backbuffer.

## The Render Target View

When rendering in Direct3D, DirectX must know where exactly to render to. The render target view is a COM object that
maintains a location in video memory to render into. In most cases this will be the back buffer. Here is how the render
target view can be created:

```cpp
class Direct3D
{
...
	Microsoft::WRL::ComPtr<ID3D11RenderTargetView> renderTargetView;
...
}
```

```cpp
util::Expected<void> Direct3D::onResize()
{
	// resize the swap chain
	if(FAILED(swapChain->ResizeBuffers(0, 0, 0, desiredColourFormat, 0)))
		return std::runtime_error("Direct3D was unable to resize the swap chain!");

	// (re)-create the render target view
	Microsoft::WRL::ComPtr<ID3D11Texture2D> backBuffer;
	if (FAILED(swapChain->GetBuffer(0, __uuidof(ID3D11Texture2D), reinterpret_cast<void**>(backBuffer.GetAddressOf()))))
		return std::runtime_error("Direct3D was unable to acquire the back buffer!");
	if (FAILED(dev->CreateRenderTargetView(backBuffer.Get(), 0, &renderTargetView)))
		return std::runtime_error("Direct3D was unable to create the render target view!");

	// return success
	return {};
}
```

That was rather easy, but we will quickly explain each step:

### [GetBuffer](https://msdn.microsoft.com/en-us/library/windows/desktop/bb174570%28v=vs.85%29.aspx)

Using the IDXGISwapChain::GetBuffer function it is possible to obtain a pointer to the current backbuffer in the swap
chain.

```cpp
HRESULT GetBuffer(
        UINT   Buffer,
  [in]  REFIID riid,
  [out] void   **ppSurface
);
```

The first parameter specifies the index of which backBuffer to use. As we created the swap chain with the swap effect
*DXGI_SWAP_EFFECT_FLIP_DISCARD*, *GetBuffer* can only access the *zero-th* buffer for read and write access - thus, for
our situation, we have to set this to zero.

The second parameter is the interface type of the back buffer which will be a 2D-texture in most cases.

The last parameter returns a pointer to the actual back buffer.

### [CreateRenderTargetView](https://msdn.microsoft.com/en-us/library/windows/desktop/ff476517%28v=vs.85%29.aspx)

```cpp
HRESULT CreateRenderTargetView(
  [in]                  ID3D11Resource                *pResource,
  [in, optional]  const D3D11_RENDER_TARGET_VIEW_DESC *pDesc,
  [out, optional]       ID3D11RenderTargetView        **ppRTView
);
```

This function creates the render target view.

The first parameter specifies the resource the render target is created for.

The second parameter is a pointer to a *D3D11_RENDER_TARGET_VIEW_DESC*, which, among other things, describes the data
type, or format, of the elements in the specified resource (first parameter). We declared our back buffer to have a
typed format, and thus we can set this parameter to NULL, which tells DirectX to create a view to the first mipmap level
of the specified resource. Do not worry, mipmaps will be covered in a later tutorial, for now, we can safely set this to
NULL.

The third parameter returns a pointer to the created render target view.

## The Depth/Stencil Buffer

The depth/stencil buffer basically is a 2D-texture that stores the depth information of the pixels to render. To create
this texture, once again a structure description, namely
an [ID3D11_TEXTURE2D_DESC](https://msdn.microsoft.com/en-us/library/windows/desktop/ff476253%28v=vs.85%29.aspx), must be
filled out:

```cpp
typedef struct D3D11_TEXTURE2D_DESC {
  UINT             Width;
  UINT             Height;
  UINT             MipLevels;
  UINT             ArraySize;
  DXGI_FORMAT      Format;
  DXGI_SAMPLE_DESC SampleDesc;
  D3D11_USAGE      Usage;
  UINT             BindFlags;
  UINT             CPUAccessFlags;
  UINT             MiscFlags;
} D3D11_TEXTURE2D_DESC;
```

### UINT Width and UINT Height

The width and height of the texture in texels.

### UINT MipLevels

Mipmaps will be covered in later tutorials. Just know for now that to create a depth/stencil buffer, a two dimensional
texture with a mipmap level of one is necessary.

### UINT ArraySize

The number of textures in the texture array. Only one texture is needed for the depth/stencil buffer.

### [DXGI_FORMAT](https://msdn.microsoft.com/en-us/library/windows/desktop/bb173059(v=vs.85).aspx) Format

For our depth/stencil buffer we will set this to DXGI_FORMAT_D24_UNORM_S8_UINT. Again, the details will be covered in a
later tutorial. For now, it is enough to know that a structure format which uses 24-bits for the depth buffer and 8-bits
for the stencil buffer is requested.

### [DXGI_SAMPLE_DESC](https://msdn.microsoft.com/en-us/library/windows/desktop/bb173072%28v=vs.85%29.aspx) SampleDesc

We have seen this structure before, it is used to specify how multi-sampling or anti-aliasing is done. It should be
clear that those settings for the depth/stencil buffer must match the settings for the render target.

### [D3D11_USAGE](https://msdn.microsoft.com/en-us/library/windows/desktop/ff476259%28v=vs.85%29.aspx) Usage

This member identifies how the texture is to be read from and written to. For our depth/stencil buffer we use
*D3D11_USAGE_DEFAULT*, which tells DirectX that the GPU, and only the GPU, will be reading from and writing to the
resource.

### UINT [BindFlags](https://msdn.microsoft.com/en-us/library/windows/desktop/ff476085%28v=vs.85%29.aspx)

Those flags are various options for how to bind to the different pipeline stages; the pipeline will be covered in later
tutorials. For our depth/stencil buffer, we have to use the *D3D11_BIND_DEPTH_STENCIL* flag.

### UINT [CPUAccessFlags](https://msdn.microsoft.com/en-us/library/windows/desktop/ff476106%28v=vs.85%29.aspx)

These flags specify how the CPU may access the resource. Since in this intended usage scenario, only the GPU needs to
access the texture, we can set this to zero.

### UINT [MiscFlags](https://msdn.microsoft.com/en-us/library/windows/desktop/ff476203%28v=vs.85%29.aspx)

Those are advanced options which we currently do not need.

---

I am starting to like those texture descriptions, we can simply tell DirectX all of our wishes and Microsoft will grant
them to us!

Here is the program code to specify a depth/stencil buffer description:

```cpp
// create the depth and stencil buffer
D3D11_TEXTURE2D_DESC dsd;
ComPtr<ID3D11Texture2D> dsBuffer;
backBuffer->GetDesc(&dsd);
dsd.Format = DXGI_FORMAT_D24_UNORM_S8_UINT;
dsd.Usage = D3D11_USAGE_DEFAULT;
dsd.BindFlags = D3D11_BIND_DEPTH_STENCIL;
```

Notice that we used the *[GetDesc](https://msdn.microsoft.com/en-us/library/windows/desktop/ff476636(v=vs.85).aspx)*
method to acquire the description of the back buffer, which filled out most of the depth/stencil buffer description.

All that is now left to do is to actually create the depth/stencil-buffer, and that is surprisingly easy to do:

```cpp
class Direct3D
{
...
	Microsoft::WRL::ComPtr<ID3D11DepthStencilView> depthStencilView;	// the depth and stencil buffer
}

void Direct3D::onResize()
{
...
	if (FAILED(dev->CreateTexture2D(&dsd, NULL, dsBuffer.GetAddressOf())))
		return std::runtime_error("Direct3D was unable to create a 2D-texture!");
	if (FAILED(dev->CreateDepthStencilView(dsBuffer.Get(), NULL, depthStencilView.GetAddressOf())))
		return std::runtime_error("Direct3D was unable to create the depth and stencil buffer!");
...
}
```

## [CreateTexture2D](https://msdn.microsoft.com/en-us/library/windows/desktop/ff476521(v=vs.85).aspx)

To create the texture with the desired specifications, the *ID3D11Device::CreateTexture2D* method was used:

```cpp
HRESULT CreateTexture2D(
  [in]            const D3D11_TEXTURE2D_DESC   *pDesc,
  [in, optional]  const D3D11_SUBRESOURCE_DATA *pInitialData,
  [out, optional]       ID3D11Texture2D        **ppTexture2D
);
```

<p></p>

The first parameter is the texture description.

The second parameter is a pointer to the initial data that the resource should be filled with. Since we are using the
texture as a depth/stencil-buffer, it needs not to be filled with any initial data, and thus this parameter can safely
be set to NULL.

The last parameter returns a pointer to the depth/stencil-buffer.

## [CreateDepthStencilView](https://msdn.microsoft.com/en-us/library/windows/desktop/ff476507(v=vs.85).aspx)

To finally create the depth/stencil-view, we used the *ID3D11Device::CreateDepthStencilView* method:

```cpp
HRESULT CreateDepthStencilView(
  [in]                  ID3D11Resource                *pResource,
  [in, optional]  const D3D11_DEPTH_STENCIL_VIEW_DESC *pDesc,
  [out, optional]       ID3D11DepthStencilView        **ppDepthStencilView
);
```

The first parameter is a pointer to the depth/stencil-buffer resource we just created.

The second parameter is a pointer to a
*[D3D11_DEPTH_STENCIL_VIEW_DESC](https://msdn.microsoft.com/en-us/library/windows/desktop/ff476112%28v=vs.85%29.aspx)*
structure. Setting this parameter to NULL creates a view that accesses mipmap level 0 of the entire resource using the
format the resource was created with. This is what we wanted.

The last parameter returns the address of a pointer to the created depth/stencil-view.

## Setting the Render Target

Now with the render target and depth/stencil views created, they can be activated by using
the [ID3D11DeviceContext::OMSetRenderTargets](https://msdn.microsoft.com/en-us/library/windows/desktop/ff476464%28v=vs.85%29.aspx)
function:

```cpp
// activate the depth and stencil buffer
devCon->OMSetRenderTargets(1, renderTargetView.GetAddressOf(), depthStencilView.Get());
```

The first parameter of the function is the number of render targets that we want to set. For now, we only intend to set
one render target, and thus we set this value to one. Rendering simultaneously to several render targets is a rather
advanced technique that we won't cover until way later.

The second parameter is a pointer to the first element in a list of render target view pointers. Again, we only have one
render target view, and thus we can simply input the address of our render target view interface here.

The third parameter is a pointer to the depth/stencil-view.

## Setting the Viewport

To tell DirectX what area of the backbuffer to render into, yet another structure must be filled out, the
*[D3D11_VIEWPORT](https://msdn.microsoft.com/en-us/library/windows/desktop/ff476260(v=vs.85).aspx)* description:

```cpp
typedef struct D3D11_VIEWPORT {
  FLOAT TopLeftX;
  FLOAT TopLeftY;
  FLOAT Width;
  FLOAT Height;
  FLOAT MinDepth;
  FLOAT MaxDepth;
} D3D11_VIEWPORT;
```

The first four floats define the viewport rectangle (relative to the client window rectangle). For now, we will just set
this to the entire client area, since we want to be able to draw on the entire window.

The MinDepth and MaxDepth members specify the minimal and maximal depth buffer values, which will be set to zero and one
for now.

```cpp
void Direct3D::onResize()
{
...
    // set the viewport to the entire back-buffer
	D3D11_VIEWPORT vp;
	vp.TopLeftX = 0;
	vp.TopLeftY = 0;
	vp.Width = (float)dsd.Width;
	vp.Height = (float)dsd.Height;
	vp.MinDepth = 0.0f;
	vp.MaxDepth = 1.0f;
...
}
```

To set the viewport, we can use
the [ID3D11DeviceContext::RSSetViewports](https://msdn.microsoft.com/en-us/library/windows/desktop/ff476480(v=vs.85).aspx)
method:

```cpp
void RSSetViewports(
  [in]                 UINT           NumViewports,
  [in, optional] const D3D11_VIEWPORT *pViewports
);
```

The first parameter is the number of viewports to use, and the second parameter is a pointer to an array of viewports.
For example, we could use multiple viewports to implement a split-screen view like in the good old Nintendo times. In a
later tutorial, we will also see how to use multiple viewports to create a user-interface. But for now, we will just set
the viewport to the only one we have created so far:

```cpp
devCon->RSSetViewports(1, &vp);
```

## Clearing the Back and Depth Buffers

What is left to do now is to clear the back and depth/stencil buffers after each frame so that new scenes can be
rendered without any leftover artefacts.

To clear the back buffer, it is enough to simply fill the entire back buffer with a single colour using
the [ID3D11DeviceContext::ClearRenderTargetView](https://msdn.microsoft.com/en-us/library/windows/desktop/ff476388%28v=vs.85%29.aspx)
method, which sets each pixel in a render target view to a specified colour:

```cpp
void ClearRenderTargetView(
  [in]       ID3D11RenderTargetView *pRenderTargetView,
  [in] const FLOAT                  ColorRGBA[4]
);
```

The first parameter is the address of the render target interface.

The second parameter is an array with four elements, specifying the colour in RGBA format.

---

To clear the depth/stencil-buffer,
the [ID3D11DeviceContext::ClearDepthStencilView method](https://msdn.microsoft.com/en-us/library/windows/desktop/ff476387%28v=vs.85%29.aspx)
can be used:

```cpp
void ClearDepthStencilView(
  [in] ID3D11DepthStencilView *pDepthStencilView,
  [in] UINT                   ClearFlags,
  [in] FLOAT                  Depth,
  [in] UINT8                  Stencil
);
```

### ID3D11DepthStencilView *pDepthStencilView

This is a pointer to the depth and stencil buffer to be cleared.

### UINT [ClearFlags](https://msdn.microsoft.com/en-us/library/windows/desktop/ff476099(v=vs.85).aspx)

These flags identify the type of data to clear. The possible values are *D3D11_CLEAR_DEPTH* and *D3D11_CLEAR_STENCIL*.
We will obviously *or* them.

### FLOAT Depth

This specifies the value to override the entire depth buffer with. This value will be clamped between $0$ and $1$. We
will use 1.0f (the *empty* background really is in the background of the scene).

### UINT8 Stencil

This specifies the value to override the stencil buffer with. We set this to 0 for now, and we will talk more about this
in a later section.

---

Here is the code to clear our buffers:

```cpp
void Direct3D::clearBuffers()
{
	// clear the back buffer and depth / stencil buffer
	float black[] = { 0.0f, 0.0f, 1.0f, 0.0f };
	devCon->ClearRenderTargetView(renderTargetView.Get(), black);
	devCon->ClearDepthStencilView(depthStencilView.Get(), D3D11_CLEAR_DEPTH | D3D11_CLEAR_STENCIL, 1.0f, 0);
}
```

---

## Putting It All Together

Here is the updated Direct3D class:

```cpp
class Direct3D
{
private:
	// members
	core::DirectXApp* dxApp;								// pointer to the main application class

	// Direct3D
	Microsoft::WRL::ComPtr<ID3D11Device> dev;							// the actual Direct3D device
	Microsoft::WRL::ComPtr<ID3D11DeviceContext> devCon;					// its context
	Microsoft::WRL::ComPtr<IDXGISwapChain> swapChain;					// the swap chain
	Microsoft::WRL::ComPtr<ID3D11RenderTargetView> renderTargetView;	// the rendering target
	Microsoft::WRL::ComPtr<ID3D11DepthStencilView> depthStencilView;	// the depth and stencil buffer

	// colour format
	DXGI_FORMAT desiredColourFormat;						// the desired colour format

	// functions to create resources
	util::Expected<void> createResources();					// create device resources, such as the swap chain
	util::Expected<void> onResize();						// resize the resources

public:
	// constructor
	Direct3D(core::DirectXApp* dxApp);
	~Direct3D();

	// present the scene
	void clearBuffers();									// clear the back and depth/stencil buffers
	util::Expected<int> present();							// present the chain, by flipping the buffers

	friend class core::DirectXApp;
};
```

And its implementation:

```cpp
/////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////// Constructor //////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
Direct3D::Direct3D(core::DirectXApp* dxApp) : dxApp(dxApp), desiredColourFormat(DXGI_FORMAT_B8G8R8A8_UNORM)
{
	HRESULT hr;

	// define device creation flags,  D3D11_CREATE_DEVICE_BGRA_SUPPORT needed to get Direct2D interoperability with Direct3D resources
	unsigned int createDeviceFlags = D3D11_CREATE_DEVICE_BGRA_SUPPORT;

	// if in debug mode, create device with debug layer
#ifndef NDEBUG
	createDeviceFlags |= D3D11_CREATE_DEVICE_DEBUG;
#endif

	// create the device
	D3D_FEATURE_LEVEL featureLevel;
	hr = D3D11CreateDevice(NULL, D3D_DRIVER_TYPE_HARDWARE, 0, createDeviceFlags, NULL, 0, D3D11_SDK_VERSION, &dev, &featureLevel, &devCon);

	if (FAILED(hr))
	{
		util::ServiceLocator::getFileLogger()->print<util::SeverityType::error>("The creation of the Direct3D device and its context failed!");
		throw std::runtime_error("Unable to create the Direct3D device and its context!");
	}
	else if (featureLevel < D3D_FEATURE_LEVEL_11_0)
	{
		util::ServiceLocator::getFileLogger()->print<util::SeverityType::error>("Critical error: DirectX 11 is not supported by your GPU!");
		throw std::runtime_error("Unable to create the Direct3D device and its context!");
	}

	// now that the device and its context are available, create further resouces
	if (!createResources().wasSuccessful())
	{
		util::ServiceLocator::getFileLogger()->print<util::SeverityType::error>("Critical error: Creation of Direct3D resources failed!");
		throw std::runtime_error("Creation of Direct3D resources failed!");
	}

	//  log success
	util::ServiceLocator::getFileLogger()->print<util::SeverityType::info>("Direct3D was initialized successfully.");
}

Direct3D::~Direct3D()
{
	util::ServiceLocator::getFileLogger()->print<util::SeverityType::info>("Direct3D was shut down successfully.");
}

/////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////// Resource Creation ////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
util::Expected<void> Direct3D::createResources()
{
	// create the swap chain

	// fill in the swap chain description
	DXGI_SWAP_CHAIN_DESC scd;
	scd.BufferDesc.Width = 0;													// width of the back buffer
	scd.BufferDesc.Height = 0;													// height
	scd.BufferDesc.RefreshRate.Numerator = 0;									// refresh rate: 0 -> do not care
	scd.BufferDesc.RefreshRate.Denominator = 1;					
	scd.BufferDesc.Format = desiredColourFormat;								// the color palette to use								
	scd.BufferDesc.ScanlineOrdering = DXGI_MODE_SCANLINE_ORDER_UNSPECIFIED;		// unspecified scan line ordering
	scd.BufferDesc.Scaling = DXGI_MODE_SCALING_UNSPECIFIED;						// unspecified scaling
	scd.SampleDesc.Count = 1;													// disable msaa
	scd.SampleDesc.Quality = 0;
	scd.BufferUsage = DXGI_USAGE_RENDER_TARGET_OUTPUT;							// use back buffer as render target
	scd.BufferCount = 3;														// the number of buffers in the swap chain (including the front buffer)
	scd.OutputWindow = dxApp->appWindow->getMainWindowHandle();					// set the main window as output target
	scd.Windowed = true;														// windowed, not fullscreen$
	scd.SwapEffect = DXGI_SWAP_EFFECT_FLIP_DISCARD;								// flip mode and discared buffer after presentation
	scd.Flags = DXGI_SWAP_CHAIN_FLAG_ALLOW_MODE_SWITCH;							// allow mode switching

	// get the DXGI factory
	Microsoft::WRL::ComPtr<IDXGIDevice> dxgiDevice;
	Microsoft::WRL::ComPtr<IDXGIAdapter> dxgiAdapter;
	Microsoft::WRL::ComPtr<IDXGIFactory> dxgiFactory;

	// first, retrieve the underlying DXGI device from the Direct3D device
	HRESULT hr = dev.As(&dxgiDevice);
	if (FAILED(hr))
		return std::runtime_error("The Direct3D device was unable to retrieve the underlying DXGI device!");

	// now identify the physical GPU this device is running on
	hr = dxgiDevice->GetAdapter(dxgiAdapter.GetAddressOf());
	if (FAILED(hr))
		return std::runtime_error("The DXGI Device was unable to get the GPU adapter!");

	// finally retrieve the factory
	hr = dxgiAdapter->GetParent(__uuidof(IDXGIFactory), &dxgiFactory);
	if (FAILED(hr))
		return std::runtime_error("The DXGI Adapter was unable to get the factory!");

	// create the actual swap chain
	hr = dxgiFactory->CreateSwapChain(dev.Get(), &scd, swapChain.GetAddressOf());
	if (FAILED(hr))
		return std::runtime_error("The creation of the swap chain failed!");

	// the remaining steps need to be done each time the window is resized
	if (!onResize().wasSuccessful())
		return std::runtime_error("Direct3D was unable to resize its resources!");

	// return success
	return {};
}

util::Expected<void> Direct3D::onResize()
{
    devCon->ClearState();
	renderTargetView = nullptr;
	depthStencilView = nullptr;

	// resize the swap chain
	if(FAILED(swapChain->ResizeBuffers(0, 0, 0, desiredColourFormat, 0)))
		return std::runtime_error("Direct3D was unable to resize the swap chain!");

	// (re)-create the render target view
	Microsoft::WRL::ComPtr<ID3D11Texture2D> backBuffer;
	if (FAILED(swapChain->GetBuffer(0, __uuidof(ID3D11Texture2D), reinterpret_cast<void**>(backBuffer.GetAddressOf()))))
		return std::runtime_error("Direct3D was unable to acquire the back buffer!");
	if (FAILED(dev->CreateRenderTargetView(backBuffer.Get(), NULL, &renderTargetView)))
		return std::runtime_error("Direct3D was unable to create the render target view!");

	// create the depth and stencil buffer
	D3D11_TEXTURE2D_DESC dsd;
	Microsoft::WRL::ComPtr<ID3D11Texture2D> dsBuffer;
	backBuffer->GetDesc(&dsd);
	dsd.Format = DXGI_FORMAT_D24_UNORM_S8_UINT;
	dsd.Usage = D3D11_USAGE_DEFAULT;
	dsd.BindFlags = D3D11_BIND_DEPTH_STENCIL;
	if (FAILED(dev->CreateTexture2D(&dsd, NULL, dsBuffer.GetAddressOf())))
		return std::runtime_error("Direct3D was unable to create a 2D-texture!");
	if (FAILED(dev->CreateDepthStencilView(dsBuffer.Get(), NULL, depthStencilView.GetAddressOf())))
		return std::runtime_error("Direct3D was unable to create the depth and stencil buffer!");

	// activate the depth and stencil buffer
	devCon->OMSetRenderTargets(1, renderTargetView.GetAddressOf(), depthStencilView.Get());

	// set the viewport to the entire backbuffer
	D3D11_VIEWPORT vp;
	vp.TopLeftX = 0;
	vp.TopLeftY = 0;
	vp.Width = (float)dsd.Width;
	vp.Height = (float)dsd.Height;
	vp.MinDepth = 0.0f;
	vp.MaxDepth = 1.0f;
	devCon->RSSetViewports(1, &vp);

	// return success
	return {};
}

/////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////// Scene Presentation ///////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
void Direct3D::clearBuffers()
{devCon->ClearState();
		renderTargetView = nullptr;
		depthStencilView = nullptr;

	// clear the back buffer and depth / stencil buffer
	float black[] = { 0.0f, 0.0f, 0.0f, 0.0f };
	devCon->ClearRenderTargetView(renderTargetView.Get(), black);
	devCon->ClearDepthStencilView(depthStencilView.Get(), D3D11_CLEAR_DEPTH | D3D11_CLEAR_STENCIL, 1.0f, 0);
}

util::Expected<int> Direct3D::present()
{
	HRESULT hr = swapChain->Present(0, DXGI_PRESENT_DO_NOT_WAIT);
	if (FAILED(hr) && hr != DXGI_ERROR_WAS_STILL_DRAWING)
	{	
		util::ServiceLocator::getFileLogger()->print<util::SeverityType::error>("The presentation of the scene failed!");
		return std::runtime_error("Direct3D failed to present the scene!");
	}

	// return success
	return 0;
}
```

The new *render* method in the derived *DirectXGame* class now looks like this:

```cpp
util::Expected<int> DirectXGame::render(double farSeer)
{
	// clear the back buffer and the depth/stencil buffer
	d3d->clearBuffers();

	// render

	// present the scene
	if (!d3d->present().wasSuccessful())
		return std::runtime_error("Failed to present the scene!");

	// return success
	return 0;
}
```

---

You can download the source code
from [here](https://filedn.eu/ltgnTcOBnsYpGSo6BiuFrPL/Game%20Programming/Fundamentals/DirectX/renderTargets.7z).

---

In the next tutorial, we will learn how to use DirectWrite to print text to our game window.

## References

* Tricks of the Windows Game Programming Gurus, by André LaMothe
* Microsoft Developer Network ([MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/ee663274(v=vs.85)))

#gamedev #directx #viewports