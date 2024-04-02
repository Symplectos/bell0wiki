---
title: Banging on the Keyboard
description: During this tutorial an efficient, event-based and highly configurable input handler is implemented and a robust system to acquire and update keyboard states is added to the input handler.
---

> As for the piano, the faster her fingers flew over it, the more he marveled. She struck the keys with aplomb and ran
> from one end of the keyboard to the other without a stop.
>
> – G. Flaubert

In this tutorial, we will set up a basic input handler system to acquire input from keyboard devices.

## Digital Input

In theory, checking whether a key is pressed or not, sounds absolutely easy. Even though Microsoft provides a function
to get the keyboard state or to query the state of a single key, there are, unfortunately, a few things to consider.

### KeyCodes

Windows stores the state of each keyboard key in an array of 256 bytes. It would obviously be quite difficult to
remember which index corresponds to which key, therefore
so-called [key codes](https://msdn.microsoft.com/en-us/library/windows/desktop/dd375731(v=vs.85).aspx), such as
*VK_ESCAPE*, for the, surprise, escape key, were introduced.

### Quick Fingers

Now polling whether a key is pressed or not should be easy:

```cpp
if(isKeyDown(VK_SPACE))
    // fire missile
```

Everything seems straightforward, yes? Going back to the by now famous example of the student trying to walk across his
University campus without bumping into evil professors of mathematics, we could imagine him wanting to shoot
$\varepsilon$-balls (obviously with $\varepsilon > 0$) at the professors to hold their advance for a moment. Now just
imagine pressing the space button to throw such an $\varepsilon$-ball, what will happen? If the game is running at
$60$fps, the space button would have to be pressed and released within 16ms, which is quite difficult actually, for the
action to be detected within a single frame, else, the student might throw several $\varepsilon$-balls on consecutive
frames with a single *click*. Similarly, holding the space bar will result in the student throwing a single
$\varepsilon$-ball per frame.

A quite simply but very effective method to solve this problem is to store the state of the keyboard during the previous
and the current frame, using two arrays of 256 bytes storing whether a key is down or not, leaving us with four possible
states for each key:

| Previous Frame | Current Frame |     State      |
|:--------------:|:-------------:|:--------------:|
|     false      |     false     | Still Released |
|     false      |     true      |  Just Pressed  |
|      true      |     false     | Just Released  |
|      true      |     true      | Still Pressed  |

Remember the problem of the player desiring to charge his weapon from the previous tutorial? Well, now he can easily do
so. Charging the missile would begin once the space key is *Just Pressed*, and charging continues as long as the space
key is *Still Pressed*, and the devastating missile will be fired upon the player's enemies once the state of the space
bar is *Just Released*. Nice and easy!

To implement this system, a simple enum is enough:

```cpp
	// constructors and destructor
	BindInfo();
	BindInfo(const unsigned int keyCode, const KeyState keyState);
	~BindInfo() {};

	friend struct GameCommand;
	friend class InputHandler;
};
```

As you can see, this structure simply links a keyboard key to one of the four possible states a key can be in, i.e. a
bind info could be that the escape key was just pressed.

Now an event can be mapped to one or multiple key bindings, for example, the event *quit game* could be mapped to the
key *VK_ESCAPE* with the state *JustPressed*, or the event *toggle fps information* could be mapped to the chord of
three keys: *hold 'control' + 'shift' and press 'F'*. To do so, we introduce the *GameCommand* structure:

```cpp
// structure to map a single game command to a chord of key strokes (see above)
struct GameCommand
{
private:
	std::wstring name;						// human readable name
	std::vector<BindInfo> chord;			// the chord mapped to this command, i.e. "shift"+"control"+"F"

public:
	// constructors and destructor
	GameCommand();
	GameCommand(const std::wstring& name, const unsigned int keyCode, const KeyState keyState);
	GameCommand(const std::wstring& name, const BindInfo& bi);
	GameCommand(const std::wstring& name, const std::vector<BindInfo>& chord);
	~GameCommand() {};

	friend class InputHandler;
};
```

This simple structure stores a string defining the name of the command and a vector of key bindings, as described above.
I am sure you can see how it is not difficult any more, from here, to change the keys a command is mapped to. We will
come back to this in a later tutorial. For now, we focus on implementing the input handler class.

## Input Mapping

Mapping keys to events is the job of the input handler class. A game must define all possible game actions, for example
in an enumeration:

```cpp
enum GameCommands { Quit, showFPS };
```

The input handler then links those events to the above-mentioned commands:

```cpp
std::unordered_map<GameCommands, GameCommand*> keyMap;
```

Here is the C++-code for the above examples:

```cpp
void GameInput::setDefaultKeyMap()
{
	keyMap.clear();
    
    // define chord for "toggle FPS"
	std::vector<input::BindInfo> bi;
	bi.push_back(input::BindInfo(VK_SHIFT, input::KeyState::StillPressed));
	bi.push_back(input::BindInfo(VK_CONTROL, input::KeyState::StillPressed));
	bi.push_back(input::BindInfo('F', input::KeyState::JustPressed));
	
    // add maps
    keyMap[input::GameCommands::Quit] = new input::GameCommand(L"Quit", VK_ESCAPE, input::KeyState::JustPressed);
	keyMap[input::GameCommands::showFPS] = new input::GameCommand(L"showFPS", bi);
}
```

## The Keyboard

With a configurable input handler in place, it is time to learn how to actually acquire keyboard input.

To store the keyboard state from the previous and the current frame, the input handler classes receive two arrays with
256 bytes and a method to fill those arrays with the data of each key:

```cpp
std::array<BYTE, 256> keyboardStateCurrent;							// the state of the keyboard in the current frame 
std::array<BYTE, 256> keyboardStatePrevious;						// the state of the keyboard in the previous frame

util::Expected<void> getKeyboardState();							 // gets the keyboard state, uses GetAsyncKeyState to read the state of all 256 keys
```

Filling those arrays is done using
the [GetAsyncKeyState](https://msdn.microsoft.com/en-us/library/windows/desktop/ms646293(v=vs.85).aspx) that Microsoft
provides us:

```cpp
SHORT WINAPI GetAsyncKeyState(
  _In_ int vKey
);
```

If the function succeeds, the return value specifies whether the key is currently up or down. If the most significant
bit is set, the key is down. We can check for the most significant bit as follows:

```cpp
inline const bool isPressed(int keyCode) const { return (GetAsyncKeyState(keyCode) & 0x8000) ? 1 : 0; };	// returns true iff the key is down
```

And the method to actually fill the arrays is now straightforward:

```cpp
void getKeyboardState();							 // gets the keyboard state, uses GetAsyncKeyState to read the state of all 256 keys

void InputHandler::getKeyboardState()
{
	// store the old keyboard state
	keyboardStatePrevious = keyboardStateCurrent;

	// read the current keyboard state
	for (int i = 0; i < 256; i++)
		keyboardStateCurrent[i] = isPressed(i);
}
```

We simply store the state from the previous frame and then read the state for the current frame using the *isPressed*
method on each key on the keyboard as defined above.

## Polling

Polling is done, as explained in the previous tutorial, in the main game loop. All we have to do is to acquire the state
of the keyboard and to check for active key bindings. To do so, the input handler receives a second unordered map:

```cpp
std::unordered_map<GameCommands, GameCommand*> activeKeyMap;		// list of all active key maps; game acts on each command in this list
```

The reasoning behind this is basic: after each *poll*, the input handler runs through the map of all possible key
bindings and if it finds an active binding, it copies the address of the active command into the newly introduced map of
active commands. The game can then act on those commands later on.

To evaluate which key mappings are active, we make use of the table of possible key states defined at the start of this
tutorial as follows:

```cpp
const KeyState getKeyboardKeyState(const unsigned int keyCode) const;// gets the state of the specified key, depending on its state in the previous and the current frame

const KeyState InputHandler::getKeyboardKeyState(const unsigned int keyCode) const
{
	if (keyboardStatePrevious[keyCode] == 1)
		if (keyboardStateCurrent[keyCode] == 1)
			return KeyState::StillPressed;
		else
			return KeyState::JustReleased;
	else
		if (keyboardStateCurrent[keyCode] == 1)
			return KeyState::JustPressed;
		else
			return KeyState::StillReleased;
}
```

The update method now simply runs through the map of all possible key bindings and check whether their conditions are
fulfilled:

```cpp
void update();														// update the active key map

void InputHandler::update()
{
	// clear out any active bindings from the last frame
	bool isActive = false;
	activeKeyMap.clear();
		
	// loop through the map of all possible actions and find the active key bindings
	for (auto x : keyMap)
	{
		// test chord
		isActive = true;
		for(auto y : x.second->chord)
		{
			if (getKeyboardKeyState(y.keyCode) != y.keyState)
			{
				isActive = false;
				break;
			}
		}
		if(isActive)
			activeKeyMap.insert(std::pair<GameCommands, GameCommand*>(x.first, x.second));
	}

	// delegate to the UI

	// delegate to the game
}
```

Note that for a chord to be active, the state of each mapped key must fit the specified key state.

---

Here is an example of how to use the input handler to acquire input and to react to it:

```cpp
void DirectXGame::acquireInput()
{
    inputHandler->acquireInput();

	// act on user input
	for (auto x : inputHandler->activeKeyMap)
	{
		switch (x.first)
		{
		case input::GameCommands::Quit:
			PostMessage(appWindow->getMainWindowHandle(), WM_CLOSE, 0, 0);
			break;

		case input::GameCommands::showFPS:
			showFPS = !showFPS;
			break;
		}
	}
}
```

---

That's it already.

```cpp
#pragma once

/****************************************************************************************
* Author:	Gilles Bellot
* Date:		31/05/2018 - Lenningen - Luxembourg
*
* Desc:		Event based input handler
*
* History:	- 05/06/2018: added keyboard support
****************************************************************************************/

// INCLUDES /////////////////////////////////////////////////////////////////////////////

// Windows and COM
#include <Windows.h>

// c++ containers
#include <unordered_map>
#include <array>
#include <vector>

// c++ strings
#include <iostream>

// bell0bytes utilities
#include "expected.h"

// CLASSES //////////////////////////////////////////////////////////////////////////////
namespace input
{
	// enumerate all game commands
	enum Events : int;																// enumeration of all standard application events
	enum GameCommands : int;														// enumeration of all possible game commands
	enum KeyState { StillReleased, JustPressed, StillPressed, JustReleased };		// enumeration of all possible key states
	
	// structure to combine key codes and key states
	// each game command can have several bindings (chord), i.e. toggle show FPS = 'shift'+'control'+'FPS'
	struct BindInfo
	{
	private:
		unsigned int keyCode;		// the actual key code
		KeyState keyState;			// the state the above specified key has to be in for the "binding" to become active
	
	public:
		// constructors and destructor
		BindInfo();
		BindInfo(const unsigned int keyCode, const KeyState keyState);
		~BindInfo() {};

		friend struct GameCommand;
		friend class InputHandler;
	};

	// structure to map a single game command to a chord of key strokes (see above)
	struct GameCommand
	{
	private:
		std::wstring name;						// human readable name
		std::vector<BindInfo> chord;			// the chord mapped to this command, i.e. "shift"+"control"+"F"

	public:
		// constructors and destructor
		GameCommand();
		GameCommand(const std::wstring& name, const unsigned int keyCode, const KeyState keyState);
		GameCommand(const std::wstring& name, const BindInfo& bi);
		GameCommand(const std::wstring& name, const std::vector<BindInfo>& chord);
		~GameCommand() {};

		friend class InputHandler;
	};

	// the main input handler class
	class InputHandler
	{
	private:
		/////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////// KEYBOARD /////////////////////////////////////////////
		/////////////////////////////////////////////////////////////////////////////////////////
		std::array<BYTE, 256> keyboardStateCurrent;					// the state of the keyboard in the current frame 
		std::array<BYTE, 256> keyboardStatePrevious;				// the state of the keyboard in the previous frame
				
		void getKeyboardState();									// gets the keyboard state, uses GetAsyncKeyState to read the state of all 256 keys
		const KeyState getKeyboardKeyState(const unsigned int keyCode) const;// gets the state of the specified key, depending on its state in the previous and the current frame

		inline const bool isPressed(int keyCode) const { return (GetAsyncKeyState(keyCode) & 0x8000) ? 1 : 0; };	// returns true iff the key is down

		// polling
		void update();												// update the active key map
	protected:
		std::unordered_map<GameCommands, GameCommand*> keyMap;		// list of all possible game commands mapped to the appropriate command structure
			
		// constructor and destructor
		InputHandler();
		~InputHandler();

		// initialization
		virtual void setDefaultKeyMap() = 0;						// set up default controls

	public:
		std::unordered_map<GameCommands, GameCommand*> activeKeyMap;// list of all active key maps; game acts on each command in this list

		// acquire input
		void acquireInput();
	};
}
```

```cpp
#include "inputHandler.h"
#include "serviceLocator.h"

namespace input
{
	/////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////// Constructor //////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////
	BindInfo::BindInfo() : keyCode(0), keyState(KeyState::JustReleased) {};
	BindInfo::BindInfo(const unsigned int keyCode, const KeyState keyState) : keyCode(keyCode), keyState(keyState) {};

	GameCommand::GameCommand() : name(L""), chord(0) {};
	GameCommand::GameCommand(const std::wstring& name, const unsigned int keyCode, const KeyState keyState) : name(name)
	{
		chord.push_back(BindInfo(keyCode, keyState));
	}
	GameCommand::GameCommand(const std::wstring& name, const BindInfo& bi) : name(name)
	{
		chord.push_back(bi);
	};
	GameCommand::GameCommand(const std::wstring& name, const std::vector<BindInfo>& chord) : name(name), chord(chord) {};
	
	InputHandler::InputHandler() 
	{
		keyboardStateCurrent.fill(0);
		keyboardStateCurrent.fill(0);

		util::ServiceLocator::getFileLogger()->print<util::SeverityType::info>("The input handler was successfully initialized.");
	};

	InputHandler::~InputHandler()
	{
		// clear key map
		for (auto x : keyMap)
			delete x.second;
		keyMap.clear();
		
		// clear active key map
		for (auto x : activeKeyMap)
			delete x.second;
		activeKeyMap.clear();

		util::ServiceLocator::getFileLogger()->print<util::SeverityType::info>("The input handler was shutdown successfully.");
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////// Polling ///////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////
	void InputHandler::acquireInput()
	{
		// get keyboard state
		getKeyboardState();

		// update the key maps
		update();
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////// Update ////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////
	void InputHandler::update()
	{
		// clear out any active bindings from the last frame
		bool isActive = false;
		activeKeyMap.clear();
		
		// loop through the map of all possible actions and find the active key bindings
		for (auto x : keyMap)
		{
			// test chord
			isActive = true;
			for(auto y : x.second->chord)
			{
				if (getKeyboardKeyState(y.keyCode) != y.keyState)
				{
					isActive = false;
					break;
				}
			}
			if(isActive)
				activeKeyMap.insert(std::pair<GameCommands, GameCommand*>(x.first, x.second));
		}

		// delegate to the UI

		// delegate to the game
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////// KEYBOARD /////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////
	void InputHandler::getKeyboardState()
	{
		// store the old keyboard state
		keyboardStatePrevious = keyboardStateCurrent;

		// read the current keyboard state
		for (int i = 0; i < 256; i++)
			keyboardStateCurrent[i] = isPressed(i);
	}

	const KeyState InputHandler::getKeyboardKeyState(const unsigned int keyCode) const
	{
		if (keyboardStatePrevious[keyCode] == 1)
			if (keyboardStateCurrent[keyCode] == 1)
				return KeyState::StillPressed;
			else
				return KeyState::JustReleased;
		else
			if (keyboardStateCurrent[keyCode] == 1)
				return KeyState::JustPressed;
			else
				return KeyState::StillReleased;
	}
}
```

You can download the source code for this
tutorial [here](https://filedn.eu/ltgnTcOBnsYpGSo6BiuFrPL/Game%20Programming/Flatland/Input/keyboard.7z). Please note
that in the meantime, I have made a few changes to the framework for the previous tutorials, but basically this new code
is what we had before, plus our new input handler in place.

To quit the application, press *escape*, to toggle the FPS information, hold *control*+*shift* and press *F*.

In the next tutorial, we will add mouse support to the input handler class.

## References

(in alphabetic order)

* Game Programming Algorithms, by Sanjay Madhav
* Game Programming Patterns, by Robert Nystrom
* Microsoft Developer Network ([MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/ee663274(v=vs.85)))
* Tricks of the Windows Game Programming Gurus, by André LaMothe
* Wikipedia