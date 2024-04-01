---
title: Win-Framework For Games
description: This summarization concludes the introductory tutorials on Windows programming by giving an instruction on how to use the classes developed so far.
---

This tutorial concludes the introductory tutorials on Windows programming by summarizing everything that has been
discussed so far.

## The Utility Classes

The utility classes are helpful helpers to make the life of a game programmer a little easier.

### The String Converter Class

```cpp
class StringConverter
{
public:
	static std::wstring s2ws(const std::string& str);
	static std::string ws2s(const std::wstring& ws);
};
```

The static *StringConverter* class can be used to convert strings to widestrings and vice versa.

### The [Expected](../expected) Class

The expected class is used to enhance error and exception handling within our application.

### The [Log](../thread-safe-logger) Class

This class handles the logging of events. So far, in these tutorials, only a file logger has been implemented, writing
out a log file of game events to the My Documents folder.

### The [Service Locator](../thread-safe-logger) Class

The service locator class provides services to the entire application, without coupling anything together. So far, in
these tutorials, the service locator provides a file logging service. Later, it will surely see more use, for example,
when an audio service is implemented.

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
made available by Windows. It is automatically updated and used in the main game loop, and thus we do not really have to
worry about timing when proceeding with the upcoming tutorials.

```cpp
class Timer
{
private:
	// times measured in counts
	long long int startTime;			// time at the start of the application
	long long int totalIdleTime;		// total time the game was idle
	long long int pausedTime;			// time at the moment the game was paused last
	long long int currentTime;			// stores the current time; i.e. time at the current frame
	long long int previousTime;		    // stores the time at the last inquiry before current; i.e. time at the previous frame

	// times measured in seconds
	double secondsPerCount;			    // reciprocal of the frequency, computed once at the initialization of the class
	double deltaTime;					// time between two frames, updated during the game loop

	// state of the timer
	bool isStopped;					    // true iff the timer is stopped

public:
	// constructor
	Timer();
	~Timer();

	// getters: return time measured in seconds
	double getTotalTime() const;		// returns the total time the game has been running (minus paused time)
	double getDeltaTime() const;		// returns the time between two frames

	// methods
	util::Expected<void> start();		// starts the timer, called each time the game is unpaused
	util::Expected<void> reset();		// sets the counter to zero, called once before message loop
	util::Expected<void> tick();		// called every frame, lets the time tick
	util::Expected<void> stop();		// called when the game is paused
};
```

The following times are measured in *counts*, and are all updated automatically:

#### long long int startTime;

This is the time at the start of the application, or more precisely, the time at the moment the *reset* (see below)
function was called last. The *DirectXApp* class calls the *reset* function at the start of the game loop (see below),
and thus the start time will automatically be set to be the start of the game loop.

#### long long int totalIdleTime

This variable keeps track of the total time the game was idle, for example when the game is paused, or the game window
is minimized.

#### long long int pausedTime

This variable holds the last time the game was paused.

#### long long int currentTime

This variable is used to store the time at the current frame.

#### long long int previousTime

This variable stores the time at the last inquiry before the current frame, that is, the time at the previous frame.

---

The following times are measured in seconds:

#### double secondsPerCount

This double holds the number of seconds per count, computed by the reciprocal of the frequency. It is computed at the
initialization of the *Timer* class.

#### double deltaTime

This double member holds the time elapsed between the previous and the current frame, It is automatically updated and
used during the game loop. It is essential for correct behaviour of the physics engine.

---

#### bool isStopped

This boolean member is true if and only if the timer is paused. It is used to keep track of the total time the game was
idle.

#### Timer()

The constructor of the *Timer* class queries for the frequency of the high-performance counter, i.e. the number of
counts per second, and then computes the seconds per count as the reciprocal of the frequency. If initialization fails,
it throws a *std::runtime_error* exception.

#### ~Timer()

As always, the constructor does what detructors do.

#### double getTotalTime() const

This public constant function simply returns the total running time, in seconds, of the application, that is, the total
time minus the total idle time.

#### double getDeltaTime() const

This public constant function returns the time, in seconds, elapsed between two frames, it is used in the game loop and
essential for a robust physics engine.

#### util::Expected<void> reset()

This function sets the *startTime* of the *Timer* to the moment it was called. It is used just before the game loop to
set the start time to be the start of the game.

#### util::Expected<void> start()

This function starts the timer. It is automatically invoked each time the game becomes active again.

#### util::Expected<void> tick()

