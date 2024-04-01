---
title: Going Fullscreen
description: Most games are run in fullscreen, allowing players to fully immerge into the game world. This tutorial explains how to enumerate display modes, how to let the user chose his preferred display mode and how to maximize fullscreen performance.
---

> Of course Evil's afoot. If it had switched to the metric system it'd be up to a meter by now.
>
> – Jim Butcher

Why is there an entire tutorial about *going full-screen*? Can't we simply press *ALT+ENTER* and be done with it?
Unfortunately not, here is an explanation as to why, taken directly from
the [MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/bb205075%28v=vs.85%29.aspx#Debugging).

> When *IDXGISwapChain::Present* is called in a fullscreen application, the swap chain *flips*, and no longer *blits*,
> the contents of the back buffer to the front buffer. This requires that the swap chain was created by using an
> enumerated display mode, specified in *DXGI_SWAP_CHAIN_DESC*. If no valid display mode is specified, the swap chain may
> perform a bit-block transfer, which causes an extra stretching copy as well as some increased video memory usage, and is
> difficult to detect.

To avoid this problem, and to ensure maximal performance in full-screen, as well as to avoid extra memory overhead,
display modes should be enumerated before the swap chain is created. Thankfully, the swap chain was created with great
care in the previous tutorials, thus most of the hard work is already done. Remember that the desired screen resolution
is read from a configuration file and a call to *IDXGISwapChain::ResizeBuffers* resizes the back buffer to the size that
was passed as parameters in *WM_SIZE* each time the size of the window changes.

## Going Fullscreen

Actually going into full-screen mode is childishly easy: Since the swap chain was created with the
*DXGI_SWAP_CHAIN_FLAG_ALLOW_MODE_SWITCH* flag, all that needs to be done to go into full-screen is to actually press
*ALT+ENTER*.

To make sure that the application still exits gracefully, full-screen mode should be disabled before releasing all the
objects and allowing Windows to kill the window:

```cpp
Direct3D::~Direct3D()
{
	// switch to windowed mode before exiting the application
	swapChain->SetFullscreenState(false, nullptr);

	util::ServiceLocator::getFileLogger()->print<util::SeverityType::info>("Direct3D was shut down successfully.");
}
```

The first parameter of the
*[IDXGISwapChain::SetFullscreenState](https://msdn.microsoft.com/en-us/library/windows/desktop/bb174579(v=vs.85).aspx)*
method specifies the state the application should switch to and the second parameter refers to the video adapter to use.
This can be set to *nullptr* to let DirectX handle this (usually there will only be one available GPU anyway).

### Catching Fullscreen State Changes

To make sure we catch changes in the full-screen state of the window, we have to listen to yet another Windows event,
the [WM_WINDOWPOSCHANGED](https://msdn.microsoft.com/en-us/library/windows/desktop/ms632652(v=vs.85).aspx) message:

```cpp
LRESULT CALLBACK Window::msgProc(HWND hWnd, unsigned int msg, WPARAM wParam, LPARAM lParam)
{
	switch (msg)
    {
    
    ...
    
    case WM_WINDOWPOSCHANGED:
		// check for fullscreen switch
		if (dxApp->hasStarted)
		{
			BOOL fullscreen;
			dxApp->d3d->swapChain->GetFullscreenState(&fullscreen, nullptr);
			if (fullscreen != dxApp->d3d->currentlyInFullscreen)
			{
				// fullscreen mode changed, pause the application, resize everything and unpause the application again
				dxApp->isPaused = true;
				dxApp->timer->stop();
				dxApp->onResize();
				dxApp->timer->start();
				dxApp->isPaused = false;
			}
		}
		return 0;
    ...
    }
}
```

Each time the full-screen state of the window changes, all resources, especially the back buffers, must obviously be
resized as well.
The [IDXGISwapChain::GetFullscreenState](https://msdn.microsoft.com/en-us/library/windows/desktop/bb174574(v=vs.85).aspx)
method is rather self-explanatory.

### Starting in Fullscreen

To start the application in full-screen, a simple call of the SetFullscreenState method is enough:

```cpp
// set fullscreen mode?
if (startInFullscreen)
{
	// switch to fullscreen mode
	if (FAILED(swapChain->SetFullscreenState(true, nullptr)))
		return std::runtime_error("Unable to switch to fullscreen mode!");
}
```

To easily switch between starting in full-screen and in windowed mode, without having to recompile the entire project, a
variable was added to the LUA configuration file:

```lua
config =
{ 
	fullscreen = false,
	resolution = { width = 800, height = 600 }
}
```

## Supported Resolutions

Most games allow the player to choose his desired screen resolution and while we have no user interface yet, it is,
however, time to learn how to enumerate all the supported resolutions. For that, a few more member variables are needed
in the Direct3D class:

```cpp
class Direct3D
{
    ...
	// colour format
	DXGI_FORMAT desiredColourFormat;						// the desired colour format
	unsigned int numberOfSupportedModes;					// the number of supported screen modes for the desired colour format
	DXGI_MODE_DESC* supportedModes;							// list of all supported screen modes for the desired colour format
	DXGI_MODE_DESC  currentModeDescription;					// description of the currently active screen mode
    ...
}
```

The initialization process will change a little bit: Right after the creation of the swap chain, all supported modes
will be enumerated and stored in the *supportedModes* array.

To actually tackle that task, a representation of the output adapter, a
*[IDXGIOutput](https://msdn.microsoft.com/en-us/library/windows/desktop/bb174546(v=vs.85).aspx)* interface, which
represents the display adapter, is needed. Thankfully, DirectX offers the
*[IDXGISwapChain::GetContainingOutput](https://msdn.microsoft.com/en-us/en-en/library/windows/desktop/bb174571(v=vs.85).aspx)*
method to easily retrieve said adapter:

```cpp
HRESULT GetContainingOutput(
  [out] IDXGIOutput **ppOutput
);
```

As you can see, the method is completely straightforward to use:

```cpp
// get representation of the output adapter
IDXGIOutput *output = nullptr;
if (FAILED(swapChain->GetContainingOutput(&output)))
	return std::runtime_error("Unable to retrieve the output adapter!");
...
// release the output adapter
output->Release();
```

Now, to enumerate all supported screen resolutions, a query for the actual number of supported resolutions must be
completed first. Afterwards, a large enough array to hold all the mode descriptions will be created and filled. All of
that is done using the
*[IDXGIOutput::GetDisplayModeList](https://msdn.microsoft.com/en-us/library/windows/desktop/bb174549(v=vs.85).aspx)*
method:

```cpp
HRESULT GetDisplayModeList(
                  DXGI_FORMAT    EnumFormat,
                  UINT           Flags,
  [in, out]       UINT           *pNumModes,
  [out, optional] DXGI_MODE_DESC *pDesc
);
```

The first parameter specifies the colour format the application is using. The second parameter is optional, check the
MSDN for a list of all available flags.

The fourth parameter is optional, but important. If it is set to *NULL*, the third parameter is used as an output and
returns the actual number of supported modes. If the fourth parameter is not *NULL*, it returns the actual mode
descriptions of the supported modes, and the third parameter is then used as an input specifying the number of supported
modes.

This method can thus be used twice, once to get the number of supported modes and once to get the actual descriptions:

```cpp
util::Expected<void> Direct3D::createResources()
{
	// create the swap chain
       ...
		
    // enumerate all available display modes

	// get representation of the output adapter
	IDXGIOutput *output = nullptr;
	if (FAILED(swapChain->GetContainingOutput(&output)))
		return std::runtime_error("Unable to retrieve the output adapter!");

	// get the amount of supported display modes for the desired format
	if (FAILED(output->GetDisplayModeList(desiredColourFormat, 0, &numberOfSupportedModes, NULL)))
		return std::runtime_error("Unable to list all supported display modes!");

	// set up array for the supported modes
	supportedModes = new DXGI_MODE_DESC[numberOfSupportedModes];
	ZeroMemory(supportedModes, sizeof(DXGI_MODE_DESC) * numberOfSupportedModes);

	// fill the array with the available display modes
	if (FAILED(output->GetDisplayModeList(desiredColourFormat, 0, &numberOfSupportedModes, supportedModes)))
		return std::runtime_error("Unable to retrieve all supported display modes!");

	// release the output adapter
	output->Release();

	// if the current resolution is not supported, switch to the lowest supported resolution
	bool supportedMode = false;
	for (unsigned int i = 0; i < numberOfSupportedModes; i++)
		if ((unsigned int)dxApp->appWindow->clientWidth == supportedModes[i].Width && dxApp->appWindow->clientHeight == supportedModes[i].Height)
		{
			supportedMode = true;
			currentModeDescription = supportedModes[i];
			break;
		}
        
	if (!supportedMode)
	{
		// print a warning 
		util::ServiceLocator::getFileLogger()->print<util::SeverityType::warning>("The desired screen resolution is not supported! Resizing...");

		// set the mode to the lowest supported resolution
		currentModeDescription = supportedModes[0];
		if (FAILED(swapChain->ResizeTarget(&currentModeDescription)))
			return std::runtime_error("Unable to resize target to a supported display mode!");

		// write the current mode to the configuration file
		if (!writeCurrentModeDescriptionToConfigurationFile().wasSuccessful())
			return std::runtime_error("Unable to write to the configuration file!");
	}

	// the remaining steps need to be done each time the window is resized
	if (!onResize().wasSuccessful())
		return std::runtime_error("Direct3D was unable to resize its resources!");

	// return success
	return {};
}
```

Note that once all the supported display modes are enumerated, it is easy to check whether the resolution the window was
created with is supported or not. If the resolution is supported, then nothing needs to be done besides storing the
current window resolution as the current display mode. Else, the lowest supported resolution will be chosen as the
current resolution and written to the configuration file, such that when the game starts the next time, the initial
window will be created with a supported screen resolution.

---

Now the only thing left to do is to resize the target to the selected screen resolution, which is done by using the
*[ResizeTarget](https://msdn.microsoft.com/en-us/en-en/library/windows/desktop/bb174578(v=vs.85).aspx)* method:

```cpp
// resize target
if (FAILED(swapChain->ResizeTarget(&currentModeDescription)))
	return std::runtime_error("Unable to resize target!");
```

Please note that for now, if the window is dragged and resized, the *ResizeTarget* method restores the window to the
original resolution, once the dragging stops. This is working as intended, as there is no real need for arbitrary screen
resolutions in full-screen games.

## Dynamic Screen Resolution

To prepare to be able to change the resolution to whatever resolution the player choses (as long as it is supported; and
once we have an user interface), a few more variables have to be added to the Direct3D class to actually track
resolution changes:

```cpp
...
// screen modes
DXGI_FORMAT desiredColourFormat;						// the desired colour format
unsigned int numberOfSupportedModes;					// the number of supported screen modes for the desired colour format
DXGI_MODE_DESC* supportedModes;							// list of all supported screen modes for the desired colour format
DXGI_MODE_DESC  currentModeDescription;					// description of the currently active screen mode
unsigned int currentModeIndex;							// the index of the current mode in the list of all supported screen modes
bool startInFullscreen;									// true iff the game should start in fullscreen mode
BOOL currentlyInFullscreen;								// true iff the game is currently in fullscreen mode
bool changeMode;										// true iff the screen resolution should be changed this frame

// functions to change screen resolutions
void changeResolution(bool increase);					// changes the screen resolution, if increase is true, a higher resolution is chosen, else the resolution is lowered; returns true iff the screen resolution should be changed
...
```

Since there is no user interface yet, we will use the *PAGE_UP* and *PAGE_DOWN* keys to change resolutions:

```cpp
void DirectXApp::onKeyDown(WPARAM wParam, LPARAM /*lParam*/)
{
	switch (wParam)
	{
	case VK_F1:
		showFPS = !showFPS;
		break;

	case VK_ESCAPE:
		PostMessage(appWindow->mainWindow, WM_CLOSE, 0, 0);
		break;

	case VK_PRIOR:	
		// page up -> chose higher resolution
		d3d->changeResolution(true);

	case VK_NEXT:
		// page down -> chose lower resolution
		d3d->changeResolution(false);

	default: break;
	}
}
```

The *changeResolution* method is very simple, as all that needs to be done is to increase or decrease the index of the
desired screen mode:

```cpp
void Direct3D::changeResolution(bool increase)
{
	if (increase)
	{
		// if increase is true, choose a higher resolution, if possible
		if (currentModeIndex < numberOfSupportedModes - 1)
		{
			currentModeIndex++;
			changeMode = true;
		}
		else
			changeMode = false;
	}
	else
	{
		// else choose a smaller resolution, but only if possible
		if (currentModeIndex > 0)
		{
			currentModeIndex--;
			changeMode = true;
		}
		else
			changeMode = false;
	}

	if (changeMode)
	{
		// change mode
		currentModeDescription = supportedModes[currentModeIndex];

		// resize everything
		onResize();
	}
}
```

Take attention though, once the mode changes, all resources, especially the back buffers, must be resized to the new
screen resolution as well, else the application will be hit by **massive FPS drops**, as explained in the introduction
of this tutorial.

And here is the updated *onResize* function:

```cpp
util::Expected<void> Direct3D::onResize()
{
	// Microsoft recommends zeroing out the refresh rate of the description before resizing the targets
	DXGI_MODE_DESC zeroRefreshRate = currentModeDescription;
	zeroRefreshRate.RefreshRate.Numerator = 0;
	zeroRefreshRate.RefreshRate.Denominator = 0;

	// check for fullscreen switch
	BOOL inFullscreen = false;
	swapChain->GetFullscreenState(&inFullscreen, NULL);

	if (currentlyInFullscreen != inFullscreen)
	{
		// fullscreen switch
		if (inFullscreen)
		{
			// switched to fullscreen -> Microsoft recommends resizing the target before going into fullscreen
			if (FAILED(swapChain->ResizeTarget(&zeroRefreshRate)))
				return std::runtime_error("Unable to resize target!");

			// set fullscreen state
			if (FAILED(swapChain->SetFullscreenState(true, nullptr)))
				return std::runtime_error("Unable to switch to fullscreen mode!");
		}
		else
		{
			// switched to windowed -> simply set fullscreen mode to false
			if (FAILED(swapChain->SetFullscreenState(false, nullptr)))
				return std::runtime_error("Unable to switch to windowed mode mode!");

			// recompute client area and set new window size
			RECT rect = { 0, 0, (long)dxApp->d3d->currentModeDescription.Width,  (long)dxApp->d3d->currentModeDescription.Height };
			if (FAILED(AdjustWindowRectEx(&rect, WS_OVERLAPPEDWINDOW, false, WS_EX_OVERLAPPEDWINDOW)))
				return std::runtime_error("Failed to adjust window rectangle!");
			SetWindowPos(dxApp->appWindow->mainWindow, HWND_TOP, 0, 0, rect.right - rect.left, rect.bottom - rect.top, SWP_NOMOVE);
		}

		// change fullscreen mode
		currentlyInFullscreen = !currentlyInFullscreen;
	}
				
	// resize target to the desired resolution
	if (FAILED(swapChain->ResizeTarget(&zeroRefreshRate)))
		return std::runtime_error("Unable to resize target!");

	// release and reset all resources
	if (dxApp->d2d)
		dxApp->d2d->devCon->SetTarget(nullptr);

	devCon->ClearState();
	renderTargetView = nullptr;
	depthStencilView = nullptr;
		
	// resize the swap chain
	if(FAILED(swapChain->ResizeBuffers(0, 0, 0, DXGI_FORMAT_UNKNOWN, DXGI_SWAP_CHAIN_FLAG_ALLOW_MODE_SWITCH)))
		return std::runtime_error("Direct3D was unable to resize the swap chain!");

	// (re)-create the render target view
	Microsoft::WRL::ComPtr<ID3D11Texture2D> backBuffer;
	if (FAILED(swapChain->GetBuffer(0, __uuidof(ID3D11Texture2D), reinterpret_cast<void**>(backBuffer.GetAddressOf()))))
		return std::runtime_error("Direct3D was unable to acquire the back buffer!");
	if (FAILED(dev->CreateRenderTargetView(backBuffer.Get(), NULL, &renderTargetView)))
		return std::runtime_error("Direct3D was unable to create the render target view!");

	// create the depth and stencil buffer
    ...
    
	// activate the depth and stencil buffer
	...
    
    // set the viewport to the entire backbuffer
	...
    
	// (re)-create the Direct2D target bitmap associated with the swap chain back buffer and set it as the current target
	...
    
    // re-initialize GPU pipeline
	initPipeline();

	// log and return success
    ...
    
    return {};
}
```

---

We have not mentioned a borderless full-screen mode, useful when running a multiple monitor setup, but I believe that is
a topic for a later time, as for now we want to concentrate on programming a game.

Enjoy the star field from the previous tutorial in glorious full-screen mode!

![Starfield in Fullscreen](../../../../../assets/gamedev/directx/fullscreen.webp)

---

The source code is
available [here](https://filedn.eu/ltgnTcOBnsYpGSo6BiuFrPL/Game%20Programming/Fundamentals/DirectX/fullscreen.7z).

---

The next tutorial will simply be an overview over the first DirectX-framework we have created so far.

## References

* Tricks of the Windows Game Programming Gurus, by André LaMothe
* Microsoft Developer Network ([MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/ee663274(v=vs.85)))
