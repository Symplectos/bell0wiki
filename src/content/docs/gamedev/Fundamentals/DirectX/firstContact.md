---
title: First Contact
description: In this tutorial Direct3D will finally be initialized and a Direct3D device and its context will be created.
---

> How do you say "We come in peace" when the very words are an act of war?
>
> – Peter Watts, Blindsight

In the last, rather theoretical, tutorial we learned about the Component Object Model architecture and that DirectX is a
collection of such COM objects. In this tutorial we will jump right into the action and initialize Direct3D! Are you
ready for

## First Contact?

Fortunately, COM makes use of [smart pointers](http://www.umich.edu/~eecs381/handouts/C++11_smart_ptrs.pdf),
called [COM Pointers](https://msdn.microsoft.com/en-us/library/ezzw7k98.aspx), which easily handle the life cycle of COM
objects.

With that being said, creating and using a COM object is surprisingly simple:

```cpp
// create a pointer to the COM interface
ComPtr<ICOMObject> comObjPointer;

// create the COM object
CreateObject(&comObjPointer);
```

The pointer to the desires COM interface is acquired by a call to the *CreateObject* function. Each COM object type has
its own way of being created, and we will learn about a few of those as we move forward with the tutorials.

## The Device and its Context

At the very core of Direct3D are two COM objects: the device and the device context.

The device object is a virtual representation of the video adapter, and it can be used to access the memory of the GPU
and to create other Direct3D related COM objects.

The device context is a structure that defines a set of graphic objects and their associated attributes, as well as the
graphic modes that affect output. The graphic objects include a pen for line drawing, a brush for painting and filling,
a bitmap for copying or scrolling parts of the screen, a palette for defining the set of available colours, a region for
clipping and other operations, and a path for painting and drawing operations. Thus, the device context can be
considered the *control panel* for the GPU. Through it, the transformation of a three-dimensional model to a final
two-dimensional image, and the process of rendering that image to the screen, can be controlled.

The interfaces for these objects are called **ID3D11Device** and **ID3D11DeviceContext**. To create and initialize them,
the [D3D11CreateDevice](https://msdn.microsoft.com/de-de/library/windows/desktop/ff476082%28v=vs.85%29.aspx) function
must be called:

```cpp
HRESULT D3D11CreateDevice(
  __in   IDXGIAdapter *pAdapter,
  __in   D3D_DRIVER_TYPE DriverType,
  __in   HMODULE Software,
  __in   UINT Flags,
  __in   const D3D_FEATURE_LEVEL *pFeatureLevels,
  __in   UINT FeatureLevels,
  __in   UINT SDKVersion,
  __out  ID3D11Device **ppDevice,
  __out  D3D_FEATURE_LEVEL *pFeatureLevel,
  __out  ID3D11DeviceContext **ppImmediateContext
);
```

### [IDXGIAdapter](https://msdn.microsoft.com/en-us/library/windows/desktop/bb174523(v=vs.85).aspx) *pAdapter

This is a pointer to an interface that describes the GPU that Direct3D should use. For now, we shall simply let Direct3D
take care of the details, as in most cases, there is only one GPU anyway. To do that, we input a *nullptr* here.

### [D3D_DRIVER_TYPE DriverType](https://msdn.microsoft.com/en-us/library/windows/desktop/ff476328(v=vs.85).aspx)

The DriverType represents the driver type to create. There are six possible values for this parameter, but we are only
going to be concerned with one of them: *D3D_DRIVER_TYPE_HARDWARE* which tells Direct3D to use the hardware accelerated
graphics chip to process graphics.

### HMODULE Software

A handle to a DLL that implements a software rasterizer. If the DriverType is *D3D_DRIVER_TYPE_SOFTWARE*, Software must
not be *NULL*. However, as we want to directly work with the hardware, we will just use *NULL* here.

### UINT [Flags](https://msdn.microsoft.com/en-us/library/windows/desktop/ff476107(v=vs.85).aspx)

This parameter defines the runtime layers to enable. We will use the *D3D11_CREATE_DEVICE_BGRA_SUPPORT* flag to enable
interoperability between Direct2D and Direct3D. While debugging, it might be a good idea to also use the
*D3D11_CREATE_DEVICE_DEBUG* flag, which creates a device that supports the debug layer.

### const [D3D_FEATURE_LEVEL](https://msdn.microsoft.com/en-us/library/windows/desktop/ff476329(v=vs.85).aspx) *pFeatureLevels

This is a pointer to an array of *D3D_FEATURE_LEVEL*s, which determine the order of feature levels to attempt to create.
This can be set to *NULL* to get the greatest feature level available.

### UINT FeatureLevels

The number of elements in *pFeatureLevels*. We will obviously put 0 here.

### UINT SDKVersion

The SDK version; use *D3D11_SDK_VERSION*.

### ID3D11Device **ppDevice

This is a pointer to a pointer to an *ID3D11Device* object that represents the device created.

### D3D_FEATURE_LEVEL *pFeatureLevel

If successful, the first *D3D_FEATURE_LEVEL* from the *pFeatureLevels* array which succeeded is stored in this
parameter. Otherwise, 0 is returned.

### ID3D11DeviceContext **ppImmediateContext

This is a pointer to a pointer to the *ID3D11DeviceContext* object that represents the device context.

## Putting It All Together

To work with Direct3D, we created a new class, the *Direct3D* class.

```cpp
// Windows and Com
#include <wrl/client.h>

// Direct3D
#include <d3d11.h>
#pragma comment (lib, "d3d11.lib")

class Direct3D
{
private:
	Microsoft::WRL::ComPtr<ID3D11Device> dev;				// the actual Direct3D device
	Microsoft::WRL::ComPtr<ID3D11DeviceContext> devCon;		// its context

public:
	Direct3D();
	~Direct3D();
};
```

The first thing to do, obviously, is to include a number of *import* libraries which include the COM wrappers, such that
calls to DirectX can be made using those wrappers.

Using the code from above, creating the actual device and its context is rather straightforward:

```cpp
Direct3D::Direct3D()
{
	HRESULT hr;

	// define device creation flags,  D3D11_CREATE_DEVICE_BGRA_SUPPORT needed to get Direct2D interoperability with Direct3D resources
	unsigned int createDeviceFlags = D3D11_CREATE_DEVICE_BGRA_SUPPORT;

	// if in debug mode, create device with debug layer
#ifndef NDEBUG
	createDeviceFlags |= D3D11_CREATE_DEVICE_DEBUG;
#endif

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

	//  log success
	util::ServiceLocator::getFileLogger()->print<util::SeverityType::info>("Direct3D was initialized successfully.");
}

Direct3D::~Direct3D()
{
	util::ServiceLocator::getFileLogger()->print<util::SeverityType::info>("Direct3D was shut down successfully.");
}
```

---

You can download the source code
from [here](https://filedn.eu/ltgnTcOBnsYpGSo6BiuFrPL/Game%20Programming/Fundamentals/DirectX/firstContact.7z).

And here is the log file:

```
0: 15/7/2017 13:30:21	INFO:    mainThread:	The file logger was created successfully.
1: 15/7/2017 13:30:21	INFO:    mainThread:	The high-precision timer was created successfully.
2: 15/7/2017 13:30:21	INFO:    mainThread:	The client resolution was read from the Lua configuration file: 800 x 600.
3: 15/7/2017 13:30:21	WARNING: mainThread:	The window was resized. The game graphics must be updated!
4: 15/7/2017 13:30:21	INFO:    mainThread:	The main window was successfully created.
5: 15/7/2017 13:30:21	INFO:    mainThread:	Direct3D was initialized successfully.
6: 15/7/2017 13:30:21	INFO:    mainThread:	The DirectX application initialization was successful.
7: 15/7/2017 13:30:21	INFO:    mainThread:	Game initialization was successful.
8: 15/7/2017 13:30:21	INFO:    mainThread:	Entering the game loop...
9: 15/7/2017 13:30:24	INFO:    mainThread:	The main window was flagged for destruction.
10: 15/7/2017 13:30:24	INFO:    mainThread:	Leaving the game loop...
11: 15/7/2017 13:30:24	INFO:    mainThread:	The game was shut down successfully.
12: 15/7/2017 13:30:24	INFO:    mainThread:	Direct3D was shut down successfully.
13: 15/7/2017 13:30:24	INFO:    mainThread:	Main window class destruction was successful.
14: 15/7/2017 13:30:24	INFO:    mainThread:	The timer was successfully destroyed.
15: 15/7/2017 13:30:24	INFO:    mainThread:	The DirectX application was shutdown successfully.
16: 15/7/2017 13:30:24	INFO:    mainThread:	The file logger was destroyed.
```

---

Well, this wasn't so difficult, was it? We have successfully added a Direct3D device and its context to our application.
In the upcoming tutorials, we will learn how to use these two to actually render objects to the screen; we will start
with the *swap chain*, in the next tutorial.

## References

(in alphabetic order)

* Microsoft Developer Network ([MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/ee663274(v=vs.85)))
* Tricks of the Windows Game Programming Gurus, by André LaMothe

#gamedev #directx