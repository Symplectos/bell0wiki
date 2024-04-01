---
title: (Direct)X-Com
description: This tutorial gives a brief overview of the different components of DirectX and it briefly explains the basics of the Component Object Model architecture.
---

> Over the centuries, mankind has tried many ways of combating the forces of evil... prayer, fasting, good works and so
> on. Up until Doom, no one seemed to have thought about the double-barrel shotgun. Eat leaden death, demon …
>
> – Terry Pratchett

## Enter DirectX

Just assume that you want to write a piece of software that needs direct access to the GPU and CPU, has networking
capabilities, plays audio and uses the mouse, keyboard, and a joystick for user input. That sounds like fun, but can you
imagine writing drivers to control every single GPU out there and change your program depending on the capacities of the
GPU? Can you imagine polling all the different available keyboards or joysticks, knowing that each company has different
standards? That doesn't sound like so much fun anymore, does it?

Well, thankfully, Microsoft and all the hardware manufacturers, made a massive effort and created a very
high-performance standard, DirectX, that allows programmers to access all the above-mentioned features with relative
ease. Granted, when using DirectX, the programmers lose a tiny bit of control, but hell, it is definitely worth it. When
I first started to program as a kid, things were a lot more difficult, DirectX and similar APIs are absolutely a boon.

But what exactly is DirectX? As was already mentioned, DirectX allows relatively direct control over a computer's
hardware, with some software layers between the programmer and the actual hardware. Basically, with COM, Microsoft
invented a set of conventions that all hardware vendors must use when implementing their various drivers to talk to the
hardware. The technology Microsoft and the hardware manufacturers use to achieve this is called
the [Component Object Model](https://en.wikipedia.org/wiki/Component_Object_Model), or COM, for short.

For programmers, that means that as long as the hardware manufacturers and vendors stick to those conventions, any
DirectX-based programs will (theoretically) work on all available hardware. To get acquainted with DirectX, we will have
a look at its build-up.

## DirectX Architecture

As an example, we will look at Direct3D.

Direct3D applications can exist
alongside [GDI](https://msdn.microsoft.com/de-de/library/windows/desktop/dd145203%28v=vs.85%29.aspx) applications, and
both have access to the computer's graphics hardware through the device driver for the graphics card. Unlike GDI,
Direct3D can take advantage of hardware features by creating
a [Hardware Abstraction Layer](https://en.wikipedia.org/wiki/Hardware_abstraction#Microsoft_Windows), or **HAL**,
device.

In general, the HAL is part of the operating system, granting the rest of the system access to abstract hardware devices
devoid of the above-mentioned idiosyncrasies with which real hardware is often endowed. In the context of Direct3D, the
HAL device provides access to the pipeline functions of the GPU (covered in a later tutorial), based upon the feature
set supported by the graphics card. If a feature is not provided by the hardware, the program code will be emulated by
software in the [Hardware Emulation Layer](https://en.wikipedia.org/wiki/Hardware_emulation), or **HEL**.

Basically, the HAL talks directly to the hardware (which means that the HAL very frequently is the actual device driver
from the manufacturer) and thus is quite fast. If, however, if a feature is not supported by the hardware, the
application doesn't halt, thankfully, but is emulated in the HEL, using a software algorithm. Obviously, this will be
slower, but that is still better than entire programs breaking apart.

## DirectX Components

Let us have a look at the different components of DirectX:

### Graphics

#### [Direct3D](https://msdn.microsoft.com/en-us/library/windows/desktop/hh309466(v=vs.85).aspx)

Well, obviously this component of DirectX is used to create and draw 3D graphics on the computer screen. We will deal
with Direct3D, in great detail, in the following tutorials.

#### [DXGI](https://msdn.microsoft.com/en-us/library/windows/desktop/hh404534(v=vs.85).aspx)

The primary goal of DXGI is to manage low-level tasks that can be independent of the DirectX graphics runtime. DXGI
provides a common framework for future graphics components; the first component that was to take advantage of DXGI is
Microsoft Direct3D 10.

DXGI provides objects to handle tasks such as enumerating graphics adapters and monitors, enumerating display modes,
choosing buffer formats, sharing resources between processes (such as between applications and the Desktop Window
Manager), and presenting rendered frames to a window or monitor for display.

#### [DirectDraw](https://msdn.microsoft.com/en-us/library/windows/desktop/gg426115(v=vs.85).aspx)

This was the primary rending and 2D-bitmap engine. It is deprecated in favour of Direct2D.

#### [Direct2D](https://msdn.microsoft.com/en-us/library/windows/desktop/dd370990(v=vs.85).aspx)

The Direct2D component, oh wonder, is used to draw 2D graphics. Direct2D allows interoperability
with [GDI](https://docs.microsoft.com/en-us/windows-hardware/drivers/display/gdi-hardware-acceleration), [GDI+](https://msdn.microsoft.com/en-us/library/windows/desktop/ms533798(v=vs.85).aspx),
and Direct3D and permits rendering to and from a Direct3D surface, as well as to and from a GDI/GDI+ device context (
HDC) with full serialization of surfaces and device contexts, which enables it to work with other native Windows
technologies such as DirectWrite.

#### [DirectWrite](https://msdn.microsoft.com/en-us/library/windows/desktop/dd368038(v=vs.85).aspx)

DirectWrite is a text layout and glyph rendering API. When running on top of Direct2D, DirectWrite is
hardware-accelerated. We will use Direct2D and DirectWrite in a later tutorial to print text (such as FPS information)
to our game window.

### Audio

#### [DirectX Media Objects](https://msdn.microsoft.com/en-us/library/windows/desktop/dd375474(v=vs.85).aspx)

DirectX Media Objects allowed to stream video and audio files. They have been superseded
by [Media Foundation Transforms](https://msdn.microsoft.com/en-us/library/windows/desktop/ms703138(v=vs.85).aspx). We
won't cover anything related to this in our tutorials.

#### [DirectSound](https://msdn.microsoft.com/en-us/library/windows/desktop/bb318665(v=vs.85).aspx)

The outdated sound component (deprecated in favour of XAudio2 and XACT3) only supported digital sound.

#### [DirectMusic](https://msdn.microsoft.com/en-us/library/windows/desktop/dd551276(v=vs.85).aspx)

DirectMusic added support for MIDI technology to DirectSound (but no MP3 support), but we won't talk much about all
that, as it is deprecated in favour of XAudio2 and XACT3.

#### [XAudio2](https://msdn.microsoft.com/en-us/library/windows/desktop/ee415813(v=vs.85))

XAudio2 is based on the Xbox-360-Sound-API (shudders) and has deprecated DirectSound. A few of the highlights of XAudio2
are [Digital Signal Processing](https://en.wikipedia.org/wiki/Digital_signal_processing)-Effects (turning animal screams
into scary monster sounds — think of pixel shaders for audio), Submixing (combining several sounds into a single audio
stream) and Surround Sound.

#### XACT3

[The Cross-platform Audio Creation Tool](https://en.wikipedia.org/wiki/Cross-platform_Audio_Creation_Tool) (XACT) is an
audio programming library and engine for playing audio.

#### [FMOD](http://www.fmod.com/)

[FMOD](https://en.wikipedia.org/wiki/FMOD), developed by Firelight Technologies, is **not** a component of DirectX, but
it is mentioned here, since in these tutorials, we will be using FMOD to add music and sounds to our games (just like
Blizzard does, for example).

### Input

#### [DirectInput](https://msdn.microsoft.com/en-us/library/windows/desktop/ee416842(v=vs.85).aspx)

This component handles all the different input devices, such as the mouse, keyboard, and joysticks. DirectInput also
allows us to create Force-Feedback-Effects. DirectInput does not send event messages and runs directly on the hardware.
It is now deprecated, however, in favour of XInput for Xbox 360 (shudders, again). In these tutorials we will still use
DirectInput, it might be deprecated, but it is functionally complete.

#### [XInput](https://msdn.microsoft.com/en-us/library/windows/desktop/ee417001(v=vs.85).aspx)

XInput is an API for *next generation* controllers and was introduced in 2005 alongside the launch of the Xbox 360.
Microsoft describes it as being easier to program for and requiring less setup than DirectInput. XInput is compatible
with DirectX version 9 and later.

### Networking

#### [DirectPlay](https://en.wikipedia.org/wiki/DirectPlay)

DirectPlay is the networking component of DirectX. It allows us to make connections through the Internet or via local
LAN, for example. It basically sends and receives all the packets for us so that we do not really have to worry about
sockets and other stuff. DirectPlay also supports sessions and lobbies. DirectPlay unfortunately produced a lot of
overhead, and thus most games have their own network-code. DirectPlay is deprecated in favour of Games for Windows -
Live technology. (shudders, yet again)

### Advanced Components

#### [DirectCompute](https://en.wikipedia.org/wiki/DirectCompute)

DirectCompute supports general-purpose computing on GPUs. This is very intriguing, but rather advanced, we won't cover
this until way later.

### Utilities

#### [DirectX Diagnostics](https://msdn.microsoft.com/en-us/library/windows/desktop/bb318763(v=vs.85).aspx)

DirectX Diagnostics gathers information about the system and the DirectX components installed on it, as well as
providing several tests to ensure that components are working properly.

#### DirectX Setup

This allows to test, during installation, whether the required version of DirectX is available on the system, and if
not, the installation of the required DirectX version can be requested.

---

This concludes the overview of the DirectX components. Reading all of this, you might be scared that once you mastered
one component, it might be deprecated, but don't worry. Even though graphics, and game technology in general, is moving
very fast, DirectX is always downwards compatible, i.e. if we write DirectX 11 code, we can be sure that it will still
work in DirectX99, when the cyborgs rise up. How does DirectX manage that rather incredible feat? Well, DirectX is
based, as we briefly mentioned in the introduction of this tutorial, on COM technology …

## The Sith Dreadmasters (or COM)

As computer programs are getting larger and larger, abstraction and hierarchy are getting more and more important to
avoid chaos and disaster. The Component Object Model, COM, for short, is a software architecture that allows
applications to be built from binary software components — think of Lego blocks for example, simply put the blocks
together and the result always works (although the result might not be what we had expected).

Lego blocks can be stuck together to create more advanced shapes. The different Lego blocks actually aren't concerned
about their brethren's particularities, they are all compatible with each other.

Obviously, to implement such a technology, one needs a very generic interface that can take the form of any possible
type of function that one can imagine. That is what COM does. COM is the underlying architecture that forms the
foundation for higher-level services such as DirectX.

The COM defines several fundamental concepts, there is a binary standard for function calling between COM components and
there is a way for components to dynamically discover the interfaces implemented by other components. What does that
mean for programmers? New features can be added to COM objects without breaking any software that uses that COM object,
different COM objects can be added together and COM objects can be changed without recompiling the program (which means
that programs can be updated to use newer COM versions without having to recompile everything). Amazing, just like
Lego (and it somehow reminds me of vector spaces …).

This is great, right, but what exactly is a COM object? A COM object basically is a C++ class that implements a certain
number of interfaces. An interface is, loosely speaking, a set of functions, and is used to communicate with the actual
COM object.

There can be multiple COM objects each with multiple interfaces, the important thing is that all those interfaces must
be derived from the IUNKNOWN interface:

```cpp
struct IUNKNOWN
{
    virtual HRESULT __stdcall QueryInterface(
      [in]  REFIID riid,
      [out] void   **ppvObject
    ) = 0;

    virtual ULONG __stdcall Addref() = 0;
    virtual ULONG __stdcall Release() = 0;
}
```

Note that all the methods are pure virtual functions, thus all derived interfaces must at least implement each of the
above methods. (As a reminder: `__stdcall` means that the parameters are pushed on the global stack from right to left).

### [QueryInterface](https://msdn.microsoft.com/en-us/library/windows/desktop/ms682521(v=vs.85).aspx)

This function is the key to the COM world as it is used to request a pointer to the desired interface. To request for a
specific interface, the *interface ID*, a 128 bit long unique integer, must be known. *QueryInterface* calls the
*AddRef* function on the returned pointer.

### [AddRef](https://msdn.microsoft.com/en-us/library/windows/desktop/ms691379(v=vs.85).aspx) and [Release](https://msdn.microsoft.com/en-us/library/windows/desktop/ms682317(v=vs.85).aspx)

As COM is language-independent, it can't, for example, use *malloc* or *new* to create new objects, but somehow it has
to monitor how many objects there are at any given moment in time. Thus, COM objects use reference counting to keep
track of their lives. When the reference count is equal to zero, the objects are destroyed internally. As you can now
guess, the AddRef functions increments the counter by one, and Release decrements the same counter by one.

For more information on how to create your own COM objects, check Chapter 5 of LaMothe's book or
Microsofts [COM page](https://www.microsoft.com/com/default.mspx).

## (Direct)X-Com

The good news is that DirectX tries to hide most of the tedious COM business behind little wrapper functions. Thank you,
Microsoft. We have already seen that DirectX is made up of many COM objects, so now all that is left to learn is how to
actually get access to those objects.

Now assume that we have an interface pointer to a COM object. What actually happens in the background is that we have
a [Virtual Function Table](https://en.wikipedia.org/wiki/Virtual_method_table) pointer. A virtual function table is a
mechanism used in a programming language to support dynamic dispatching, that is, whenever a class defines a virtual
function, the compiler adds a hidden member variable to the class which points to an array of pointers to (virtual)
functions. These pointers are used at runtime to invoke the appropriate function implementations because at compile time
it may not yet be known if the base function or a derived one, implemented by a class that inherits from the base class,
is to be called.

So, to recapitulate, COM is a way of writing component software that allows the creation of reusable modules that are
dynamically linked together at runtime. Each of these objects are collections of interfaces which, in turn, are a
collection of functions that are referenced through a virtual function table pointer. Thus, all we have to do to work
with DirectX COM objects is to *create* them and to retrieve their interface pointers. We will learn how to do just that
in the next tutorial.

## References

* Microsoft Developer Network ([MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/ee663274(v=vs.85)))
* Structured Computer Organization, by Andrew S. Tanenbaum
* Tricks of the Windows Game Programming Gurus, by André LaMothe