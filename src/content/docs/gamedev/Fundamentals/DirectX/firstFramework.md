---
title: A First DirectX-Framework
description: This tutorial summarizes everything that has been discussed so far.
---

> The secret of life, though, is to fall seven times and to get up eight times.
>
> – Paulo Coelho, The Alchemist

This chapter concludes the introductory tutorials and summarizes everything that has been discussed so far. After having
erred for many hours and after countless mistakes, there finally is a robust game framework for future projects. For
further details about the different aspects of the framework, please refer to the appropriate tutorial chapters.

## The Utility Classes

The utility classes are helpful helpers to make the life of a game programmer a little bit easier.

### The String Converter Class

```cpp
class StringConverter
{
public:
	static std::wstring s2ws(const std::string& str);
	static std::string ws2s(const std::wstring& ws);
};
```

The static *StringConverter* class, defined in *stringConverter.h* can be used to convert strings to widestrings and
vice versa.

### The [Expected](../expected) Class

The expected class, defined in *expected.h* is used to enhance error and exception handling within the application.

### The [Log](../thread-safe-logger) Class

This class, defined in *log.h*, handles the logging of events. So far, in these tutorials, only a file logger has been
implemented, writing out a log file of game events to the My Documents folder.

### The [Service Locator](../thread-safe-logger) Class

The service locator class, defined in *serviceLocator.h*, provides services to the entire application, without coupling
anything together. So far, in these tutorials, the service locator provides a file logging service. Later, it will
surely see more use, for example, when an audio service is implemented.

```cpp
class ServiceLocator
{
private:
	static std::shared_ptr<Logger<FileLogPolicy> > fileLogger;		// the file logger
		
public:
	// file logging services
	static Logger<FileLogPolicy>* getFileLogger() { return fileLogger.get(); };									// returns the file logger
	static void provideFileLoggingService(const std::shared_ptr<Logger<FileLogPolicy> > providedFileLogger);	// sets the file logging service to the given logger
};
```

Here is an example of how to use the service locator to retrieve the file logger and to print information to the log
file:

```cpp
util::ServiceLocator::getFileLogger()->print<util::SeverityType::info>("This is an information message.");
```

## The Core Classes

Those are the core components of our application. They are invaluable to any Windows program.

### The Timer Class

[Keeping track of time](../keeping-track-of-time) is highly important for any game, especially if a mathematical
simulation of a physical world is intended. The timer class does just that, by encapsulating a high-performance counter
made available by Windows. It is automatically updated and used in the main game loop.

### The Window Class

The [window class](../a-real-world-windows-application) initializes the main window
and [handles Windows messages](handling-important-events/). Basically, this class hides all the nasty Windows stuff,
such that it will later on be easier to fully focus on programming the game, without worrying about Windows.

## [The DirectXApp Class](https://bell0bytes.eu/a-framework-for-windows-games/)

This is the central engine for the entire project — it initializes and connects all the other classes together. To quit
the application, press the *ESCAPE* key. To switch between full-screen and windowed mode, press *ALT+ENTER*. To change
the resolution, press *PAGE_DOWN* (lower resolution) or *PAGE_UP* (higher resolution). To show or hide the FPS
information, press *F1*.

## The Game Class

Derived of a DirectX Application, the game class is the main entry point to the game. Here all the data is initialized,
the game world is updated and finally rendered to the screen.

```cpp
int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE /*hPrevInstance*/, LPSTR /*lpCmdLine*/, int /*nShowCmd*/)
{
	// create and initialize the game
	DirectXGame game(hInstance);
	util::Expected<void> gameInitialization = game.init();

	// if the initialization was successful, run the game, else, try to clean up and exit the application
	if (gameInitialization.wasSuccessful())
	{
		// initialization was successful -> run the game
		util::Expected<int> returnValue = game.run();

		// clean up after the game has ended
		util::Expected<void> convertedReturnValue(returnValue);
		game.shutdown(&convertedReturnValue);

		// gracefully return
		if (returnValue.isValid())
			return returnValue.get();
		else
			return -1;
	}
	else
	{
		// a critical error occured during initialization, try to clean up and to print information about the error
		game.shutdown(&gameInitialization);
		
		// humbly return with an error
		return -1;
	}
}

class DirectXGame : core::DirectXApp
{
private:

public:
	// constructor and destructor
	DirectXGame(HINSTANCE hInstance);
	~DirectXGame();

	// override virtual functions
	util::Expected<void> init() override;								// game initialization
	void shutdown(util::Expected<void>* expected = NULL) override;		// cleans up and shuts the game down (handles errors)
	util::Expected<int> update(double dt);								// update the game world
	util::Expected<int> render(double farSeer);							// render the scene

	// create graphics
	util::Expected<void> initGraphics();								// initializes graphics

	// run the game
	util::Expected<int> run() override;
};

```

