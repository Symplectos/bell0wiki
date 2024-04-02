---
title: Polling Joysticks
description: This tutorial explains how to use DirectInput in DirectX 11 to acquire user input from joystick-like devices.
---

> DirectInput is basically a miracle [...].  
> Without DirectInput, you would be on the phone with every input device manufacturer in the world, begging them for
> drivers [...] and having a really bad day -- trust me!
> DirectInput takes all these problems away. Of course, because it was designed by Microsoft, it creates whole new
> problems, but at least they are localized at one company!
>
> – André LaMothe in Tricks of the Windows Game Programming Gurus

## DirectInput

DirectInput is an API for input devices including the mouse, keyboard, joystick, and other game controllers, as well as
for force-feedback (input/output) devices. In this tutorial, we will learn how to use DirectInput 8 in DirectX 11 to
acquire information about Joysticks and Gamepads. Since I currently have no joystick device that DirectInput recognizes
as ForceFeedback device, we won't talk about force feedback in this tutorial. Please refer to Chapter 9 in LaMothe's
book to read more about that topic.

Just like the other DirectX components, DirectInput is a hardware-independent virtual system that allows hardware
manufacturers to create conventional and non-conventional input devices that all act as interfaces in the same way. As a
programmer, we no longer have to deal with each manufacturer to get the specific details and drivers for each device. As
long as the hardware manufacturer provides a DirectInput driver for their devices, the devices will work with
DirectInput like every other generic device.

Internally, DirectInput only specifies between keyboards, mice and joystick like devices, i.e. steering wheels, gamepads
and similar devices are all *joysticks* as far as DirectInput is concerned.