This function lets the timer tick by updating the *currentTime* and *previousTime* member variables. It is automatically
called at each frame during the game loop.

#### util::Expected<void> stop()

This function stops the timer, it is automatically invoked each time the game is paused.

## The Window Class

The *Window* class handles all Windows related stuff, such as creating the actual application window and handling all
event messages that the operating system might send to our application. With the *Window* class in place, we no longer
really have to care about Windows at all, we can simply program our game and forget about the operating system.

```cpp
class Window
{
private:
	HWND mainWindow;						// handle to the main window
	DirectXApp* dxApp;						// the core application class

	// resolution
	int clientWidth;						// desired client resolution
	int clientHeight;		

	// window states
	bool isMinimized;						// true iff the window is minimized
	bool isMaximized;						// true iff the window is maximized
	bool isResizing;						// true iff the window is being dragged around by the mouse

	util::Expected<void> init();			// initializes the window
    void readDesiredResolution();			// gets desired screen resolution from config file
    
public:
	// constructor and destructor
	Window(DirectXApp* dxApp);
	~Window();

	// getters
	inline HWND getMainWindowHandle() const { return mainWindow; };

	// the call back function
	virtual LRESULT CALLBACK msgProc(HWND hWnd, unsigned int msg, WPARAM wParam, LPARAM lParam);

	friend class DirectXApp;
};
```

Most members of the *Window* class are private, but the *DirectXApp*, as a friend, still has direct access to all of
them.

### HWND mainWindow

This is the handle to the main window of our application.

### DirectXApp* dxApp

This is a pointer to the main class of the application (see below).

### int clientWidth and int clientHeight

Those two members store the client dimension of the window.

### bool isMinimized

This boolean member is true if and only if the window is minimized

### bool isMaximized

This boolean member is true if and only if the window is maximized.

### bool isResizing

This boolean member is true if and only if the window is being dragged around by the mouse.

### util::Expected<void> init()

This private member function defines and initializes the main window. It is automatically called when the *DirectXApp*
class initializes.

### void readDesiredResolution()

This private function simply reads the desired screen resolution from
a [Lua configuration file](../lua-and-game-settings). This function is automatically called during window
initialization.

### Window(DirectXApp* dxApp)

The constructor of the *Window* class stores the pointer to the *DirectXApp* class in the appropriate member variable
and then calls the initialization function. If an error occurs, a *std::runtime_exception* is thrown. If the function is
successful, the main window handle is available in the *mainWindow* variable. The creation of the window is started by
the *DirectXApp* class.

### ~Window()

Well, the destructor does whatever destructors do, it destroys.

### inline HWND getMainWindowHandle() const

This little public constant function simply returns the main window handle.

### virtual LRESULT CALLBACK msgProc(HWND hWnd, unsigned int msg, WPARAM wParam, LPARAM lParam)

Last, but not least, behold the most important function of the *Window*
class, [the message procedure](../a-real-world-windows-application). The message
procedure [handles all the events](../handling-important-events) that Windows throws at our application, for example
when the window changes in size, or if the user tries to exit the application. To change the way events are handled,
this is the place to go to.

The following events are handled by the *Window* class at the moment:

* WM_ACTIVATE
* WM_CLOSE
* WM_DESTROY
* WM_ENTER(EXIT)SIZEMOVE
* WM_GETMINMAXINFO
* WM_KEYDOWN
* WM_MENUCHAR
* WM_SIZE

## The DirectXApp Class

This is the main component of all the core components. It keeps all the other systems together. Once again,
initialization is mostly automatic. We will soon see how to use the *DirectXApp* class to create an application of our
own.

The private members of the *DirectXApp* class can be seen as constant variables for the entire application. The only
class able to access them, is the befriended *Window* class. Not even the derived *Game* class, that we will talk about
next, can access or change most of those private members.

