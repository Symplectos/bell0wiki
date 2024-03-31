---
title: Game Programming
description: Knowledge base and tutorials about game programming
---

> Most good programmers do programming not because they expect to get paid or get adulation by the public, but because
> it is fun to program.
>
> -- Linus Torvalds

To follow this tutorial, you will need
a [programming IDE](https://en.wikipedia.org/wiki/Comparison_of_integrated_development_environments#C.2FC.2B.2B), the
DirectX SDK, which, since Windows 8, is included as part of the Windows SDK, and a basic knowledge
of [C++](http://www.stroustrup.com/C++.html).

Please note that **none of the following tutorials have been revisited or edited**. They might be outdated. There might
be a ton of grammatical mistakes, the explanations might not be well written, and the code might not be optimized.
Nonetheless, the demos run fine, and there is enough material for anyone to learn something new. Thank you for your
understanding.

## Windows Game Programming Fundamentals

Before learning how to program DirectX games, basic knowledge about Win32 programming must be acquired. In the following
tutorials, a first fundamental framework for any Windows-based games is created, featuring a robust game loop with time
management. The framework encapsulates all the tedious details about Windows programming, such that later, more advanced
tutorials, can simply focus on their core ideas, without having to worry about being bothered by Windows.

* Hello World!
* Expected!
* A Thread-Safe Logger
* A real-world Windows application
* Of the Moon and the Sun
* Handling Important Windows Events
* Keeping Track of Time
* The Game Loop
* Keyboard and Mouse
* Of Icons and Cursors
* A First Framework

## DirectX Fundamentals

With all the nasty Windows stuff nicely hidden away, it is time to learn about Direct3D and the High-Level Shader
Language to draw vertices to the screen. In addition, Direct2D and DirectWrite co-operate with Direct3D to output text
to game windows.

* (Direct)X-Com
* First Contact
* The Swap Chain
* Viewports and Render Targets
* Printing text with DirectWrite
* Of Shaders and Triangles
* Among Colourful Stars
* Going Fullscreen
* Game Framework

## Shader Programming

The following short tutorials cover the High-Level Shading Language in more details than the previous tutorials.

* The GPU Pipeline
* An Introduction to the High-Level Shading Language
* Shader Effects
* Shader Data

## Entering Flatland

Now that a robust DirectX game framework is in place, it is time to study Direct2D in more detail. We will learn how to
use Direct2D to render 2D-images, starting with simple geometrical figures and working our way up to complete
2D-sprites.
At the end of these tutorials, we will have a very robust DirectX and Direct2D framework, with DirectWrite and Windows
Imaging Component support.

To round things off, we will learn how to handle user input, and we will add sounds and music to our framework.

User Input will be handled by Windows events for the keyboard and mouse, by DirectInput for Joysticks and by XInput for
Gamepads. An event queue will be implemented to allow different application components and game entities to interact
with each other.

To add sounds and music, we will have a look at XAudio2 and the Windows Media Foundation (in later tutorials, FMOD and
Wwise will be introduced as well).

I can't think of a better place to start the journey into computer graphics than *Flatland* itself! To fully use all the
features in these tutorials, Windows 10+ is necessary.

### Direct2D Fundamentals

* DirectWrite in Direct2D - A Revision
* Direct2D - A Revision
* Drawing Primitives
* Fun with Brushes
* Creating Geometrical Objects
* Direct2D Transformations
* Bitmaps and the Windows Imaging Component
* Sprites
* Animated Sprites and Sprite Sheets

### Input System (I)

* An Introduction
* Banging on the Keyboard
* Chasing the Mouse
* Marshalling Game Commands

### User Interface (I)

* The States of a Game
* Pushing Buttons with Lambda Functions
* Options Menu
* Enabling HUDs

### File System (I)

* Raw Data

### Input System (II)

* DirectInput and Joysticks
* XInput and Gamepads

### Programming Patterns (I)

* An Event - Queue

### Music and Sound (I)

* And then, there was sound!

###### XAudio2 with the Windows Media Foundation

* The Basics of XAudio2
* XAudio2 and Submix Voices
* Streaming Music with XAudio2

## A First Game: Tetris

* The Basics
* Creating a basic installer with Inno Setup
* Installing the Visual C++ 2017 Redistributables with Inno Setup
* Resolution Independent Rendering

## Playing God (I) - Fundamental Physics

To be able to simulate a real world, it is necessary to understand the laws of physics. The following tutorials give a
basic introduction to the most important concepts of classical mechanics and computational geometry. A more rigorous
treatment of those concepts will appear in the “mathematics” section of this website, later on.

### Basic Kinematics

* Units of Measurement
* One-Dimensional Kinematics
* Two-Dimensional Motion
* Basic Projectile Motion
* Newton's Laws of Motion
* The Evil Head of Friction

### Basic Collision Detection and Response

* Basic Collision Detection with Bounding Spheres and Rectangles
* Basic Ad-Hoc Collision Response
* Basic Intersection of Line Segments
* Basic Collision Geometry

### Particle Systems

* A Basic Particle System

---

## References

(in alphabetic order)

* Game Programming Algorithms, by Sanjay Madhav
* Game Programming Patterns, by Robert Nystrom
* Introduction to 3D Game Programming with DirectX 11, by Frank D. Luna
* Microsoft Developer Network ([MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/ee663274(v=vs.85)))
* Tricks of the Windows Game Programming Gurus, by André LaMothe