### DirectXGame(HINSTANCE hInstance)

The constructor takes the instance handle of the application and passes it to the constructor of the DirectXApp class.

### ~DirectXGame()

During deconstruction, all pointers to graphical elements (such as buffers or vertices of our objects) and sounds, are
deleted.

### util::Expected<void> init() override

This method initializes the game, by first initializing the DirectXApp class (which then initializes all the other
classes and binds them together) and then all other components, for example, graphics and sounds, are created.

### void shutdown(util::Expected<void>* expected = NULL) override

This method cleans up and shuts the game down, it also handles error messages.

### util::Expected<int> update(double dt)

This function updates the game world based on the laws of mathematics and physics.

### util::Expected<int> render(double farSeer)

This method renders the current, updated scene to the screen.

### util::Expected<void> initGraphics()

This function initializes the game graphics that are needed at the start of the game.

### util::Expected<int> run() override

This method calls the run method of the DirectXApp, thus entering the main event loop.

## Graphics Classes

Those classes handle everything that is related to graphical processing.

### Direct3D

This class is the graphical workhorse of the application. Most of the core graphical freatures of DirectX are found in
this class: switching between full-screen and windowed mode, changing the resolution to computing antialiasing and depth
buffering, …

```cpp
namespace graphics
{
	// structure to hold vertex data
	struct VERTEX
	{
		float x, y, z;						// position
		float r, g, b;						// colour
	};

	// shader buffer
	struct ShaderBuffer
	{
		BYTE* buffer;
		int size;
	};

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

		// Shader interfaces
		Microsoft::WRL::ComPtr<ID3D11VertexShader> standardVertexShader;	// the vertex shader
		Microsoft::WRL::ComPtr<ID3D11PixelShader> standardPixelShader;		// the pixel shader
	
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

		// helper functions
		util::Expected<void> writeCurrentModeDescriptionToConfigurationFile();	// write the current screen resolution to the configuration file
		util::Expected<void> readConfigurationFile();			// read preferences from configuration file
		
		// functions to create resources
		util::Expected<void> createResources();					// create device resources, such as the swap chain
		util::Expected<void> onResize();						// resize the resources

		// rendering pipeline
		util::Expected<void> initPipeline();					// initializes the (graphics) rendering pipeline

		// shaders
		util::Expected<ShaderBuffer> loadShader(std::wstring filename);	// read shader data from .cso files

		// present the scene
		void clearBuffers();									// clear the back and depth/stencil buffers
		util::Expected<int> present();							// present the chain, by flipping the buffers

	public:
		// constructor
		Direct3D(core::DirectXApp* dxApp);
		~Direct3D();

		friend class core::DirectXApp;
		friend class Direct2D;
		friend class DirectXGame;
		friend class core::Window;
	};
}
```

#### Vertices

A vertex represents a vector in $\mathbb{R}^3$. The x, y, z define its position and the r, g ,b its colour (
red-green-blue).

#### ShaderBuffer

This structure holds the data read from a pre-compiled shader object.

---

All of its members are private, thus only available to friendly classes.

#### core::DirectXApp* dxApp

This member stores the pointer to the main application class.

#### Microsoft::WRL::ComPtr<ID3D11Device> dev

This is a COM pointer to an interface of the actual Direct3D device.

#### Microsoft::WRL::ComPtr<ID3D11DeviceContext> devCon

This member is a COM pointer to the context of the Direct3D device.

