---
title: User Input
description: This tutorial briefly explains the idea of an event-based input system.
---

> Without input, games would be a static form of entertainment, much like film or television.
>
> – S. Madhav

There are a plethora of input devices existing today: from the common keyboard, mouse and joystick, the mobile versions
such as touch screens and accelerometers, to the newer more exotic devices such as the WiiMote, guitar controllers and
the head-tracking devices of modern virtual reality headsets.

Most forms of input are either analogue or digital, i.e. they either have a range of values or a binary state. A
joystick, for example, is an analogue device, whereas a keyboard is a digital device. Gamepads, however, usually have
both analogue and digital components (think of the analogue pad and the buttons on a modern Nintendo controller).

It is also important to consider that some games require the input system to be able to handle key *chords* and key
*sequences*. A chord, in analogy to music theory, is defined as *multiple buttons pressed at once*, and a sequence is a
series of inputs, think of the special moves used in fighting games.

The following series of tutorials builds upon the [previous tutorial](https://bell0bytes.eu/keyboard-and-mouse/) about
keyboard and mouse input to explain and implement a robust high-level event-based input system to handle keyboard,
mouse, and joystick/gamepad input. The input system will have a basic implementation to also handle chords, but
sequences are beyond our scope at the moment (hint: state machine). The input system will acquire keyboard and mouse
data from raw Windows input, and DirectInput will be used to poll joysticks and gamepads.

## Event-Based Input System

An event-based input system is what we had implemented so far, our engine acted whenever input messages were on the
message queue and while that system worked fine, it had severe limitations, for example, what if the user decided to
charge their weapon, by holding space, before firing a devastating volley at his enemies? The current system was unable
to easily detect whether a key was pressed for a longer period of time or not.

Obviously, Windows has to poll the keyboard and the mouse occasionally to actually create those input events. What we
want to do is to poll for the keyboard and mouse state ourselves. There are two ways to do so, which we can illustrate
with a small story inspired by S. Madhav.

Imagine driving to BlizzCon, in a bus, with all of your friends. They are obviously all excited, and they can't help but
to ask, every damn minute: „Are we there yet?“. They keep asking over and over again, until the bus finally arrives at
the Anaheim Convention Center, at which point the answer to their question is „Yes!“.

Now imagine riding a large bus, with not only your friends, but, I don't know, an entire Blizzard fan club. And they all
ask the same question over and over again: „Are we there yet?“. This sounds annoying, right? Annoying for the driver,
and a terrible waste of energy for your friends and colleagues from the fan club. They will be so exhausted that they
won't be able to actually enjoy BlizzCon. What a shame!

The just described scenario is essentially a **polling** system, everyone keeps polling for the result of a query. In an
input system, this translates to every object that is interested in, for example, the space bar being pressed,
continuously has to query for the event: „Is the space bar pressed?“. Obviously, this is not a good design for an input
handler, as over and over again, every single frame, a function to get the state of a keyboard key would be called with
the *space bar* as input, leading to a duplication of code and introducing bugs, such as if the state of the keyboard
changes in the middle of frames.

So what can we do? Imagine driving to BlizzCon again, but this time, you want to have some peace of mind while driving.
What can you do? You could implement an **event-based** system: your friends can register for an event, in this case,
the arrival at the Anaheim Convention Center, and once that events occurs, you simply notify them. This leads to a
serene drive to the convention centre and a simple notification to all your friends once you have arrived.

Translating this idea back to an input system, we see that now the polling is done in only one location in the code.
Just as the driver had to check whether he had arrived at the convention centre or not, the input system must query for
the state of the input devices and notify everyone interested when a change occurred.

## The Input Loop

This all sounds nice and easy, but one question remains. Where, in the game loop, should the input go? I think a good
place to query for user input is just before the *update* method, such that the last input state set by the player is
acted upon during the next frame.

---

In the following series of tutorials, we will implement an event-based input handler based on what we just learned from
the BlizzCon story. In the next tutorial, we will implement the base input handler class and learn how to handle
keyboard input.

## References

(in alphabetic order)

* Game Programming Algorithms, by Sanjay Madhav
* Game Programming Patterns, by Robert Nystrom
* Microsoft Developer Network ([MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/ee663274(v=vs.85)))
* Tricks of the Windows Game Programming Gurus, by André LaMothe
* Wikipedia