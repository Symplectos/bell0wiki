---
title: A Thread-Safe Logger
description: This tutorial explains how to program a customizable, lightweight and thread-safe event logger in C++.
---

> Under observation, we act less free, >which means we effectively are less free.
>
> -- Edward Snowden

This tutorial, as was the previous one, is optional in the sense that it is not needed to understand Windows or game
programming. Yet to be able to easier debug a program, a robust, yet lightweight, event logger, such that every class in
the engine can provide a trace of its execution in a log file, is needed.

Obviously such a logging system must be very resilient, as like the captain of a sinking ship, it must stay *on board*
until the very end. It should also be able to write out warnings of different severity levels (warning, debug,
errors, …) to various output channels.

## Logging Policy

Customizability is achieved by a purely abstract class called logging policy. A logging policy defines where messages
will be printed to.

```cpp
class LogPolicyInterface
{
public:
		virtual ~LogPolicyInterface() noexcept = default;

		virtual bool openOutputStream(const std::wstring& name) = 0;
		virtual void closeOutputStream() = 0;
		virtual void write(const std::string& msg) = 0;
};
```

Now, for example, to create a file logger policy, it is enough to simply inherit from LogPolicyInterface and to specify
a file on the hard drive to write out to:

```cpp
// implementation of a policy to write to a file on the hard drive
class FileLogPolicy : public LogPolicyInterface
{
private:
	std::ofstream outputStream;

public:
	FileLogPolicy() : outputStream() {};
	~FileLogPolicy() { };

	bool openOutputStream(const std::wstring& filename) override;
	void closeOutputStream() override;
	void write(const std::string& msg) override;
};
```

The closeOutputStream() function simply closes the file, and the write function appends the content of the *const std::
string& msg* to the outputStream.

Opening a file on the hard drive is a bit more of a hassle, there is no guarantee that this code is optimized, nor that
it will work with future versions of Windows, but for now, it does what it is supposed to do: it creates the directory "
bell0bytes\bell0tutorials\logs" in the *My Documents* folder (if it does not exist already) and then creates or opens
the file given by the *const std::wstring&*. Please note that the actual source code does some error handling, but for
the sake of clarity, the error handling code won't be shown here.

```cpp
bool FileLogPolicy::openOutputStream(const std::wstring& filename)
{
    PWSTR docPath = NULL;
	SHGetKnownFolderPath(FOLDERID_Documents, NULL, NULL, &docPath);
	
    // append custom folder to path
	std::wstringstream path;
	path << docPath << L"\\bell0bytes\\bell0tutorials\\logs\\";
		
	// delete the wstring pointer to avoid memory leak
	::CoTaskMemFree(static_cast<void*>(docPath));

	// create directory (if it does not exist)
	SHCreateDirectory(NULL, path.str().c_str());
		
	// append file name to path
	path << filename.c_str();

	// try to open the file
	outputStream.open(path.str().c_str(), std::ios_base::binary | std::ios_base::out);

	// set output precision
	outputStream.precision(20);

	// return success
	return true;
}
```

### [SHGetKnownFolderPath](https://msdn.microsoft.com/en-us/library/windows/desktop/bb762188(v=vs.85).aspx)

Retrieves the full path of a known folder identified by the
folder's [KNOWNFOLDERID](https://msdn.microsoft.com/en-us/library/windows/desktop/dd378457(v=vs.85).aspx) and saves it
in a pointer to a wide string. The folder ID for the *My Documents* folder is: FOLDERID_Documents.

After receiving the path, the pointer to the wide string must be deleted to avoid memory leaks. Further, a wide
stringstream is used for more effective string manipulation: The desired directory structure is appended to the
retrieved folder path. The creation of the new folders (if they do not already exist) is realized by calling:

### [SHCreateDirectory](https://msdn.microsoft.com/de-de/library/windows/desktop/bb762130(v=vs.85).aspx)

There is not much to say here, except perhaps that SHCreateDirectory returns ERROR_ALREADY_EXISTS if the directory
already exists (and does not delete and recreate the directory, or other such silly things).

