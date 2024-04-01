---
title: Of Icons and Cursors
description: Windows allows the storage of custom data alongside the program code, which can then be loaded at runtime by the program itself.
---

Windows allows the storage of more than just the program code in an application. Using *resources*, Windows allows the
combination of pieces of data with program code, which can then be loaded during runtime by the program itself.

This tutorial will cover two examples of this: Custom icons and custom cursors.

## Icon Resources

To work with resources, two files need to be created, an .rc file and a .h file. Thankfully the Visual Studio IDE does
all the dirty work, and thus I won't go into any details, which could be looked up in LaMothe's book, if necessary.

To create or load an icon, right-click on *Resource files* in the *Solution Explorer* and then select *Add Resource*.
Everything else should then be self-explanatory.

The resource.h looks like this:

```cpp
// ICONS
#define IDI_BARKING_DOG            101
```

Now to load an icon into an application, the newly created `resouce.h` file must be included into the project and then
the following two lines in the window creation process must be changed:

```cpp
...
	wc.hIcon = (HICON)LoadImage(dxApp->appInstance, MAKEINTRESOURCE(IDI_BARKING_DOG), IMAGE_ICON, LR_DEFAULTSIZE, LR_DEFAULTSIZE, LR_DEFAULTCOLOR | LR_SHARED);

    wc.hIconSm = (HICON)LoadImage(dxApp->appInstance, MAKEINTRESOURCE(IDI_BARKING_DOG), IMAGE_ICON, LR_DEFAULTSIZE, LR_DEFAULTSIZE, LR_DEFAULTCOLOR | LR_SHARED);

...
```

The [LoadImage function](https://msdn.microsoft.com/en-us/library/windows/desktop/ms648045(v=vs.85).aspx) loads an icon,
cursor, or a bitmap and returns a handle to that resource:

```cpp
HANDLE WINAPI LoadImage(
  _In_opt_ HINSTANCE hinst,
  _In_     LPCTSTR   lpszName,
  _In_     UINT      uType,
  _In_     int       cxDesired,
  _In_     int       cyDesired,
  _In_     UINT      fuLoad
);
```

### HINSTANCE hInst

As always, this is a handle to an instance, in this case, the handle to the module of the executable file that wants to
contains the image to be loaded. We simply pass the handle to the instance of our application.

### LPCTSTR lpszName

This long pointer to a constant string takes the location of the image to be loaded.
The [MAKEINTRESOURCE](https://msdn.microsoft.com/en-us/library/windows/desktop/ms648029(v=vs.85).aspx) macro converts an
integer value to a resource type compatible with the resource-management functions, and can be used in place of a string
containing the name of the resource.

### UINT uType

This unsigned int defines the type of the image to be loaded; it can be set to one of the following values:
*IMAGE_BITMAP*, *IMAGE_CURSOR* or *IMAGE_ICON*.

### int cxDesired and int cyDesired

Those parameters define the width and height, in pixels, of the resource to load. We simply set this to use the default
size.

### UINT fuLoad

This unsigned int defines further behaviour of the icon to be loaded. Check the MSDN for all possible flags, in this
tutorial we used *LR_DEFAULTCOLOR*, which simply means that the icon is not monochromatic, and *LR_SHARED*, which shares
the image handle if the image is loaded multiple times.

## Cursor Resources

Loading a custom cursor is equally simple. To create or load a cursor, right-click on *Resource files* in the *Solution
Explorer* and then select *Add Resource*. Everything else should then be self-explanatory.

The resource.h file now looks like this:

```cpp
// ICONS
#define ID_ICON_BARKING_DOG            101

// CURSORS
#define ID_CURSOR_PROTOSS              102
#define ID_CURSOR_TERRAN               103
```

Now to load the cursor, one line must be changed in the window definition process:

```cpp
...
	wc.hCursor = (HCURSOR)LoadImage(dxApp->appInstance, MAKEINTRESOURCE(ID_CURSOR_TERRAN), IMAGE_CURSOR, LR_DEFAULTSIZE, LR_DEFAULTSIZE, LR_DEFAULTCOLOR | LR_SHARED);
...
```

## Putting It All Together

For this tutorial, only the custom icon has been added to the application. You can download the source code
from [here](https://filedn.eu/ltgnTcOBnsYpGSo6BiuFrPL/Game%20Programming/Fundamentals/Windows/icons.7z).

And that's it already. Easy.

For more information on this topic, have a look at the third chapter of LaMothe's book.

---

The next tutorial will give a brief summary of the framework we created and an instruction on how to use it.

---

# References:

* Tricks of the Windows Game Programming Gurus, by André LaMothe
* Microsoft Developer Network ([MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/ee663274(v=vs.85)))