#### Microsoft::WRL::ComPtr<IDXGISwapChain> swapChain

This is a COM pointer to the swap chain.

#### Microsoft::WRL::ComPtr<ID3D11RenderTargetView> renderTargetView

A COM pointer to the rendering target.

#### Microsoft::WRL::ComPtr<ID3D11DepthStencilView> depthStencilView

This member holds a COM pointer to the depth and stencil buffer.

#### Microsoft::WRL::ComPtr<ID3D11VertexShader> standardVertexShader

A COM pointer to the standard vertex shader.

#### Microsoft::WRL::ComPtr<ID3D11PixelShader> standardPixelShader

A COM pointer to the pixel shader.

#### DXGI_FORMAT desiredColourFormat

This member holds the desired colour format for the application to use. The default is: DXGI_FORMAT_B8G8R8A8_UNORM.

#### unsigned int numberOfSupportedModes

This member stores the number of screen modes that are supported by the GPU, for the above specified desired colour
format.

#### DXGI_MODE_DESC* supportedModes

This member holds a list of all supported screen modes for the desired colour format.

#### DXGI_MODE_DESC  currentModeDescription

This is a description of the currently active screen mode.

#### unsigned int currentModeIndex

This member stores the index of the current mode in the list of all supported screen modes.

#### bool startInFullscreen

This boolean is true if and only if the game should start in full-screen mode.

#### BOOL currentlyInFullscreen

This boolean is true if and only if the game is currently in full-screen mode.

#### bool changeMode

This boolean is true if and only if the screen resolution should be changed in this frame.

---

The following methods are private.

#### void changeResolution(bool increase)

This function changes the screen resolution, if increase is true, a higher resolution is chosen, else the resolution is
lowered.

#### util::Expected<void> writeCurrentModeDescriptionToConfigurationFile()

This method writes the current screen resolution to the configuration file.

#### util::Expected<void> readConfigurationFile()

This method reads the preferences from the configuration file.

#### util::Expected<void> createResources()

This method creates the main Direct3D interface and everything else related to it, such as, for example, the device
context and the swap chain.

#### util::Expected<void> onResize()

This method handles the resizing of all the graphical resources; i.e. it syncs the render target with the refresh rate
of the monitor, and it initializes (or re-creates) all resolution dependent Direct3D objects, such as the render view
and the depth/stencil buffers.

#### util::Expected<void> initPipeline()

This function initializes the (graphics) rendering pipeline by loading the pre-compiled shader objects and setting them
as the active shaders.

#### util::Expected<ShaderBuffer> loadShader(std::wstring filename)

This is a helper function to read shader data from .cso files.

#### void clearBuffers()

This method clears the back and depth/stencil buffers.

#### util::Expected<int> present()

This method presents the chain, by flipping the buffers.

---

The following methods are public, and automatically invoked by the DirectXApp class.

#### Direct3D(core::DirectXApp* dxApp)

The constructor takes a pointer to the actual application and stores it in the appropriate member variable. It then
calls the createDeviceResources method.

#### ~Direct3D()

The destructor leaves fullscreen mode and deletes all used pointers.

### Direct2D and DirectWrite

This class initializes Direct2D and DirectWrite. This comes in handy to write information to the screen, for debugging,
for example, or to create a simple GUI.

```cpp
namespace graphics
{
	class Direct2D
	{
	private:
		core::DirectXApp* dxApp;								// pointer to the main application class

		Microsoft::WRL::ComPtr<IDWriteFactory2> writeFactory;	// pointer to the DirectWrite factory
		Microsoft::WRL::ComPtr<ID2D1Factory2> factory;			// pointer to the Direct2D factory
		Microsoft::WRL::ComPtr<ID2D1Device1> dev;				// pointer to the Direct2D device
		Microsoft::WRL::ComPtr<ID2D1DeviceContext1> devCon;		// pointer to the device context
		
		util::Expected<void> createDevice();					// creates the device and its context
		util::Expected<void> createBitmapRenderTarget();		// creates the bitmap render target, set to be the same as the backbuffer already in use for Direct3D
		util::Expected<void> initializeTextFormats();			// initializes the different formats, for now, only a format to print FPS information will be created

	public:
		// constructors
		Direct2D(core::DirectXApp* dxApp);
		~Direct2D();

		// brushes
		Microsoft::WRL::ComPtr<ID2D1SolidColorBrush> yellowBrush;
		Microsoft::WRL::ComPtr<ID2D1SolidColorBrush> whiteBrush;
		Microsoft::WRL::ComPtr<ID2D1SolidColorBrush> blackBrush;

		// text formats
		Microsoft::WRL::ComPtr<IDWriteTextFormat> textFormatFPS;

		// text layouts
		Microsoft::WRL::ComPtr<IDWriteTextLayout> textLayoutFPS;

		util::Expected<void> printFPS();						// prints fps information to the screen

		friend class core::DirectXApp;
		friend class Direct3D;
	};
}
```

