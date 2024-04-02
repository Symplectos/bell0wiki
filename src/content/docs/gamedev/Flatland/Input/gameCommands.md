---
title: Marshalling Game Commands
description: In this brief tutorial we will learn how to use serialization, or marshalling, to store game objects into files on the hard drive and how to restore those objects, using deserialization, or unmarshalling.
---

> It is a capital mistake to theorize before one has data. Insensibly, one begins to twist facts to suit theories,
> instead of theories to suit facts.
>
> – Arthur Conan Doyle, Sherlock Holmes

A first step to allow the players to set their input settings is to be able to save the key bindings map to a file on
the hard drive and to load those commands back into the map when the game starts.

## Data Paths

In Windows, there are
three [recommended storage locations](https://msdn.microsoft.com/en-us/library/dd378457(v=vs.85).aspx) that application
should use:

- The local application data folder (*FOLDERID_LocalAppData*) is a file system directory that serves as the data
  repository for local (non — roaming) applications, i.e. it should be used for data that is specific to the user, the
  application, and the machine / hardware the application is running on.

- The roaming application data folder (*FOLDERID_RoamingAppData*) is a file system directory for data specific to the
  user and the application, but shared across machines and different hardware.

- The per machine application data folder (*FOLDERID_ProgramData*) is a file system directory for data specific to the
  application and the machine / hardware the application is running on, but independent of the user.

Knowing this, we will store the key configuration file in the local app data folder.

Microsoft recommends the following subdirectory structure to avoid clashes with other applications:
*ManufacturerName\ApplicationName\ApplicationVersion*. The following function retrieves the paths to the above folders
and creates the appropriate sub folders. We have talked about how to do this in a previous tutorial already:

```cpp
bool DirectXApp::getPathToApplicationDataFolders()
{
	HRESULT hr;
	PWSTR appDataPath = NULL;

	// get and store path to local app data
#ifndef NDEBUG
	hr = SHGetKnownFolderPath(FOLDERID_LocalAppData, NULL, NULL, &appDataPath);
#else
	SHGetKnownFolderPath(FOLDERID_LocalAppData, NULL, NULL, &appDataPath);
#endif
	pathToLocalAppData = appDataPath;

	// get and store path to roaming app data
	appDataPath = NULL;

#ifndef NDEBUG
	hr = SHGetKnownFolderPath(FOLDERID_RoamingAppData, NULL, NULL, &appDataPath);
#else
	SHGetKnownFolderPath(FOLDERID_RoamingAppData, NULL, NULL, &appDataPath);
#endif
	pathToRoamingAppData = appDataPath;

	// get and store path to program data
	appDataPath = NULL;

#ifndef NDEBUG
	hr = SHGetKnownFolderPath(FOLDERID_ProgramData, NULL, NULL, &appDataPath);
#else
	SHGetKnownFolderPath(FOLDERID_ProgramData, NULL, NULL, &appDataPath);
#endif
	pathToProgramData = appDataPath;

	// delete the wstring pointer to avoid memory leak
	::CoTaskMemFree(static_cast<void*>(appDataPath));

		
	// create subdirectories

    // append custom folder to local data path
	std::wstringstream path;
	path << pathToLocalAppData << "\\" << manufacturerName << "\\" << applicationName << "\\" << applicationVersion << "\\";
	pathToLocalAppData = path.str();

	// Create the path (including all sub-directories) if it doesn't already exist
	if (FAILED(SHCreateDirectoryEx(NULL, pathToLocalAppData.c_str(), NULL)))
		return false;

	// append custom folder to roaming data path
	path.str(std::wstring());
	path.clear();
	path << pathToRoamingAppData << "\\" << manufacturerName << "\\" << applicationName << "\\" << applicationVersion << "\\";
	pathToRoamingAppData = path.str();

	// Create the path (including all sub-directories) if it doesn't already exist
	if (FAILED(SHCreateDirectoryEx(NULL, pathToRoamingAppData.c_str(), NULL)))
		return false;

	// append custom folder to application data path
	path.str(std::wstring());
	path.clear();
	path << pathToProgramData << "\\" << manufacturerName << "\\" << applicationName << "\\" << applicationVersion << "\\";
	pathToProgramData = path.str();

	// Create the path (including all sub-directories) if it doesn't already exist
	if (FAILED(SHCreateDirectoryEx(NULL, pathToProgramData.c_str(), NULL)))
		return false;

	// return success
	return true;
}
```

## Boost

To actually save and load the data, we will make use of the [boost](https://www.boost.org/) library. I regularly use
boost in my professional (mathematical) applications and, frankly, its existence made me life a lot easier.

Boost is a set of libraries for C++ that provides support for a multitude of tasks and structures, such as linear
algebra, pseudorandom number generation, multithreading, image processing, regular expressions, unit testing, and,
important for this tutorial, serialization. All in all, the boost library contains over eighty individual libraries.

Most of the Boost libraries are licensed under the Boost Software Licence, designed to allow Boost to be used with both
free and proprietary software projects. Many of Boost's founders are on the C++ standards committee, and several Boost
libraries have been accepted for incorporation into both the C++ Technical Report 1 and the C++11 standard.

You can download boost from [here](https://www.boost.org/users/download/). Make sure to also add the additional library
and include paths in your Visual Studio project.

### Boost Serialization

In the context of data storage, *serialization* is the process of translating data structures or objects into a format
that can be stored, for example, in a file or memory buffer, or transmitted, for example, across a network, and
reconstructed later.

When the file, for example, is read from the hard disk, according to the serialization format, it can be used to create
a semantically identical clone of the original object.

This process of storing an object is also called *marshalling*. The opposite operation, extracting a data structure from
a series of bytes, is called deserialization, or *unmarshalling*.

Boost offers marshalling and unmarshalling via
the [boost serialization libary](https://www.boost.org/doc/libs/1_67_0/libs/serialization/doc/index.html).

To use the boost serialization library, we simply add the following headers to our input handler source file:

```cpp
// boost includes
#include <boost/archive/text_oarchive.hpp>
#include <boost/archive/text_iarchive.hpp>
#include <boost/serialization/vector.hpp> // needed to serialize std::vector
```

I won't go into the details of how marshalling works (not that I really have a lot of knowledge about that anyway), but
using it is *easy enough*.

First, in the header file, we specify what data we want to have serialized:

```cpp
// forward definition for friend declaration
namespace boost
{
	namespace serialization
	{
		class access;
	}
}

/// structure to combine key codes and key states
// each game command can have several bindings (chord), i.e. toggle show FPS = 'shift'+'control'+'FPS'
struct BindInfo
{
private:
	unsigned int keyCode;		// the actual key code
	KeyState keyState;			// the state the above specified key has to be in for the "binding" to become active
	
	template <typename Archive>				// define serialization, both save and load
	void serialize(Archive& ar, const unsigned int /*version*/)
	{
		ar & keyCode & keyState;
	}

public:
	// constructors and destructor
	BindInfo();
	BindInfo(const unsigned int keyCode, const KeyState keyState);
	~BindInfo() {};

	friend struct GameCommand;
	friend class InputHandler;
	friend class boost::serialization::access;
};

// structure to map a single game command to a chord of key strokes (see above)
struct GameCommand
{
private:
	std::wstring name;						// human readable name
	std::vector<BindInfo> chord;			// the chord mapped to this command, i.e. "shift"+"control"+"F"

	// serialization
	template <typename Archive>				// define serialization, both save and load
	void serialize(Archive& ar, const unsigned int /*version*/)
	{
		ar & name & chord;
	}

public:
	// constructors and destructor
	GameCommand();
	GameCommand(const std::wstring& name, const unsigned int keyCode, const KeyState keyState);
	GameCommand(const std::wstring& name, const BindInfo& bi);
	GameCommand(const std::wstring& name, const std::vector<BindInfo>& chord);
	~GameCommand() {};

	friend class InputHandler;
	friend class boost::serialization::access;
};
```

As you can see, all we have to do is to declare the boost access class as a friend class, to allow the serialization to
access private members, and then we define what data to serialize inside the *serialize* method. The *&* means input and
output, i.e. when we save the data, it reads as

```cpp
ar << name << chord;
```

And when we load the data, it reads as:

```cpp
ar >> name >> chord;
```

And that's it already — almost.

To actually save and load the data, we have to add two little functions to the InputHandler class:

```cpp
// the main input handler class
class InputHandler
{
private:
		...				

protected:
        ...
		
        // load and save the game commands
		void saveGameCommands();
		void loadGameCommands();

public:
        ...
};
```

Saving the data to the hard drive is completely easy now:

```cpp
void InputHandler::saveGameCommands()
{
	std::ofstream keyBindingsOut(this->keyBindingsFile, std::ios::out);
	boost::archive::text_oarchive oa(keyBindingsOut);

	for (auto gameCommand : keyMap)
	{
		oa << gameCommand.first;
		oa << gameCommand.second;
	}

	keyBindingsOut.close();
}
```

We simply loop through each command in the key map and write its data to a boost text archive linked to the file on the
hard disk. Easy!

Restoring the game commands from the data file is equally easy, but unfortunately, there is a memory leak I can't seem
to fix just yet, maybe there is a bug in the serialization library, the destructor of the singleton constructed when
unmarshalling the objects is never called. But here is the function:

```cpp
void InputHandler::loadGameCommands()
{
	// create default key bindings if the file does not yet exist
	if (GetFileAttributes(keyBindingsFile.c_str()) == INVALID_FILE_ATTRIBUTES)
	{
		setDefaultKeyMap();
		saveGameCommands();
	}

	// clear map
	keyMap.clear();

	// load data
	GameCommands gcs;
	GameCommand* gameCommand = nullptr;

	// open the file
	std::ifstream keyBindingsIn(keyBindingsFile);	
	boost::archive::text_iarchive ia(keyBindingsIn);

	// populate map with information from file
	while (!keyBindingsIn.eof())
	{
		ia >> gcs;
		ia >> gameCommand;
		keyMap[gcs] = gameCommand;
	}

	gameCommand = nullptr;

	// close the file
	keyBindingsIn.close();
}
```

The function is easy enough, we open the data file and read the BindInfo and GameCommands and put them back into the key
map.

On initialization, all we have to do is to set up the default key maps, should no data file exist, everything else is
automatic:

```cpp
GameInput::GameInput(const std::wstring& keyBindingsFile) : input::InputHandler(keyBindingsFile)
{
	// load default key bindings
	loadGameCommands();
}

void GameInput::setDefaultKeyMap()
{
	keyMap.clear();

	std::vector<input::BindInfo> bi;
	bi.push_back(input::BindInfo(VK_SHIFT, input::KeyState::StillPressed));
	bi.push_back(input::BindInfo(VK_CONTROL, input::KeyState::StillPressed));
	bi.push_back(input::BindInfo('F', input::KeyState::JustPressed));

	keyMap[input::GameCommands::ShowFPS] = new input::GameCommand(L"Show FPS", bi);
	keyMap[input::GameCommands::Quit] = new input::GameCommand(L"Quit", VK_ESCAPE, input::KeyState::JustPressed);
}
```

---

This tutorial was rather short, and we did not explain much, but at least we can now load and save game controls, as we
had desired!

You can download the source code
from [here](https://filedn.eu/ltgnTcOBnsYpGSo6BiuFrPL/Game%20Programming/Flatland/Input/marshalling.7z).

In the next tutorial, we will learn how to add a game menu to let the user choose their key bindings.

## References

(in alphabetic order)

* Boost
* Microsoft Developer Network ([MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/ee663274(v=vs.85)))
* Tricks of the Windows Game Programming Gurus, by André LaMothe
* Wikipedia