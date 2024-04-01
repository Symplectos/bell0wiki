---
title: Hello, World!
description: This first tutorial on Windows programming focuses on the history of 32-bit applications by taking a closer look at the WinMain function.
---

> On the other side of the planet, the game programming community was still chanting „DOS TILL HELL FREEZES OVER!“, and I was out in front burning a Windows 3.1 box myself! However, in 1995 hell did start to freeze over …
> 
> -- André LaMothe

To start our journey, we create an empty Win32 project in Visual Studio and then, as tradition dictates, we let our program greet the world.

## WinMain
The WinMain function is the equivalent of the standard C main() function and as such it is [the starting, or entry point](https://en.wikipedia.org/wiki/Entry_point) of any Windows application written in C or C++:

```cpp
int WINAPI WinMain(HINSTANCE hInstance,
                   HINSTANCE hPrevInstance,
                   LPSTR lpCmdLine,
                   int nCmdShow);
```

The [MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/ff381406(v=vs.85).aspx) explains the strange WINAPI keyword as follows: *WINAPI is the calling convention. A calling convention defines how a function receives parameters from the caller.* 

Specifying WINAPI indicates the `__stdcall` calling convention. Low-level wise, a calling convention indicates how parameters are pushed onto the stack when the function is called and whether the calling function or the called function performs stack cleanup.

A `__stdcall` function has a fixed number of parameters and pushes them on the stack in reverse order (right to left), and thus the called function can perform the stack cleanup operation. This saves code space, as cleanup needs to be done only once per `__sdcall` function.

For further information on *Argument Passing* and *Calling Conventions*, have a look at the [corresponding MSDN entry](https://msdn.microsoft.com/en-us/library/984x0h58(v=vs.140).aspx).

Now let us have a look at the parameters of the Winmain function:

### HINSTANCE hInstance
This parameter is the instance handle that Windows generates for your application. An instance is, loosely speaking, a copy of an application. More precisely, an instance is a concrete occurrence of any object, existing usually during the runtime of a computer program. Since it is possible to do multitasking and to run multiple copies (instances) of the same program, Windows needs a way to keep track of all running programs (and its instances). This is done by giving each instance of any application a unique number. As soon as a program is executed, Windows creates this number and stores it into the HINSTANCE hInstance parameter.

### HINSTANCE hPrevInstance
It stands for a handle to the previous instance, that is, the handle of the last instance to be created. This is a relic of the past: it dates back to the old days, way back before 32-bit processors came into play, when multiple instances of the same program had to share the same memory space. That was obviously a bit more complicated, and programmers had an interest in detecting any running copies of their program. 

The following explanation is borrowed from [Raymond Chen](https://blogs.msdn.microsoft.com/oldnewthing/) from Microsoft:

In 16-bit Windows there was a function called GetInstanceData. This function took an HINSTANCE, a pointer, and a length, and copied memory from that instance into the current instance. Now, since 16-bit Windows had a common address space, the GetInstanceData function was really nothing more than a hmemcpy, and many programs relied on this and just used raw hmemcpy instead of using the documented API.

This was the reason to introduce the hPrevInstance parameter to WinMain. A non-null hPrevInstance was the instance handle of a copy of the program that was already running. Then GetInstanceData could be used to copy data from the already running program instance, for example, it was used to copy the main window handle out of the previous instance to be able to communicate with it.

Furthermore, whether hPrevInstance was NULL or not was used to identify the first copy of any program. That was important, as under 16-bit Windows, only the first instance of a program registered its classes; second and subsequent instances continued to use the classes that were registered by the first instance. Therefore, all 16-bit Windows programs skipped over class registration if hPrevInstance was non-NULL.

Now in 32-bit Windows instances were no longer a thing, and thus the designers had to answer one big question when porting WinMain: What to pass for hPrevInstance? The newly introduced separate address spaces meant that programs that skipped over reinitialization in the second instance would no longer work. Their solution was surprisingly simple: hPrevInstance was always set to NULL, thus making all programs believe that they are the first one.

And amazingly, this actually worked.

To take up [LaMothe](https://en.wikipedia.org/wiki/Andr%C3%A9_LaMothe)'s quote, at some point in the past
> Windows 95 was released, and it was a true 32-bit, multitasking, multi-threaded operating system. Granted, it had some 16-bit code left in it, but for the most part, Windows 95 was the ultimate development and release platform for the PC.

Nowadays, Windows still provides each application with its memory space, thus hPrevInstance is now obsolete. As explained, it only exists for backward compatibility and is equal to NULL in every application, despite the existence of other copies. For a method of detecting other running instances of a program, check the [MSDN](https://msdn.microsoft.com/de-de/library/windows/desktop/ms633559%28v=vs.85%29.aspx).

To quote LaMothe again: 
> This parameter is no longer used, but in past versions of Windows, it tracked the previous instance of the application (in other words, the instance of the application that launched the current one). No wonder Microsoft got rid of it! It's like time travelling, it gives me a headache thinking about it.

### LPSTR lpCmdLine
This is a long pointer to a string, similar to the command-line parameters of the standard C/C++ `main(int argc, char **argv)` function, except that there is not a separate parameter analogous to argc indicating the number of command-line parameters.

### int nCmdShow
This final parameter is simply an integer that is passed to the application during launch, indicating how the main application window is to be opened. For instance, this could call for the window being minimized or maximized. 

If an application displays a window for the first time, it should specify the SW_SHOWNORMAL flag, which, if necessary, restores the window to its original size and position and then simply activates and displays the window. Check the [MSDN](https://msdn.microsoft.com/de-de/library/windows/desktop/ms633559%28v=vs.85%29.aspx) for more information.

### Return Value
From the MSDN: If the function succeeds, terminating when it receives a *WM_QUIT* message, it should return the exit value contained in that message's *wParam* parameter. If the function terminates before entering the message loop, it should return zero. This is a bit cryptic, but it will become clear a few tutorials from now: Our program will simply return $0$ until we learn how to handle Windows events.

## Hello World!
The tradition of using the phrase „Hello world!“ as a test message was influenced by an example program in the seminal book *[The C Programming Language](http://s3-us-west-2.amazonaws.com/belllabs-microsite-dritchie/cbook/index.html)*. 

![Hello World](../../../../../assets/gamdev/windows/helloWorld.webp)

The example program from that book prints „hello, world“ and was inherited from a 1974 Bell Laboratories internal memorandum by [Brian Kernighan](http://www.cs.princeton.edu/~bwk/), Programming in C: A Tutorial, which contains the first known version.

We will close this tutorial with a „hello, world“ message in the Win32 environment. For information about the MessageBox function, check the [MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/ms645505%28v=vs.85%29.aspx).

```cpp
#include <windows.h>

int WINAPI WinMain(HINSTANCE hInstance,HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nShowCmd)
{
	MessageBox(NULL, L"Hello World!", L"bell0tutorial", MB_ICONEXCLAMATION | MB_OK);

	return 0;
}
```

## Literature
(in alphabetic order)
* [Microsoft Developer Network](https://msdn.microsoft.com/en-us/default.aspx)
* [The Old New Thing](https://blogs.msdn.microsoft.com/oldnewthing/), by Raymond Chen
* Tricks of the Windows Game Programming Gurus, by [André LaMothe](https://en.wikipedia.org/wiki/Andr%C3%A9_LaMothe)