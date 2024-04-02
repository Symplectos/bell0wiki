---
title: Raw Data
description: To facilitate deploying the game, or just working in a team, it would be nice to have a good file system structure in place. This isn't really a tutorial, but rather a reminder to myself. For now, we simply store the raw data files into the My Documents folder.
---

To facilitate deploying the game, or just working in a team, it would be pleasant to have a good file system structure
in place.

This isn't really a tutorial, but rather a reminder to myself. For now, we simply store the raw data files into the *My
Documents* folder. There are different folders for the different data files, i.e. *Artwork/Buttons*, *Artwork/Cursors*,
*Artwork/Logos*, …

To correctly load in the data, we use an enum storing all data folders:

```cpp
#include "stringifiedEnum.h"

namespace fileSystem
{
// define the game commands
ENUM_WITH_STRING(DataFolders,	(Data)\
								(Artwork)\
								(Music)\
								(EndFolders)\
								(Buttons)\
								(Cursors)\
								(Logos)\
								(EndArtworkSubFolders)\
								(End))
}
```

The main DirectXApp class has a method to load data files from those folders. At the start of the game, we get and store
the paths to the *My Documents* folder and then all we have to do is specify a file name and the file type each time we
want to open a file:

```cpp
const std::wstring DirectXApp::openFile(const fileSystem::DataFolders dataFolder, const std::wstring& filename) const
{
	std::wstringstream file;

	if (dataFolder == fileSystem::DataFolders::Data)
	{
		// the file is in the main data folder
		file << pathToDataFolder << L"\\" << filename;
		return file.str();
	}

	if (dataFolder < fileSystem::DataFolders::EndFolders)
	{
		// the file is in a main folder
		file << pathToDataFolder << L"\\" << enumToString(dataFolder) << L"\\" << filename;
		return file.str();
	}
		
	if (dataFolder > fileSystem::DataFolders::EndFolders && dataFolder < fileSystem::DataFolders::EndArtworkSubFolders)
	{
		// the file is in an artwork subfolder
		file << pathToArtworkFolder << L"\\" << enumToString(dataFolder) << L"\\" << filename;
		return file.str();
	}
		
	return L"Unable to locate file!";
}
```

As an example, let us load in a logo:

```cpp
util::Expected<void> IntroState::initializeLogoSprites()
{
	try
	{
		// the boost logo
		logos.push_back(new graphics::Sprite(d2d, dxApp->openFile(fileSystem::DataFolders::Logos, L"logoBoost.png").c_str()));

		// the DirectX 11 logo
		logos.push_back(new graphics::Sprite(d2d, dxApp->openFile(fileSystem::DataFolders::Logos, L"logoDX11.png").c_str()));

		// the Lua logo
		logos.push_back(new graphics::Sprite(d2d, dxApp->openFile(fileSystem::DataFolders::Logos, L"logoLua.png").c_str()));
	}
	catch (std::exception&e) { return e; }
		
	// return success
	return { };
}
```

This is straightforward and good enough for now. Later on, we will want to be able to read files from a compressed
archive, but for now, we will get back to the input handler and add joystick and gamepad support.

---

You can download the source code
from [here](https://filedn.eu/ltgnTcOBnsYpGSo6BiuFrPL/Game%20Programming/Flatland/File%20System/rawData.7z).

---

## References

### Literature

(in alphabetic order)

* Game Programming Algorithms, by Sanjay Madhav
* Game Programming Patterns, by Robert Nystrom
* Microsoft Developer Network ([MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/ee663274(v=vs.85)))
* Tricks of the Windows Game Programming Gurus, by André LaMothe
* Wikipedia