---

The following members are private, thus only available to friendly classes.

#### core::DirectXApp* dxApp

A pointer to the main application class.

#### Microsoft::WRL::ComPtr<IDWriteFactory2> writeFactory

A COM pointer to an interface of the DirectWrite factory.

#### Microsoft::WRL::ComPtr<ID2D1Factory2> factory

A COM pointer to an interface of the Direct2D factory.

#### Microsoft::WRL::ComPtr<ID2D1Device1> dev

A COM pointer to an interface of the actual Direct2D object.

#### Microsoft::WRL::ComPtr<ID2D1DeviceContext1> devCon;

A COM pointer to the context of the above mentioned Direct2D object.

#### DirectXApp* dxApp

A pointer to the DirectX class.

---

The following members, mostly brushes, are publicly available.

#### Microsoft::WRL::ComPtr<ID2D1SolidColorBrush> yellowBrush

#### Microsoft::WRL::ComPtr<ID2D1SolidColorBrush> whiteBrush

#### Microsoft::WRL::ComPtr<ID2D1SolidColorBrush> blackBrush

COM pointer to yellow, white and black brushes.

#### Microsoft::WRL::ComPtr<IDWriteTextFormat> textFormatFPS

A COM pointer to the text format for the FPS debug information.

#### Microsoft::WRL::ComPtr<IDWriteTextLayout> textLayoutFPS

A COM pointer to the text layout for the FPS debug information.
    
---

The following methods are private.

#### util::Expected<void> createDevice()

This method creates and initializes the main Direct2D and DirectWrite objects.

#### util::Expected<void> createBitmapRenderTarget()

This function creates the bitmap render target, set to be the same as the backbuffer already in use for Direct3D, that
is, the function creates a bitmap target and sets DirectWrite to write to the Direct3D back buffer.

#### util::Expected<void> initializeTextFormats()

This function initializes all text formats.
    
---

The following methods are public and automatically invoked by the DirectXApp class.

#### Direct2D(core::DirectXApp* dxApp)

The constructors takes a pointer to the actual DirectX application and stores it in the appropriate member variable. It
then calls the createDevice() and initTextFormats() methods.

#### ~Direct2D()

The destructor does what destructors do. It destroys.

#### util::Expected<void> printFPS()

This method is responsible for printing the fps information to the screen.

---

## The Helper Class

```cpp
namespace graphics
{
	// function to create a "random" float between 0.0f and 1.0f
	static inline float randomColour()
	{
		return static_cast <float> (rand()) / (static_cast <float> (RAND_MAX));
	}

	// function to create a "random" float between -1.0f and 1.0f
	static inline float randomPosition()
	{
		return  static_cast <float> (rand()) / (static_cast <float> (RAND_MAX)) * 2 - 1;
	}
}
```

---

Download the source
code [here](https://filedn.eu/ltgnTcOBnsYpGSo6BiuFrPL/Game%20Programming/Fundamentals/DirectX/firstDirectXFramework.7z).

## References

* Game Programming Algorithms and Techniques, by Sanjay Madhav
* Game Programming Patterns, by Robert Nystrom
* Introduction to 3D Game Programming with DirectX 11, by Frank D. Luna
* Microsoft Developer Network ([MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/ee663274(v=vs.85)))
* Tricks of the Windows Game Programming Gurus, by André LaMothe