```cpp
class DirectXApp
{
private:
	// folder paths
	std::wstring pathToMyDocuments;			// path to the My Documents folder
	std::wstring pathToLogFiles;			// path to the folder containing log files
	std::wstring pathToConfigurationFiles;	// path to the folder containing the configuration files

	bool validConfigurationFile;			// true iff there was a valid configuration file at startup
	bool activeFileLogger;					// true iff the logging service was successfully registered
	bool hasStarted;						// true iff the DirectXApp was started completely

	// timer
	Timer* timer;							// high-precision timer
	int fps;								// frames per second
	double mspf;							// milliseconds per frame
	const double dt;						// constant game update rate
	const double maxSkipFrames;				// constant maximum of frames to skip in the update loop (important to not stall the system on slower computers)
												
	void calculateFrameStatistics();		// computes frame statistics

	// helper functions
	bool getPathToMyDocuments();			// stores the path to the My Documents folder in the appropriate member variable
	void createLoggingService();			// creates the file logger and registers it as a service
	bool checkConfigurationFile();			// checks for valid configuration file

protected:
	// application window
	const HINSTANCE appInstance;			// handle to an instance of the application
	const Window* appWindow;				// the application window (i.e. game window)

	// game state
	bool isPaused;							// true iff the game is paused

	// constructor and destructor
	DirectXApp(HINSTANCE hInstance);
	~DirectXApp();

	// initialization and shutdown
	virtual util::Expected<void> init();								// initializes the DirectX application
	virtual void shutdown(util::Expected<void>* expected = NULL);		// clean up and shutdown the DirectX application

	// acquire user input
	virtual void onKeyDown(WPARAM wParam, LPARAM lParam) const;			// handles keyboard input

	// game loop
	virtual util::Expected<int> run();		// enters the main event loop
	virtual void update(double dt);			// update the game world

	// resize functions
	virtual void onResize();				// resize game graphics

	// generating output
	virtual void render(double farseer);	// renders the game world

	// getters
	bool fileLoggerIsActive() const { return activeFileLogger; }	    // returns true iff the file logger is active

public:
	friend class Window;
};
```

The following member variables and functions are private, thus only accessible by the *DirectXApp* class and its friend
class, the *Window* class.

### std::wstring pathToMyDocuments

This wide string holds the location of the *My Documents* folder.

### std::wstring pathToLogFiles