Once the directory is created, or proven to exist, the desired filename, given by *const std::wstring& filename*, is
appended to the path stream. Finally creating the file, or opening it, if it already exists, is handled by the
standard [ofstream](http://www.cplusplus.com/reference/fstream/ofstream/).

## Logger

To output the contents of a stream buffer, the logger class uses a daemon: The running thread is locked and as long as
the daemon is alive, it outputs the elements of the stream buffer:

```cpp
template<typename LogPolicy>
void loggingDaemon(Logger<LogPolicy >* logger)
{
    // dump log data if present
	std::unique_lock<std::timed_mutex> lock(logger->writeMutex, std::defer_lock);
	do
	{
		std::this_thread::sleep_for(std::chrono::milliseconds{ 50 });
		if (logger->logBuffer.size())
		{
			if (!lock.try_lock_for(std::chrono::milliseconds{ 50 }))
				continue;
			for (auto& x : logger->logBuffer)
				logger->policy.write(x);
			logger->logBuffer.clear();
			lock.unlock();
		}
	} while (logger->isStillRunning.test_and_set() || logger->logBuffer.size());
}
```

To start, the [timed_mutex](http://en.cppreference.com/w/cpp/thread/timed_mutex), timedMutex (a timed_mutex protects
shared data from being simultaneously accessed by multiple threads) of the Logger class (see below) is locked by using
the [unique_lock](http://en.cppreference.com/w/cpp/thread/unique_lock)
with [defer_lock](http://www.cplusplus.com/reference/mutex/defer_lock/), that is, the mutex is not immediately locked on
construction, but it will be locked soon (see below).

The currently running thread is then put to sleep by
the [sleep_for function](http://en.cppreference.com/w/cpp/thread/sleep_for), which simply blocks the execution of the
current thread for at least the specified duration.

Once the thread is fast asleep, and there is actually data on the log buffer, attempts to lock the mutex are started.
The mutex will be blocked for the length of its supposed slumber, or until the lock is acquired. If a lock can not be
acquired presently, the thread is allowed to wake and continue safely on its journey (until captured again). If the lock
succeeds, the content of the log buffer is written using the specified logging policy.

---

Now after having vanquished the daemon, the actual Logger class holds no more secrets:

```cpp
template<typename LogPolicy>
class Logger
{
private:
	unsigned int logLineNumber;	
    std::map<std::thread::id, std::string> threadName;
	LogPolicy policy;
	std::timed_mutex writeMutex;
	std::vector<std::string> logBuffer;
	std::thread daemon;
	std::atomic_flag isStillRunning{ ATOMIC_FLAG_INIT };

public:
		Logger(const std::wstring& name);
		~Logger();

		void setThreadName(const std::string& name);

		template<SeverityType severity>
		void print(std::stringstream stream);

		template<typename Policy>
		friend void loggingDaemon(Logger<Policy>* logger);
```

Here is a brief description of each of its members:

### unsigned int logLineNumber

This member is used to print line numbers to the output file.

### map<thread::id, string> threadName

The logger has the option to give a human-readable thread name to each running thread to make the logging file easier to
read for human beings.

### LogPolicy policy

The actual logging policy in use (i.e. print to file).

### timed_mutex writeMutex

A timed mutex is a time lockable object that is designed to signal when critical sections of code need exclusive access,
just like a regular mutex, but additionally supporting timed try-lock requests. (see above)

This mutex is used to write the content of the log buffer to a designated output source (i.e. a file on the hard drive).

### vector<string> logBuffer

The logBuffer contains the elements (events, messages, warnings, …) to print.

### thread daemon

The logging daemon (thread) used to actually print the logBuffer. (see above)

### atomic_flag isStillRunning

Atomic flags are lock-free boolean atomic objects. The isStillRunning flag is used to check whether the logging daemon
is still kicking and alive or not.

### Logger(const std::wstring& name)

The constructor opens the output stream and starts the logging daemon:

```cpp
template<typename LogPolicy>
Logger<LogPolicy>::Logger(const std::wstring& name) : logLineNumber(0), threadName(), policy(), writeMutex(), logBuffer()
{
	if (policy.openOutputStream(name))
	{
		isStillRunning.test_and_set();						// mark the logging daemon as running
		daemon = std::move(std::thread{ loggingDaemon<LogPolicy>, this });
	}
	else
		throw std::runtime_error(L"Unable to open the following log file:\n\t" + name);
}
```

If opening the output stream was successful (see above), the isStillRunning flag
is [atomically changed to true](http://en.cppreference.com/w/cpp/atomic/atomic_flag/test_and_set) and the daemon
is [moved](http://en.cppreference.com/w/cpp/utility/move) to the running thread. Else,
an [exception](http://en.cppreference.com/w/cpp/error/exception) is thrown.

### void setThreadName(const std::string& name)

This function simply sets the name of the current thread:

```cpp
template<typename LogPolicy>
void Logger<LogPolicy>::setThreadName(const std::string& name)
{
	threadName[std::this_thread::get_id()] = name;
}
```

### ~Logger()

The destructor does what destructors do:

```cpp
template<typename LogPolicy>
Logger<LogPolicy>::~Logger()
{
#ifndef NDEBUG
	// print closing message
	util::ServiceLocator::getFileLogger()->print<util::SeverityType::info>("The logger is shutting down.");
#endif
	// terminate the daemon by clearing the still running flag and letting it join to the main thread
	isStillRunning.clear();
	daemon.join();

	// clear the thread name map
	threadName.clear();
	std::map<std::thread::id, std::string>().swap(threadName);

	// clear the log vector
	logBuffer.clear();
	logBuffer.shrink_to_fit();

	// close the output stream
	policy.closeOutputStream();
}
```

First the isStillRunning flag is cleared (set to false), then the daemon
is [joined](http://en.cppreference.com/w/cpp/thread/thread/join), i.e. the program waits for it to finish whatever it is
doing before it is put to rest. Then some housekeeping is in order: The map with the thread names and the log buffer are
cleared, and the memory is released. Finally, the output stream is closed.

Note that the preprocessor directive *#ifndef NDEBUG* (read: if not defined to not debug) means that the code following
the directive (until the *#endif* is encountered) will only be executed in *debug* mode.

### void print(std::stringstream stream)

The print function takes a template to define the severity of the message, it creates a stream in the form *line number:
day/month/year hours/minutes/seconds: severity level: thread name: message* and then pushes it to the log buffer:

```cpp
template<typename LogPolicy>
template<SeverityType severity>
void Logger<LogPolicy>::print(std::stringstream stream)
{
	std::stringstream logStream;

	// get time
	SYSTEMTIME localTime;
	GetLocalTime(&localTime);

	// header: line number and date (x: xx/xx/xxxx xx:xx:xx)
	if (logLineNumber != 0)
		logStream << "\r\n";
	logStream << logLineNumber++ << ": " << localTime.wDay << "/" << localTime.wMonth << "/" << localTime.wYear << " " << localTime.wHour << ":" << localTime.wMinute << ":" << localTime.wSecond << "\t";

	// write down warning level
	switch (severity)
	{
	case SeverityType::info:
		logStream << "INFO:    ";
		break;
	case SeverityType::debug:
		logStream << "DEBUG:   ";
		break;
	case SeverityType::warning:
		logStream << "WARNING: ";
		break;
	case SeverityType::error:
		logStream << "ERROR:   ";
		break;
	};

	// write thread name
	logStream << threadName[std::this_thread::get_id()] << ":\t";

	// write the actual message
	logStream << stream.str();
	std::lock_guard<std::timed_mutex> lock(writeMutex);
	logBuffer.push_back(logStream.str());
}
```

Just note that before the stream can be pushed to the logBuffer, the write mutex must be locked. That is done using
a [lock guard](http://en.cppreference.com/w/cpp/thread/lock_guard).

### void print(std::string msg)

And here is how to print a simple string:

```cpp
template<typename LogPolicy>
template<SeverityType severity>
void Logger<LogPolicy>::print(std::string msg)
{
	std::stringstream stream;
	stream << msg.c_str();
	this->print<severity>(std::stringstream(stream.str()));
}
```

Note that this function is used in the destructor to print information that the Logger was destroyed.

### friend void loggingDaemon(Logger<Policy>* logger)

It must be great to have a daemon as a friend (I promise, I will eventually stop with the d(a)emon jokes — at latest
when DukeNukem Forever is released; oh wait!)

## Service Locator

To bring the joy of the above logger to every class in a project, a service locator is deployed. A service locator
provides a global point of access to a service without coupling anything to the concrete class:

```cpp
class ServiceLocator
{
private:
	static std::shared_ptr<Logger<FileLogPolicy> > fileLogger;

public:
	static Logger<FileLogPolicy>* getFileLogger() { return fileLogger.get(); };
	static void provideFileLoggingService(std::shared_ptr<Logger<FileLogPolicy> > providedFileLogger);
};
```

The ServiceLocator has a [shared pointer](http://en.cppreference.com/w/cpp/memory/shared_ptr) to a logger with a policy
to write to a file on the hard drive; a shared pointer is a stack-allocated object that wraps a pointer such that it is
no longer important to know who actually owns the pointer — when the last shared pointer for an object in memory is
destructed, the wrapped pointer will also be deleted.

For more information on the concept of a service locator, check
out [the corresponding chapter](http://gameprogrammingpatterns.com/service-locator.html) in the book *Game Programming
Patterns* by Robert Nystrom.

Now to register the logging service (and later, other services as well) for our game, we call the following function as
the game starts:

```cpp
void startServices()
{
	// create file logger
	std::shared_ptr<util::Logger<util::FileLogPolicy> > engineLogger(new util::Logger<util::FileLogPolicy>(L"bell0engine.log"));

    // set name of current thread
	engineLogger->setThreadName("mainThread");

	// register the logging service
	util::ServiceLocator::provideFileLoggingService(engineLogger);
}
```

The registration is done by passing a pointer to the new logger to the ServiceLocator:

```cpp
void ServiceLocator::provideFileLoggingService(std::shared_ptr<Logger<FileLogPolicy> > providedFileLogger)
{
	fileLogger = providedFileLogger;
}
```

Putting all of this new stuff together, we get a new WinMain function:

```cpp
// INCLUDES /////////////////////////////////////////////////////////////////////////////

// windows includes
#include <windows.h>

// exceptions
#include <exception>
#include <stdexcept>

// bell0ybtes util
#include "expected.h"							// error handling with "expected"
#include "serviceLocator.h"					// enables global access to services

// FUNCTIONS ////////////////////////////////////////////////////////////////////////////

// services
void startLoggingService();

/////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////// WinMain //////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nShowCmd)
{
	// try to start the logging service; if this fails, abort the application!
	try { startLoggingService(); }
	catch (std::runtime_error)
	{
		// show error message on a message box
		MessageBox(NULL, L"Unable to start logging service!", L"Critical Error!", MB_ICONEXCLAMATION | MB_OK);

		// humbly return with error code
		return -1;
	}

	// run the game

	// gracefully return
	return 0;
}

/////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////// Services /////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
void startLoggingService()
{
	// create file logger
	std::shared_ptr<util::Logger<util::FileLogPolicy> > engineLogger(new util::Logger<util::FileLogPolicy>(L"bell0engine.log"));

	// set name of current thread
	engineLogger->setThreadName("mainThread");

	// register the logging service
	util::ServiceLocator::provideFileLoggingService(engineLogger);

#ifndef NDEBUG
	// print starting message
	util::ServiceLocator::getFileLogger()->print<util::SeverityType::info>("The file logger was created successfully.");
#endif
}
```

Running this program in *debug* mode, leads to the following log file being created:

```
0: 7/7/2017 18:33:4	INFO:    mainThread:	The file logger was created successfully.

1: 7/7/2017 18:33:4	INFO:    mainThread:	The file logger was shut down.
```

## Source Code

Download the source
code [here](https://filedn.eu/ltgnTcOBnsYpGSo6BiuFrPL/Game%20Programming/Fundamentals/C%2B%2B/logger.7z).

---

Wow, I do not know about you, but I am definitely exhausted from all this non-game and non-mathematics related stuff;
the fact that I was chasing memory leaks all night doesn't help either. I am very much looking forward to finally
creating our first actual window in Windows in the next tutorial. Stay tuned!

## References

(in alphabetic order)

* [A lightweight logger](http://www.drdobbs.com/cpp/a-lightweight-logger-for-c/240147505?pgno=1), by Filip Janiszewski
* [Game Programming Patterns](http://gameprogrammingpatterns.com/), by Robert Nystrom
* [Microsoft Developer Network](https://msdn.microsoft.com/en-us/default.aspx)