DirectInput, or Microsoft, forces hardware manifacturers to give each device a unique identifier, the so
called [GUID](https://en.wikipedia.org/wiki/Universally_unique_identifier), or Globally Unique Identifier, which means
that each hardware product can be uniquely identified by DirectInput.

To query for a pointer to a COM-interface of the desired hardware, the GUID of the hardware must be known. There are two
default GUIDs for keyboards and mice: *GUID_SysKeyboard* and *GUID_SysMouse*, but the GUIDs of available joystick-like
devices must be queried for via a callback function. Before being able to get access to the input devices, however, a
pointer to the interface of the main DirectInput COM object must be acquired. The general steps for setting up
DirectInput and a few devices, are as follows:

1. Create the main DirectInput interface.
2. Query for the GUIDs of all available devices.
3. Get a pointer to an interface of each desired input device.
4. Set the co-operation level of each created device.
5. Set the desired data format of each created device.
6. Set any desired properties for each created device.
7. Acquire each device.
8. Poll the devices for user input.
9. Read the device state.

We will briefly cover each of these steps, as with the COM-Dreadmasters not being really scary anymore, setting up
DirectInput will be a walk in the park.

### The Main COM Object

To get a pointer to an interface of the main COM object of DirectInput 8, *#define DIRECTINPUT_VERSION 0x0800* must be
set before the include statement for *dinput.h* and the link to *dinput8.lib* and *dxguid.lib*:

```cpp
#define DIRECTINPUT_VERSION 0x0800
#include <dinput.h>
#pragma comment (lib, "dinput8.lib")
#pragma comment (lib, "dxguid.lib")
```

Acquiring the main COM object is done using the
*[DirectInput8Create](https://msdn.microsoft.com/en-us/library/windows/desktop/microsoft.directx_sdk.reference.directinput8create(v=vs.85).aspx)*
method:

```cpp
HRESULT DirectInput8Create(
         HINSTANCE hinst,
         DWORD dwVersion,
         REFIID riidltf,
         LPVOID * ppvOut,
         LPUNKNOWN punkOuter
)
};
```

The parameters are as follows:

#### HINSTANCE hinst

Handle to the instance of the application requiring the COM object.

#### DWORD dwVersion

This parameter takes a constant double word describing the version of DirectInput to be acquired. We will use
*DIRECTINPUT_VERSION*.

#### REFIID riidltf

This constant defines the version of the interface to be created. We will set this to *IID_IDirectInput8*.

#### LPVOID* IID_IDirectInput8

Once the function returns, this parameter holds the address to a pointer to the newly created DirectInput interface.

#### LPUNKNOWN punkOuter

From the MSDN: Pointer to the address of the controlling object's IUnknown interface for COM aggregation, or NULL if the
interface is not aggregated. Most calling applications pass NULL and so will we.

--- 

Here is how to create the main DirectInput COM object:

```cpp
IDirectInput8* dev;									// the main DirectInput device

InputHandler::InputHandler(core::DirectXApp* const dxApp, const std::wstring& keyBindingsFile) : keyBindingsFile(keyBindingsFile), dxApp(dxApp), listen(false)
{
	// initialize keyboard and mouse
	kbm = new KeyboardAndMouse();
	dxApp->activeMouse = true;
	dxApp->activeKeyboard = true;

	// initialize DirectInput 8
	util::Expected<void> result = initializeDirectInput();
	if (!result.isValid())
		throw result;

	util::ServiceLocator::getFileLogger()->print<util::SeverityType::info>("The input handler was successfully initialized.");
};

util::Expected<void> InputHandler::initializeDirectInput()
{
    // initialize the main DirectInput 8 device
	if (FAILED(DirectInput8Create(dxApp->getApplicationInstance(), DIRECTINPUT_VERSION, IID_IDirectInput8, (void **)&dev, NULL)))
		return std::runtime_error("Critical error: Unable to create the main DirectInput 8 COM object!");
}
```

### Enumerating Joystick-like devices

DirectInput can scan the system registry to detect what kind of joysticks are plugged into the computer and available
for use. The function to use here is
the [IDIRECTINPUT8::EnumDevices](https://msdn.microsoft.com/en-us/library/windows/desktop/microsoft.directx_sdk.idirectinput8.idirectinput8.enumdevices(v=vs.85).aspx)
function:

```cpp
HRESULT EnumDevices(
         DWORD dwDevType,
         LPDIENUMDEVICESCALLBACK lpCallback,
         LPVOID pvRef,
         DWORD dwFlags
)
```

#### DWORD dwDevType

This parameter specifies which type of devices to enumerate. For a list of possible
parameters, [check the MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/microsoft.directx_sdk.reference.dideviceinstance(v=vs.85).aspx).
Here is an excerpt:

* DI8DEVCLASS_ALL: All possible devices.
* DI8DEVCLASS_DEVICE: All devices that do not fall into another class.
* DI8DEVCLASS_GAMECTRL: All game controllers.
* DI8DEVCLASS_KEYBOARD: All keyboards. Equivalent to DI8DEVTYPE_KEYBOARD.
* DI8DEVCLASS_POINTER: All devices of type DI8DEVTYPE_MOUSE and DI8DEVTYPE_SCREENPOINTER.

#### LPDIENUMDEVICESCALLBACK lpCallback

This parameter is a pointer to the callback function that DirectInput should call for each device it finds. We will talk
about this in a moment.

#### LPVOID pvRef

This parameter is a 32-bit pointer to a value that will be passed to the callback function each time time it is called.

#### DWORD dwFlags

Those flags specify how the enumeration function should scan for devices, i.e. whether to list all devices, or only
attached devices, for example. For a complete list, check the MSDN.

---

### Calling Back

The enumeration functions loops through each device it finds and then calls a user-defined callback function for each
device, this means that it is up to use to, for example, create a list to store all attached devices. Here is the
prototype of a DirectInput-compatible callback function:

```cpp
BOOL DIEnumDevicesCallback(
         LPCDIDEVICEINSTANCE lpddi,
         LPVOID pvRef
)
```

#### LPCDIDEVICEINSTANCE lpddi

This parameter is a pointer from DirectInput containing information about the device that was just found.

#### LPVOID pvRef

This is simply the pointer sent in pvRef to the enumeration function.

---

As another detail, note that DirectInput allows us to continue the enumeration for as long as we want, as the callback
function must return *DIENUM_CONTINUE*, to continue the enumeration, or *DIENUM_STOP* to stop the enumeration.

---

So all that needs to be done is to write a function adhering to the above prototype and to pass it to the enumeration
function. Typically we will want to create a list of all devices together with their GUIDs to let the user chose their
preferred devices for the game.

To do so, we have to have a look at
the [DIDEVICEINSTANCE](https://msdn.microsoft.com/en-us/library/windows/desktop/microsoft.directx_sdk.reference.dideviceinstance(v=vs.85).aspx)
structure, which describes an instance of a DirectInput device:

```cpp
typedef struct DIDEVICEINSTANCE {
    DWORD dwSize;
    GUID guidInstance;
    GUID guidProduct;
    DWORD dwDevType;
    TCHAR tszInstanceName[MAX_PATH];
    TCHAR tszProductName[MAX_PATH];
    GUID guidFFDriver;
    WORD wUsagePage;
    WORD wUsage;
} DIDEVICEINSTANCE, *LPDIDEVICEINSTANCE;
```

#### DWORD dwSize

This parameter simply stores the size of the structure.

#### GUID guidInstance

This parameter stores the unique identifier of the device. Obviously this is of interest of us.

#### GUID guidProduct

This parameter specifies the unique identifier for the product. This identifier is established by the manufacturer of
the device and usually rather general.

#### DWORD dwDevType

This parameter defines the type of the device as listed in the above tables. The least-significant byte of the device
type description code specifies the device type. The next-significant byte specifies the device subtype.

#### TCHAR tszInstanceName

This is a generic friendly name for the instance. For example: "Joystick 1".

#### TCHAR tszProductName

This parameter specifies the name of the product, i.e. "Wii U Controller". This is also of interest to us.

#### GUID guidFFDriver

This is the unique identifier for the force feedback driver, we will talk more about force feedback later.

#### WORD wUsagePage ; WORD wUsage

Those advanvced parameters are for Human Interface Devices, we won't talk about those in this tutorial.

---

Okay, so let us write a callback function to get the GUID and name of each attached device:

```cpp
static BOOL CALLBACK staticEnumerateGameControllers(LPCDIDEVICEINSTANCE devInst, LPVOID pvRef);

BOOL CALLBACK InputHandler::staticEnumerateGameControllers(LPCDIDEVICEINSTANCE devInst, LPVOID pvRef)
{
	InputHandler* inputHandlerInstance = (InputHandler*)pvRef;
	return inputHandlerInstance->enumerateGameControllers(devInst);
}
    
util::Expected<void> InputHandler::initializeDirectInput()
{
    ...
	
    // initialize the main DirectInput 8 device
	if (FAILED(DirectInput8Create(dxApp->getApplicationInstance(), DIRECTINPUT_VERSION, IID_IDirectInput8, (void **)&dev, NULL)))
		return std::runtime_error("Critical error: Unable to create the main DirectInput 8 COM object!");

	// enumerate all available game controllers
	if (FAILED(dev->EnumDevices(DI8DEVCLASS_GAMECTRL, &staticEnumerateGameControllers, this, DIEDFL_ATTACHEDONLY)))
		return std::runtime_error("Critical error: Unable to enumerate input devices!");
}
```

What the hell just happened? A static function with a cryptical use of the pvRef parameter? Why? Well, the answer is
that the callback function can't be a member function (unless we use *bind*), and thus we create a static member
function. To be able to use the members of the InputHandler class and to actually store the game controllers in the
class, we pass the address of the InputHandler class in the pvRef argument and then call a normal member function to
actually create the devices using
the [DirectInput8::CreateDevice](https://msdn.microsoft.com/en-us/library/windows/desktop/microsoft.directx_sdk.idirectinput8.idirectinput8.createdevice(v=vs.85).aspx)
method:

```cpp
HRESULT CreateDevice(
         REFGUID rguid,
         LPDIRECTINPUTDEVICE * lplpDirectInputDevice,
         LPUNKNOWN pUnkOuter
)
```

#### REFGUID rguid

This is the unique identifier of the hardware device we want to create a DirectInput device instance for. We can simply
pass the GUID the enumeration functions provides for us.

#### LPDIRECTINPUTDEVICE* lplpDirectInputDevice

The address of a variable to receive the IDirectInputDevice8 Interface interface pointer if successful.

#### LPUNKNOWN pUnkOuter

The address of the controlling object's IUnknown interface for COM aggregation, or NULL if the interface is not
aggregated. We can safely pass NULL here.

---

### Creating the Game Controllers

Here is the C++-code to actually create the enumerated devices:

```cpp
std::vector<LPDIRECTINPUTDEVICE8> gameControllers;	// a vector of all available game controllers

BOOL InputHandler::enumerateGameControllers(LPCDIDEVICEINSTANCE devInst)
{
	// enumerate devices
	LPDIRECTINPUTDEVICE8 gameController;

	// create interface for the current game controller
	if (FAILED(dev->CreateDevice(devInst->guidInstance, &gameController, NULL)))
		return DIENUM_CONTINUE;
	else
	{
		// store the game controller
		gameControllers.push_back(gameController); // (std::make_pair<std::wstring, LPDIRECTINPUTDEVICE8>(devInst->tszProductName, std::move(gameController)));
		return DIENUM_CONTINUE;
	}
}
```

And here is the entire initialization process for the main device:

```cpp
// initialize Direct Input
util::Expected<void> InputHandler::initializeDirectInput()
{
	// read the configuration file
	readConfigFile();

	// initialize the main DirectInput 8 device
	if (FAILED(DirectInput8Create(dxApp->getApplicationInstance(), DIRECTINPUT_VERSION, IID_IDirectInput8, (void **)&dev, NULL)))
		return std::runtime_error("Critical error: Unable to create the main DirectInput 8 COM object!");

	// enumerate all available game controllers
	if (FAILED(dev->EnumDevices(DI8DEVCLASS_GAMECTRL, &staticEnumerateGameControllers, this, DIEDFL_ATTACHEDONLY)))
		return std::runtime_error("Critical error: Unable to enumerate input devices!");

	// if no controllers are available, there is nothing left to do, the game will have to run with keyboard and mouse only
	if (gameControllers.empty())
	{
		if (dxApp->activeJoystick && !dxApp->activeGamepad)
		{
			// load keyboard controls
			dxApp->activeJoystick = false;
			loadGameCommands();
		}
	}

	if (!dxApp->activeJoystick && !dxApp->activeGamepad)
		// no joystick or gamepad support desired -> break
		return {};

	// if there are game controllers, we will have to set them up
	// this will have to be redone each time the user selects a new controller
	// for now we select the first controller as the active controller
	currentlyActiveGameController = 0;
	util::Expected<void> result = initializeGameController();
	if(!result.isValid())
		return std::runtime_error("Critical error: Unable to initialize game controller!");

	// return success
	return { };
}
```

Note that the *activeGamepad* variable will be used in the next tutorial to identify XInput devices.

---

### Cooperation Level

Once a DirectInput device is created, we must set its cooperation level, specifying DirectX how our application intends
to work together with other applications. Here is a list of possible cooperation levels copied from the MSDN:

- DISCL_BACKGROUND: The application requires background access. If background access is granted, the device can be
  acquired at any time, even when the associated window is not the active window.

- DISCL_FOREGROUND: The application requires foreground access. If foreground access is granted, the device is
  automatically unacquired when the associated window moves to the background.

- DISCL_EXCLUSIVE: The application requires exclusive access. If exclusive access is granted, no other instance of the
  device can obtain exclusive access to the device while it is acquired. However, nonexclusive access to the device is
  always permitted, even if another application has obtained exclusive access. An application that acquires the mouse or
  keyboard device in exclusive mode should always unacquire the devices when it receives WM_ENTERSIZEMOVE and
  WM_ENTERMENULOOP messages. Otherwise, the user cannot manipulate the menu or move and resize the window.

- DISCL_NONEXCLUSIVE: The application requires nonexclusive access. Access to the device does not interfere with other
  applications that are accessing the same device.

- DISCL_NOWINKEY: Disable the Windows logo key. Setting this flag ensures that the user cannot inadvertently break out
  of the application. Note, however, that DISCL_NOWINKEY has no effect when the default action mapping user interface (
  UI) is displayed, and the Windows logo key will operate normally as long as that UI is present.

Normally, we can set the cooperation level to *DISCL_BACKGROUND*, meaning that we will receive notifactions whether the
game is minimized or active, and *DISCL_NONEXCLUSIVE*. The only time we have to use *DISCL_EXCLUSIVE* is when working
with force feedback devices, we will use it for normal joysticks and gamepads as well, as I don't see any reason why
another application should have exclusive access while our game is running.

Setting the cooperation level for a device is accomplished with a call to
the [IDirectInput8::SetCooperativeLevel](https://msdn.microsoft.com/en-us/library/windows/desktop/microsoft.directx_sdk.idirectinputdevice8.idirectinputdevice8.setcooperativelevel(v=vs.85).aspx)
function:

```cpp
HRESULT SetCooperativeLevel(
         HWND hwnd,
         DWORD dwFlags
)
```

The syntax is straightforward, the first parameter is a handle to our main window and the second parameter is a
combination of the above flags:

```cpp
// initialize game controller
util::Expected<void> InputHandler::initializeGameController()
{
	if (currentlyActiveGameController < 0 || currentlyActiveGameController >= gameControllers.size())
		return std::runtime_error("Critical error: Game controller index out of range!");

	// get currently active game controller
	LPDIRECTINPUTDEVICE8 gameController = gameControllers[currentlyActiveGameController];

	// set cooperative level
	//  - DISCL_BACKGROUND: receive notifications when the application is in the background as well as in the foreground
	//  - DISCL_EXCLUSIVE: exclusive access: no other application can request exclusive access to the game controller
	if (FAILED(gameController->SetCooperativeLevel(dxApp->getMainWindow(), DISCL_BACKGROUND | DISCL_EXCLUSIVE)))
		return std::runtime_error("Critical error: Unable to set the cooperative level for the game controller!");

    ...
}
```

### Data Formats

DirectInput allows us to define how we want the data from the device to be packed together, that is nice, but a bit of
overkill for now. Thankfully, there are predefined formats that we can use:

- c_dfDIKeyboard: Generic keyboard.
- c_dfDIMouse: Generic mouse.
- c_dfDIJoystick: Generic joystick.
- c_dfDIJoystick2: Generic force feedback joystick.

To set the data format, a simple call to
the [IDirectInputDevice8::SetDataFormat](https://msdn.microsoft.com/en-us/library/windows/desktop/microsoft.directx_sdk.idirectinputdevice8.idirectinputdevice8.setdataformat(v=vs.85).aspx)
method, which only takes one parameter, the desired data format, is enough:

```cpp
// set data format
if (FAILED(gameController->SetDataFormat(&c_dfDIJoystick)))
	return std::runtime_error("Critical error: Unable to set data format for the game controller!");
```

Now each time we poll for the state of the game controller, the data type structure that DirectInput presents us with is
called [DIJOYSTATE](https://msdn.microsoft.com/en-us/library/windows/desktop/microsoft.directx_sdk.reference.dijoystate(v=vs.85).aspx)
and looks like this:

```cpp
typedef struct DIJOYSTATE {
    LONG lX;               // x-axis of the game controller
    LONG lY;               // y-axis of the game controller
    LONG lZ;               // z-axis of the game controller
    LONG lRx;              // x-rotation of the game controller
    LONG lRy;              // y-rotation of the game controller
    LONG lRz;              // z-rotation of the game controller
    LONG rglSlider[2];     // slider controls such as pedals, ...
    DWORD rgdwPOV[4];      // point of view controls
    BYTE rgbButtons[32];   // generic buttons
} DIJOYSTATE, *LPDIJOYSTATE;
```

This structure has a lot of data (most of them are self-explanatory). The buttons are just buttons, they work exactly
the same as keyboard keys or mouse buttons. The axes need some work though: the range of the different axes may vary
from one manufacturer to another, thus DirectInput allows us to scale them to a fixed range such that our game can
always work with the same number, independent of the hardware manufacturer. We will talk about this in the next
*section*.

### Joystick Properties

Game controllers, minus the buttons, are analogue devices and to be able to interpret the state of the axes, we have to
set a frame of reference, much like a standard coordinate system. For example, it would be possible to set the x-axis
range to $[-1000,1000]$ and the y-axis range to $[-2000,2000]$.

Please note that there is a function to get the properties of a game controller,
the [IDirectInputDevice8::GetCapabilities](https://msdn.microsoft.com/en-us/library/windows/desktop/microsoft.directx_sdk.idirectinputdevice8.idirectinputdevice8.getcapabilities(v=vs.85).aspx)
method:

```cpp
HRESULT GetCapabilities(
         LPDIDEVCAPS lpDIDevCaps
)
```

We simply have to initialize
a [DIDEVCAPS](https://msdn.microsoft.com/en-us/library/windows/desktop/microsoft.directx_sdk.reference.didevcaps(v=vs.85).aspx)
structure, which will then hold information about the device:

```cpp
typedef struct DIDEVCAPS {
    DWORD dwSize;
    DWORD dwFlags;
    DWORD dwDevType;
    DWORD dwAxes;
    DWORD dwButtons;
    DWORD dwPOVs;
    DWORD dwFFSamplePeriod;
    DWORD dwFFMinTimeResolution;
    DWORD dwFirmwareRevision;
    DWORD dwHardwareRevision;
    DWORD dwFFDriverVersion;
} DIDEVCAPS, *LPDIDEVCAPS;
```

Check the MSDN for an explanation of each member, what we are mostly interested are the dwAxes and dwButtons members, as
they specify the number of axes and buttons available on the game controller.

Here is a C++-code example to retrieve the capabilities of the game controller:

```cpp
// get number of axes of each game controller
std::vector<unsigned int> nAxes;
DIDEVCAPS capabilities;
capabilities.dwSize = sizeof(DIDEVCAPS);
for (auto controller : gameControllers)
	if (FAILED(controller.second->GetCapabilities(&capabilities)))
		throw "Critical error: Unable to get game controller capabilities!";
	else
		nAxes.push_back(capabilities.dwAxes);
```

---

To set any joystick properties,
the [IDirectInputDevice8::SetProperty](https://msdn.microsoft.com/en-us/library/windows/desktop/microsoft.directx_sdk.idirectinputdevice8.idirectinputdevice8.setproperty(v=vs.85).aspx)
function is used:

```cpp
HRESULT SetProperty(
         REFGUID rguidProp,
         LPCDIPROPHEADER pdiph
)
```

With this method, all sorts of properties can be set, such as the range of each axis, but also the dead zone (more on
this later), neutral areas and more. Luckily for us, most things will work out of the box, but we definitely have to set
the ranges for the axes, so let us have a go at that.

The structure of interest to us is
the [DIPROPRANGE](https://msdn.microsoft.com/en-us/library/windows/desktop/microsoft.directx_sdk.reference.diproprange(v=vs.85).aspx)
structure:

```cpp
typedef struct DIPROPRANGE {
    DIPROPHEADER diph;
    LONG lMin;
    LONG lMax;
} DIPROPRANGE, *LPDIPROPRANGE;
```

#### LONG lMin, LONG lMax

Those members specify the lower and upper limits of the range.

Unfortunately, the structure has another nested structure,
the [DIPROPHEADER](https://msdn.microsoft.com/en-us/library/windows/desktop/microsoft.directx_sdk.reference.dipropheader(v=vs.85).aspx):

```cpp
typedef struct DIPROPHEADER {
    DWORD dwSize;
    DWORD dwHeaderSize;
    DWORD dwObj;
    DWORD dwHow;
} DIPROPHEADER, *LPDIPROPHEADER;
```

#### DWORD dwSize

The size of the enclosing structure. This member must be initialized before the structure is used.

#### DWORD dwHeaderSize

The size of the DIPROPHEADER structure.

#### DWORD dwObj

The object for which the property is to be accessed. The value set for this member depends on the value specified in the
dwHow member.

#### DWORD dwHow

This member specifies how the dwObj member should be interpreted. This value can be one of the following:

- DIPH_DEVICE: The dwObj member must be 0.
- DIPH_BYOFFSET: The dwObj member is the offset into the current data format of the object whose property is being
  accessed.
- DIPH_BYUSAGE: The dwObj member is the human interface device usage page and usage values in packed form.
- DIPH_BYID: The dwObj member is the object type/instance identifier. This identifier is returned in the dwType member
  of the DIDEVICEOBJECTINSTANCE structure returned from a previous call to the IDirectInputDevice8::EnumObjects member.

What the heck, right? Let us have a look at an example, maybe that will clear things up.

---

Unfortunately, setting up the properties of the slices, axes, and buttons of a joystick will require another callback
function. Fortunately, we already know how to work with those. Enumerating all the axes and buttons of a game controller
is done with
the [IDirectInputDevice8::EnumObjects](https://msdn.microsoft.com/en-us/library/windows/desktop/microsoft.directx_sdk.idirectinputdevice8.idirectinputdevice8.enumobjects(v=vs.85).aspx)
method:

```cpp
HRESULT EnumObjects(
         LPDIENUMDEVICEOBJECTSCALLBACK lpCallback,
         LPVOID pvRef,
         DWORD dwFlags
)
```

#### LPDIENUMDEVICEOBJECTSCALLBACK lpCallback

Yay, another callback function!

#### LPVOID pvRef

Yay, another long pointer to the big dark void.

#### DWORD dwFlags

Those flags specify the objects to be enumerated. They can be one or many of the following (check the MSDN for a full
list):

- DIDFT_ABSAXIS: Absolute axes.
- DIDFT_ALL: All objects.
- DIDFT_AXIS: Either absolute or relative axes.
- DIDFT_BUTTON: Push or toggle buttons.
- DIDFT_FFACTUATOR: Object that contain force-feedback actuators.
- DIDFT_FFEFFECTTRIGGER: Objects that can be used to trigger force-feedback effects.
- DIDFT_PSHBUTTON: Push buttons.
- DIDFT_RELAXIS: Relative axes.
- DIDFT_TGLBUTTON: Toggle buttons.

The [prototype for the callback function](https://msdn.microsoft.com/en-us/library/windows/desktop/microsoft.directx_sdk.callback.dienumdeviceobjectscallback(v=vs.85).aspx)
is as follows:

```cpp
BOOL DIEnumDeviceObjectsCallback(
         LPCDIDEVICEOBJECTINSTANCE lpddoi,
         LPVOID pvRef
)
```

This is just the same as when we enumerated all the game controllers, so let us write a callback function to set the
range of each axis to be in $[-100, 100]$:

```cpp
static BOOL CALLBACK staticSetGameControllerAxesRanges(LPCDIDEVICEOBJECTINSTANCE devObjInst, LPVOID pvRef);

BOOL CALLBACK InputHandler::staticSetGameControllerAxesRanges(LPCDIDEVICEOBJECTINSTANCE devObjInst, LPVOID pvRef)
{
	// the game controller
	LPDIRECTINPUTDEVICE8 gameController = (LPDIRECTINPUTDEVICE8)pvRef;
	gameController->Unacquire();
		
	// structure to hold game controller range properties
	DIPROPRANGE gameControllerRange;

	// set the range to -100 and 100
	gameControllerRange.lMin = -100;
	gameControllerRange.lMax = 100;

	// set the size of the structure
	gameControllerRange.diph.dwSize = sizeof(DIPROPRANGE);
	gameControllerRange.diph.dwHeaderSize = sizeof(DIPROPHEADER);

	// set the object that we want to change		
	gameControllerRange.diph.dwHow = DIPH_BYID;
	gameControllerRange.diph.dwObj = devObjInst->dwType;

	// now set the range for the axis		
	if (FAILED(gameController->SetProperty(DIPROP_RANGE, &gameControllerRange.diph))) {
		return DIENUM_STOP;
	}

	return DIENUM_CONTINUE;
}
```

Another thing to do is to set the dead zone, i.e. the amount of neutral area in the centre of the analogue stick.

As analogue devices have a wide range of values, it is quite common to have spurious input. Imagine a joystick with x
and y values represented by a signed 16-bit integer: This means both values can range between $-32768$ and $32767$. Now
imagine the stick being left alone, sitting in neutral position, theoretically now both values should be 0, but usually,
they are just some small values close to zero, but not actually 0.

Because of this, if the raw input of an analogue device was just applied directly to the movement of a character, the
character would never stay still. To eliminate this problem, one can define a *dead zone*, which is an area around the
centre of the game controller input range that is ignored.

An easy approach to solve this problem would be to simply set the x and y-values to zero if they are close to zero, but
that doesn't really work well for the following two reasons:

- we would define the dead zone to be a rectangle, instead of a circle.
- we make the available range of values smaller.

To illustrate the second problem, imagine setting a dead zone of 10%. Now, what if the user wants to move around at 50%
velocity? Pushing the stick by half now means 40%, as 10% is the new zero. What we will have to do is to set 55%, the
middle between 10% and 100% to be 50%.

The first issue can easily be solved by using a vector and its length. If the input from the joystick, as a vector, is
smaller than the dead zone vector, then we do nothing.

To solve the second problem, one can simply compute the percentage between the dead zone and the maximum possible axis
range and then normalize the input and multiply it by the just computed percentage. We will talk more about this in the
next tutorial.

--- 

So much for the theory, let us get to it!

---

The dead zone is always measured in absolute terms between 0 and 10000, i.e. hundreds of a percent, thus to set the dead
zone to 1%, we have to use a value of 100.

Setting the dead zone is a little easier than setting the range of the axes, as this time a smaller structure is used,
the [DIPROPDWORD](https://msdn.microsoft.com/en-us/library/windows/desktop/microsoft.directx_sdk.reference.dipropdword(v=vs.85).aspx)
structure:

```cpp
typedef struct DIPROPDWORD {
    DIPROPHEADER diph;
    DWORD dwData;
} DIPROPDWORD, *LPDIPROPDWORD;
```

#### DIPROPHEADER diph

Same as above.

#### DWORD dwData

The property-specific value being set or retrieved.

Let us see an example of how to set the dead zone to 1%:

```cpp
// enumerate game controller objects
BOOL CALLBACK InputHandler::staticSetGameControllerAxesRanges(LPCDIDEVICEOBJECTINSTANCE devObjInst, LPVOID pvRef)
{
	// the game controller
	LPDIRECTINPUTDEVICE8 gameController = (LPDIRECTINPUTDEVICE8)pvRef;
	gameController->Unacquire();
		
    // set axis range
    ...
    
    // structure to hold game controller axis dead zone
	DIPROPDWORD gameControllerDeadZone;

	// set the dead zone to 1%
	gameControllerDeadZone.dwData = 100;

	// set the size of the structure
	gameControllerDeadZone.diph.dwSize = sizeof(DIPROPDWORD);
	gameControllerDeadZone.diph.dwHeaderSize = sizeof(DIPROPHEADER);

	// set the object that we want to change
	gameControllerDeadZone.diph.dwHow = DIPH_BYID;
	gameControllerDeadZone.diph.dwObj = devObjInst->dwType;

	// now set the dead zone for the axis
	if (FAILED(gameController->SetProperty(DIPROP_DEADZONE, &gameControllerDeadZone.diph)))
		return DIENUM_STOP;

	return DIENUM_CONTINUE;
}
```

And here is how to call the enumeration function:

```cpp
util::Expected<void> InputHandler::initializeGameController()
{
	...
	
    // set range and dead zone of joystick axes
	if (FAILED(gameController->EnumObjects(&staticSetGameControllerAxesRanges, gameController, DIDFT_AXIS)))
		throw "Critical error: Unable to set axis ranges of game controllers!";
   
   ...
}
```

Okay, I am slowly getting the hang out of this. Callback functions aren't as evil as I thought!

### Acquiring the Game Controller

Now actually acquiring the game controller is straightforward. This basically associates the device with our application
and tells DirectInput that we will be requesting data from this device in the future. Please note that acquired devices
must be *unacquired* before they can be released.

Acquiring a device is done using
the [IDirectDevice8::Acquire](https://msdn.microsoft.com/en-us/library/windows/desktop/microsoft.directx_sdk.idirectinputdevice8.idirectinputdevice8.acquire(v=vs.85).aspx)
method:

```cpp
HRESULT Acquire()
```

If the method succeeds, the return value is *DI_OK*, or *S_FALSE* if the device was already acquired. If the method
fails, the return value can be one of the following error values: *DIERR_INVALIDPARAM*, *DIERR_NOTINITIALIZED* or
*DIERR_OTHERAPPHASPRIO*.

Here is the corresponding C++ code:

```cpp
// acquire the game controller
if (FAILED(activeGameController->Acquire()))
	throw "Critical error: Unable to acquire the game controller!";
                
// release controllers
for (auto controller : gameControllers)
{	
	controller->Unacquire();
	controller->Release();
}
gameControllers.clear();
```

### Polling the Game Controller

Some game controller drivers generate interrupts, and that data is always fresh. Other drives are less efficient and
must be polled using
the [IDirectInputDevice8::Poll](https://msdn.microsoft.com/en-us/library/windows/desktop/microsoft.directx_sdk.idirectinputdevice8.idirectinputdevice8.poll(v=vs.85).aspx)
method:

```cpp
HRESULT Poll()
```

If the method succeeds, the return value is *DI_OK*, or *DI_NOEFFECT* if the device does not require polling. If the
method fails, the return value can be one of the following error values: *DIERR_INPUTLOST*, *DIERR_NOTACQUIRED* or
*DIERR_NOTINITIALIZED*.

### Reading the state of the Game Controller

To actually read the state of a game controller,
the [IDirectInputDevice8::GetDeviceState](https://msdn.microsoft.com/en-us/library/windows/desktop/microsoft.directx_sdk.idirectinputdevice8.idirectinputdevice8.getdevicestate(v=vs.85).aspx)
method is used:

```cpp
HRESULT GetDeviceState(
         DWORD cbData,
         LPVOID lpvData
)
```

The function takes a device state structure, i.e. DIJOYSTATE for a joystick device, and a pointer to the actual
structure as input.

Here is an example:

```cpp
util::Expected<void> InputHandler::getGameControllerState()
{
	// save the previous state
	gameControllerStatePrevious = gameControllerStateCurrent;

	// get the new state
	if (FAILED(activeGameController->GetDeviceState(sizeof(DIJOYSTATE), &gameControllerStateCurrent)))
		return std::runtime_error("Failed to get state of the game controller!");

	// return success
	return { };
}
```

## A Framework for Joysticks

To facilitate working with joysticks, we will create a Joystick structure:

```cpp
// the joystick class (DirectInput)
struct Joystick
{
private:
	LPDIRECTINPUTDEVICE8 const dev;					// the actual joystick device
	std::wstring name;								// the name of the game controller

	DIJOYSTATE currentState;						// the state of the joystick in the current frame
	DIJOYSTATE previousState;						// the state of the joystick in the previous frame

	unsigned int numberOfAxes;						// the number of axes on the joystick
	unsigned int numberOfPOVs;						// the number of POVs on the joystick
	unsigned int numberOfButtons;					// the number of buttons on the joystick

	HRESULT poll();									// polls the state of the joystick
	const bool isPressed(const JoystickButtons button) const;	// returns true iff the button is pressed in the current frame
	const bool wasPressed(const JoystickButtons button) const;	// returns truee iff the button was pressed in the previous frame
	const KeyState getButtonState(const JoystickButtons button) const;

public:
	Joystick(LPDIRECTINPUTDEVICE8 const dev);
	~Joystick();

	const std::wstring& getName() const { return name; }

	friend class InputHandler;
};
```

Most of the functions and members of the Joystick structure are self-explanatory. We will briefly discuss the poll,
isPressed, wasPressed and getButtonState functions, however.

### Polling

Polling the joystick is easy, we just have to check whether another application requested access to the joystick as
well:

```cpp
HRESULT Joystick::poll()
{
	HRESULT hr;

	// store the current state
	CopyMemory(&previousState, &currentState, sizeof(DIJOYSTATE));
	ZeroMemory(&currentState, sizeof(DIJOYSTATE));

	// poll the device to read the current state
	hr = dev->Poll();

	if (FAILED(hr))
	{
		// DirectInput lost the device, try to re-acquire it
		hr = dev->Acquire();
		while (hr == DIERR_INPUTLOST)
			hr = dev->Acquire();

		// return if a fatal error is encountered
		if ((hr == DIERR_INVALIDPARAM) || (hr == DIERR_NOTINITIALIZED))
			return E_FAIL;

		// if another application has control of this device, we have to wait for our turn
		if (hr == DIERR_OTHERAPPHASPRIO)
			return S_OK;
	}

	// now if everything is okay, we can get the state of the device
	if (FAILED(hr = dev->GetDeviceState(sizeof(DIJOYSTATE), &currentState)))
		return hr;

	return S_OK;
}
```

### Pressing Buttons

To work with joystick buttons, we define an enum:

```cpp
// define joystick buttons
ENUM_WITH_STRING(JoystickButtons,	(JoyPOV_Left)\
									(JoyPOV_Right)\
									(JoyPOV_Up)\
									(JoyPOV_Down)\
									(EndPOV)\
	(JoyBtn_1)(JoyBtn_2)(JoyBtn_3)\
	(JoyBtn_4)(JoyBtn_5)(JoyBtn_6)\
	(JoyBtn_7)(JoyBtn_8)(JoyBtn_9)\
	(JoyBtn_10)(JoyBtn_11)(JoyBtn_12)\
	(JoyBtn_13)(JoyBtn_14)(JoyBtn_15)\
	(JoyBtn_16)(JoyBtn_17)(JoyBtn_18)\
	(JoyBtn_19)(JoyBtn_20)(JoyBtn_21)\
	(JoyBtn_22)(JoyBtn_23)(JoyBtn_24)\
	(JoyBtn_25)(JoyBtn_26)(JoyBtn_27)\
	(JoyBtn_28)(JoyBtn_29)(JoyBtn_30)\
	(JoyBtn_31)(JoyBtn_32)(EndButtons))
```

To incorporate the new buttons into our already existing code base, we will identify those buttons with keycodes between
256 and 292.

To check whether a button is, or was, pressed, we check the high bit of the corresponding joystick state:

```cpp
const bool Joystick::isPressed(const JoystickButtons button) const
{
	if (button < JoystickButtons::EndPOV)
	{
		// POV button
		switch (button)
		{
			//   0 degrees: north
			//  90 degrees: east
			// 180 degrees: south
			// 270 degrees: west
		case JoystickButtons::JoyPOV_Up:
			return currentState.rgdwPOV[0] == 0;
		case JoystickButtons::JoyPOV_Right:
			return currentState.rgdwPOV[0] == 9000;
		case JoystickButtons::JoyPOV_Down:
			return currentState.rgdwPOV[0] == 18000;
		case JoystickButtons::JoyPOV_Left:
			return currentState.rgdwPOV[0] == 27000;
		}
	}

	if (button > JoystickButtons::EndPOV && button < JoystickButtons::EndButtons)
	{	
		// regular button
		JoystickButtons btn = (JoystickButtons)(button - 5);
		return (currentState.rgbButtons[btn] & 0x80) ? 1 : 0;
	}

	return false;
}

const bool Joystick::wasPressed(const JoystickButtons button) const
{
	if (button < JoystickButtons::EndPOV)
	{
		// POV button
		switch (button)
		{
			//   0 degrees: north
			//  90 degrees: east
			// 180 degrees: south
			// 270 degrees: west
		case JoystickButtons::JoyPOV_Up:
			return previousState.rgdwPOV[0] == 0;
		case JoystickButtons::JoyPOV_Right:
			return previousState.rgdwPOV[0] == 9000;
		case JoystickButtons::JoyPOV_Down:
			return previousState.rgdwPOV[0] == 18000;
		case JoystickButtons::JoyPOV_Left:
			return previousState.rgdwPOV[0] == 27000;
		}
	}

	if (button > JoystickButtons::EndPOV && button < JoystickButtons::EndButtons)
	{
		// regular button
		JoystickButtons btn = (JoystickButtons)(button - 5);
		return (previousState.rgbButtons[btn] & 0x80) ? 1 : 0;
	}
		
	return false;
}
```

### State of the Buttons

Retrieving the state of a button is similar to getting the state of keyboard keys:

```cpp
const KeyState Joystick::getButtonState(const JoystickButtons button) const
{
	if (button == JoystickButtons::EndButtons || button == JoystickButtons::EndPOV)
		return KeyState::StillReleased;

	if (wasPressed(button) == 1)
		if (isPressed(button) == 1)
			return KeyState::StillPressed;
		else
			return KeyState::JustReleased;
	else
		if (isPressed(button) == 1)
			return KeyState::JustPressed;
		else
			return KeyState::StillReleased;
}
```

To have smaller key maps, we will create different key maps depending on which controller is active. Here is an example
of how to store the game commands:

```cpp
util::Expected<void> InputHandler::saveGameCommands() const
{
	std::ofstream keyBindingsOut;

	if (!dxApp->activeJoystick && !dxApp->activeGamepad)
		// keyboard input
		keyBindingsOut = std::ofstream(this->keyBindingsFileKeyboard, std::ios::out);
	else if(dxApp->activeJoystick)
		// joystick input
		keyBindingsOut = std::ofstream(this->keyBindingsFileJoystick, std::ios::out);
	else if(dxApp->activeGamepad)
		// gamepad input
		keyBindingsOut = std::ofstream(this->keyBindingsFileGamepad, std::ios::out);
	else
		return std::runtime_error("Critical error: Unable to deduce input device!");

	// open text archive
	boost::archive::text_oarchive oa(keyBindingsOut);
		
	const std::unordered_multimap<GameCommands, GameCommand*>* keyMap = nullptr;

	// get keyMap
	if (!dxApp->activeJoystick && !dxApp->activeGamepad)
		// keyboard input
		keyMap = &keyMapKeyboard;
	else if (dxApp->activeJoystick)
		// joystick input
		keyMap = &keyMapJoystick;
	else if (dxApp->activeGamepad)
		// gamepad input
		keyMap = &keyMapGamepad;

	if (keyMap == nullptr)
		return std::runtime_error("Critical error: Unable to deduce input device!");

	for (auto gameCommand : *keyMap)
	{
		oa << gameCommand.first;
		oa << gameCommand.second;
	}

	keyBindingsOut.close();

	// return success
	return { };
}
```

And here is the code to check for active game commands:

```cpp
util::Expected<void> InputHandler::update()
{
	// clear out any active bindings from the last frame
	bool isActive = false;
	activeKeyMap.clear();

	std::unordered_multimap<GameCommands, GameCommand*>* keyMap = nullptr;

	// get keyMap
	if (!dxApp->activeJoystick && !dxApp->activeGamepad)
		// keyboard input
		keyMap = &keyMapKeyboard;
	else if (dxApp->activeJoystick)
		// joystick input
		keyMap = &keyMapJoystick;
	else if (dxApp->activeGamepad)
		// gamepad input
		keyMap = &keyMapGamepad;

	if (keyMap == nullptr)
		return std::runtime_error("Critical error: Unable to find input device!");


	// loop through the map of all possible actions and find the active key bindings
	for (auto x : *keyMap)
	{
		if (x.second->chord.empty())
			continue;

		// test chord
		isActive = true;
		for (auto y : x.second->chord)
		{
			if (y.keyCode >= 0 && y.keyCode < 256)
			{
				// this is a keyboard or mouse chord
				if (getKeyState(y.keyCode) != y.keyState)
				{
					isActive = false;
					break;
				}
			}
			else if (y.keyCode >= 256 && y.keyCode < 293 && dxApp->activeJoystick)
			{
				// this is a joystick chord
				JoystickButtons jb = (JoystickButtons) (y.keyCode % 256);
				if (joystick->getButtonState(jb) != y.keyState)
				{
					isActive = false;
					break;
				}
			}
		}
			
		if (isActive)
			activeKeyMap.insert(std::pair<GameCommands, GameCommand&>(x.first, *x.second));
	}

	// if there is an active key map
	if (!activeKeyMap.empty())
	{
		// notify the currently active game states to handle the input
		if (!notify(this, false).wasSuccessful())
			return std::runtime_error("Critical error: game state was unable to handle user input!");
	}
	else
	{
		bool firstTime = true;
		if (firstTime)
		{
			// reset left mouse button
			kbm->currentState[1] = 0;
			kbm->previousState[1] = 0;
			firstTime = false;
		}

		if (listen)
		{
			// we are listening to specially requested user input
			newChordBindInfo.clear();

			// give the user the ability to "unbind" a key by pressing the "ESCAPE" key
			if (isPressed(VK_ESCAPE))
			{
				listen = false;			// stop listening ; produce normal input again
				notify(this, true);		// true: was listening to specially requested user input
				return {};				// all done
			}

			// now loop through all possible keys and check for changes
			for (unsigned int i = 0; i < 293; i++)
			{
				if (i >= 0 && i < 256)
				{
					// this is a keyboard or mouse key

					// we don't care which one of the shift or ctrl keys was pressed
					if (i >= 160 && i <= 165)
						continue;

					// push the keys the user is holding down to the chord
					if (getKeyState(i) == KeyState::StillPressed)
					{
						newChordBindInfo.push_back(BindInfo(i, getKeyState(i)));
						continue;
					}

					// now add those keys that have been pressed
					if (kbm->currentState[i] != kbm->previousState[i])	// only listen to key state changes
						newChordBindInfo.push_back(BindInfo(i, getKeyState(i)));
				}
				else if(dxApp->activeJoystick)
				{
					// this is a joystick key
					JoystickButtons button = (JoystickButtons) (i % 256);

					if (button == JoystickButtons::EndButtons || button == JoystickButtons::EndPOV)
						continue;

					if (joystick->getButtonState(button) == KeyState::StillPressed)
					{
						newChordBindInfo.push_back(BindInfo(i, joystick->getButtonState(button)));
						continue;
					}
						
					// now add those keys that have been pressed
					if (joystick->wasPressed(button) != joystick->isPressed(button))
						newChordBindInfo.push_back(BindInfo(i, joystick->getButtonState(button)));
				}
			}

			// if there is a new chord, we have to make sure that we are not overwriting an already existing chord
			if (!newChordBindInfo.empty())
			{
				// check for new chord to not overwrite other commands
				bool newChord = true;
				for (auto x : *keyMap)
				{
					// no chord at all -> continue
					if (x.second->chord.empty())
						continue;

					// different sizes -> can't be the same chord -> continue
					if (x.second->chord.size() != newChordBindInfo.size())
						continue;
					else
					{
						// check all key bindings
						bool allTheSame = true;
						for (unsigned int i = 0; i < newChordBindInfo.size(); i++)
						{
							if (x.second->chord[i].keyCode != newChordBindInfo[i].keyCode)
							{
								// the keys are different
								allTheSame = false;
								break;
							}
							else
							{
								// the keys are the same; check for their states
								if (x.second->chord[i].keyState != newChordBindInfo[i].keyState)
								{
									// the states are different -> check for pressed <-> released mismatch
									if (x.second->chord[i].keyState == KeyState::JustPressed && newChordBindInfo[i].keyState == KeyState::JustReleased)
									{
										// do nothing
										continue;
									}
									allTheSame = false;
									break;
								}
							}
						}
						if (allTheSame)
							newChord = false;
					}
				}


				if (!newChord)
					// the just pressed chord is already bound to a command -> clear and restart
					newChordBindInfo.clear();
				else
				{
					// we have a new chord ; notify if at least one of the keys was released, else: continue
					// this is necessary to capture multipe key presses, such as "CTRL" + A
					bool sendNotification = false;
					for (auto x : newChordBindInfo)
					{
						if (x.keyCode >= 0 && x.keyCode < 256)
						{
							// this is a keyboard or mouse button
							if (getKeyState(x.keyCode) == KeyState::JustReleased)
							{
								sendNotification = true;
								listen = false;
								break;
							}
						}
						else
						{
							// this is a joystick button
							JoystickButtons button = (JoystickButtons)(x.keyCode % 256);
							if (joystick->getButtonState(button) == KeyState::JustReleased)
							{
								sendNotification = true;
								listen = false;
								break;
							}
						}
					}

					if (sendNotification)
					{
						for (auto& x : newChordBindInfo)
						{
							if (x.keyState == KeyState::JustReleased)
								x.keyState = KeyState::JustPressed;
						}
						notify(this, true);
					}
				}
			}
		}
	}

	return {};
}
```

---

Not many other changes to the already existing code were needed, but you can download the source code
from [here](https://filedn.eu/ltgnTcOBnsYpGSo6BiuFrPL/Game%20Programming/Flatland/Input/directInput.7z) and check for
yourself.

---

Well, we haven't done much with our joystick device, but this should be a good enough start to do whatever you want with
DirectInput. As said at the beginning of this tutorial, if you are eager to learn more about Forcefeedback within
DirectInput, please refer to Chapter 9 of LaMothe's book.

I am sure you noticed how tedious it was to set up the joystick structure to work with gamepads. In the next tutorial,
we will learn how to use XInput to acquire and poll X-Box-like controllers / gamepads.

---

## References

(in alphabetic order)

* Game Programming Algorithms, by Sanjay Madhav
* Game Programming Patterns, by Robert Nystrom
* Microsoft Developer Network ([MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/ee663274(v=vs.85)))
* Tricks of the Windows Game Programming Gurus, by André LaMothe
* Wikipedia