This wide string holds the path to the desired location to store the game log files. The default is: *My
Documents/bell0bytes/bell0tutorials/Logs/*.

### std::wstring pathToConfigurationFiles

This wide string holds the path to the desired location of the game configuration files. The default location is: *My
Documents/bell0bytes/bell0tutorial/Settings/*.

### bool validConfigurationFile

This boolean member is true if and only if a valid configuration file was present at the moment the application started.
If there was no previous configuration file, the *DirectXApp* creates one with default settings.

### bool activeFileLogger

This boolean member is true if and only if the file logger was created successfully. It is used to tell the cleanup
functions whether the file logger is available to log errors or not.

### bool hasStarted

This boolean member is true if and only if the *DirectXApp* class was initialized completely. It is used to delay taking
certain actions after encountering Windows events while initializing.

### Timer* timer

This is a pointer to a high-precision timer encapsulated in the above mentioned *Timer* class. The timer is
automatically created and initialized at the initialization of the *DirectXApp*.

### int fps

This integer holds the current frames per second, it is automatically updated during the game loop, when the frame
statistics are computed.

### double mspf

This double precision float holds the milliseconds it took to process the current frame. It is automatically updated
during the game loop when the game statistics are computed.

### const double dt

This constant double precision float is of utmost importance, as it defines the desired update frequency of the game
world. For further details, re-read the [tutorial about the game loop](../the-game-loop/). By default, this member is
set to $d_t := 4.16 \approx \frac{25}{6}$, which is equivalent to $240$ frames per second.

### const double maxSkipFrames

This double precision float makes sure the game world is not updated too often per frame on slow computers. Re-read
the [tutorial about the game loop](../the-game-loop/) for further details. By default, this is set to $10$
meaning that as long as the game runs with at least $24$fps, the game world is updated normally, else we break out of
the update loop after ten iterations to not stall the entire system. Note that this variable must be set dependently of
the above *dt* variable.

### void calculateFrameStatistics()

This private member function is called during the game loop to compute frame statistics, while doing so, it updates the
*fps* and *mspf* member variables.

### bool getPathToMyDocuments()

This private member function is automatically called during initialization to retrieve the path to the *My Documents*
folder. The retrieved path is stored in the *pathToMyDocuments* member variable. It then creates and stores the two
other path variables in the appropriate variables.

### void createLoggingService()

This private member function is automatically called during initialization to start the file logging service.

### bool checkConfigurationFile()

This private member function is automatically called at initialization to check for a valid configuration file. If no
such file can be found, a configuration file with default settings is created.

---

The following member variables are protected, thus also available to derived classes.

### const HINSTANCE appInstance

This is the handle to the actual instance of this application, handed to us by the WinMain function.

### const Window* appWindow

This is a pointer to a constant instance of the *Window* class. The *Window* instance is automatically created at the
initialization of the *DirectXApp* class.

### bool isPaused

This boolean is true if and only if the game is paused.

### DirectXApp(HINSTANCE hInstance)

The constructor of the *DirectXApp* class stored the instance handle of the application and initializes most member
variables to their default settings. The actual game initialization must be started manually from a derived class (see
below).

### ~DirectXApp()

The destructor destroys.

### virtual util::Expected<void> init()

This protected virtual member function initializes the *DirectXApp*, and as such, the entire game:

```cpp
util::Expected<void> DirectXApp::init()
{
	// get path to My Documents folder
	if (!getPathToMyDocuments())
	{
		// show error message on a message box
		MessageBox(NULL, L"Unable to retrieve the path to the My Documents folder!", L"Critical Error!", MB_ICONEXCLAMATION | MB_OK);
		return std::runtime_error("Unable to retrieve the path to the My Documents folder!");
	}
		
	// create the logger
	try { createLoggingService(); }
	catch(std::runtime_error) 
	{
		// show error message on a message box
		MessageBox(NULL, L"Unable to start the logging service!", L"Critical Error!", MB_ICONEXCLAMATION | MB_OK);
		return std::runtime_error("Unable to start the logging service!");
	}

	// check for valid configuration file
	if (!checkConfigurationFile())
		util::ServiceLocator::getFileLogger()->print<util::SeverityType::warning>("Non-existent or invalid configuration file. Starting with default settings.");

	// create the game timer
	try { timer = new Timer(); }
	catch (std::runtime_error)
	{
		return std::runtime_error("The high-precision timer could not be started!");
	}

	// create the application window
	try { appWindow = new Window(this); }
	catch (std::runtime_error)
	{
		return std::runtime_error("DirectXApp was unable to create the main window!");
	}

	// log and return success
	hasStarted = true;
	util::ServiceLocator::getFileLogger()->print<util::SeverityType::info>("The DirectX application initialization was successful.");
	return {};
}
```

If initialization fails, it returns an *Expected* with a nasty runtime error inside.

### virtual void shutdown(util::Expected<void>* expected = NULL)

This protected virtual function cleans up all the allocated resources. If the application had to quit with an error, the
error is printed to the log file, if possible.

### virtual void onKeyDown(WPARAM wParam, LPARAM lParam) const

This protected constant virtual functions acts whenever a *WM_KEYDOWN* message is received, that it, it is invoked by
the window procedure function in the *Windows* class. By default, it ends the application if the *ESCAPE* key is
pressed.

### virtual util::Expected<int> run()

This is the heart of any game, [the game loop](../the-game-loop/). This functions enters the game loop and iterates
until the user desires to quit the game. All the game action happens here:

```cpp
	util::Expected<int> DirectXApp::run()
{
#ifndef NDEBUG
	util::ServiceLocator::getFileLogger()->print<util::SeverityType::info>("Entering the game loop...");
#endif
	// reset (start) the timer
	timer->reset();

	double accumulatedTime = 0.0;		// stores the time accumulated by the rendered
	int nLoops = 0;						// the number of completed loops while updating the game

	// enter main event loop
	bool continueRunning = true;
	MSG msg = { 0 };
	while(continueRunning)
	{
		// peek for messages
		while(PeekMessage(&msg, NULL, 0, 0, PM_REMOVE))
		{
			TranslateMessage(&msg);
			DispatchMessage(&msg);

			if (msg.message == WM_QUIT)
			{
				continueRunning = false;
				break;
			}
		}

		// let the timer tick
		timer->tick();

		if (!isPaused)
		{
			// compute fps
			calculateFrameStatistics();

			// acquire input

			// accumulate the elapsed time since the last frame
			accumulatedTime += timer->getDeltaTime();
				
			// now update the game logic with fixed dt as often as possible
			nLoops = 0;
			while (accumulatedTime >= dt && nLoops < maxSkipFrames)
			{
				update(dt);
				accumulatedTime -= dt;
				nLoops++;
			}
				
			// peek into the future and generate the output
			render(accumulatedTime / dt);
		}
	}
#ifndef NDEBUG
	util::ServiceLocator::getFileLogger()->print<util::SeverityType::info>("Leaving the game loop...");
#endif
	return (int)msg.wParam;
}
```

### virtual void update(double dt)

This function updates the game world based on a fixed frequency $\delta_t$,
re-read [the tutorial about the game loop](../the-game-loop/) for more details.

### virtual void onResize()

This function is invoked whenever the game window is resized, for now, the function is empty, but eventually it will
call on *Direct3D* to resize the graphics of the game.

### virtual void render(double farseer)

This function peeks into the future to render a scene of the game world,
re-read [the tutorial about the game loop](../the-game-loop/) for more details. For now this function is still empty,
eventually though it will use *Direct3D* to render the game world.

### bool fileLoggerIsActive() const

This constant function returns true if and only if the file logging service is active.

## Putting It All Together

To use the power of the *DirectXApp* class, we create a derived class, the *DirectXGame* class.

### The DirectXGame Class

To specify and use the *DirectXApp* class, a derived class must be created, like this:

```cpp
class DirectXGame : core::DirectXApp
{
public:
	// constructor and destructor
	DirectXGame(HINSTANCE hInstance);
	~DirectXGame();

	// override virtual functions
	util::Expected<void> init() override;								// game initialization
	void shutdown(util::Expected<void>* expected = NULL) override;		// cleans up and shuts the game down (handles errors)

	// run the game
	util::Expected<int> run() override;
};
```

#### DirectXGame(HINSTANCE hInstance)

The constructor must pass the handle to application instance to the *DirectXApp* class:

```cpp
DirectXGame::DirectXGame(HINSTANCE hInstance) : DirectXApp(hInstance) { }
```

#### ~DirectXGame()

The destructor destroys.

#### util::Expected<void> init() override

To initialize the game, we can simply call the initialization function of the *DirectXApp* class:

```cpp
util::Expected<void> DirectXGame::init()
{
	// initialize the core DirectX application
	util::Expected<void> applicationInitialization = DirectXApp::init();
	if (!applicationInitialization.wasSuccessful())
		return applicationInitialization;

	// log and return success
	util::ServiceLocator::getFileLogger()->print<util::SeverityType::info>("Game initialization was successful.");
	return {};
}
```

#### void shutdown(util::Expected<void>* expected = NULL) override

To clean up and shut down the game we must override the *DirectXApp::shutdown* function, like this, for example.

```cpp
void DirectXGame::shutdown(util::Expected<void>* expected)
{
	// check for error message
	if (expected != NULL && !expected->isValid())
	{
		// the game was shutdown by an error
		// try to clean up and log the error message
		try
		{
			// do clean up

			// throw error
			expected->get();
		}
		catch (std::runtime_error& e)
		{
			// create and print error message string (if the logger is available)
			if (DirectXApp::fileLoggerIsActive())
			{
				std::stringstream errorMessage;
				errorMessage << "The game is shutting down with a critical error: " << e.what();
				util::ServiceLocator::getFileLogger()->print<util::SeverityType::error>(std::stringstream(errorMessage.str()));
			}
			return;
		}
	}

	// no error: clean up and shut down normally
	util::ServiceLocator::getFileLogger()->print<util::SeverityType::info>("The game was shut down successfully.");
}
```

If there was an error, we still try to cleanup and if the logger is active, we write the actual error message to the log
file. Else, we simply clean up the game.

#### util::Expected<int> run() override

To run the game, to enter the main game loop, we simply call the appropriate *DirectXApp* function:

```cpp
util::Expected<int> DirectXGame::run()
{
	// run the core DirectX application
	return DirectXApp::run();
}
```

### WinMain

All that is left is for the WinMain function to create the game class and then we are ready to rock and roll:

```cpp
int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nShowCmd)
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
		game.shutdown(&(util::Expected<void>)returnValue);

		// gracefully return
		return returnValue.get();
	}
	else
	{
		// a critical error occured during initialization, try to clean up and to print information about the error
		game.shutdown(&gameInitialization);
		
		// humbly return with an error
		return -1;
	}
}
```

Note, or remember, that the *shutdown* function actually handles the error that might be returned from the *run*
function.

---

You can download the source code
from [here](https://filedn.eu/ltgnTcOBnsYpGSo6BiuFrPL/Game%20Programming/Fundamentals/Windows/framework.7z).

And that's it, nice, clean and easy. With all this Windows stuff abstracted and encapsulated in delightful little
classes, in the next batch of tutorials, we will safely explore adding DirectX components to our application. Stay
tuned!

## References

(in alphabetic order)

* Game Programming Algorithms and Techniques, by Sanjay Madhav
* Game Programming Patterns, by Robert Nystrom
* Introduction to 3D Game Programming with DirectX 11, by Frank D. Luna
* Microsoft Developer Network ([MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/ee663274(v=vs.85)))
* Tricks of the Windows Game Programming Gurus, by André LaMothe
