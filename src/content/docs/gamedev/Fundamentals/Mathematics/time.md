---
title: Keeping Track of Time
description: As in reality, keeping track of time is important for games. After discussing a theoretical game loop, this tutorial implements a high-precision timer based on the native Windows QueryPerformanceCounter function.
---

> „I wish it need not have happened in my time,“ said Frodo.
> „So do I,“ said Gandalf, „and so do all who live to see such times. But that is not for them to decide. All we have to
> decide is what to do with the time that is given us.“
>
> -- J.R.R. Tolkien, The Fellowship of the Ring

## A Theoretical Game Loop

As seen in the tutorial about real-world Windows applications, the game loop controls the overall flow of the entire
game. In gaming terminology, each iteration of the game loop is called a **frame**. Many games aim at running at $60$
frames per second, or *fps*, which means that the game loop of such a game completes $60$ iterations per second.

Our traditional, traditional in the sense that it comes from a world without multithreading, game loop looked like this:

```cpp
util::Expected<int> DirectXApp::run()
{
    bool continueRunning = true;
	MSG msg = { 0 };

	// enter main event loop
	while(continueRunning)
	{
		// peek for messages
		while(PeekMessage(&msg, NULL, 0, 0, PM_REMOVE))
		{
			TranslateMessage(&msg);
			DispatchMessage(&msg);
            
            if (msg.message == WM_QUIT)
				continueRunning = false;
		}

		if (!isPaused)
		{
			// the game is active -> update game logic
		}
	}
	return (int)msg.wParam;
}
```

Now what does a game do while it runs? Forgetting about Windows for a moment, an abstract pure game loop might read like
this:

```c++
while(game.isRunning())
{ 
    // acquire input
    // update the game universe
    // generate output
}
```

Thus, there are three things happening in each frame. This tutorial will give a brief overview over all three of them,
but the details will be covered in later tutorials.

### Acquiring the Input

Traditional input may come from various sources, such as the mouse, keyboard, or joystick. Furthermore, for online based
games, another input source is any data received via the internet. Many modern mobile games also feature camera or
GPS-information as input.

### Updating the Game Universe

Updating the game world means appropriately updating every single object that is active in the current frame, based on
the input acquired in the previous step. This might involve heavy mathematical computations to simulate a world with
physical laws.

### Generating the Output

After having updated the game world, the resulting output must be generated. The most computationally expensive output,
in most cases, is the graphical representation of the game objects. Furthermore, audio, such as sound effects and music,
but also dialogue, and occasionally, force feedback, or rumble effects, must be generated as well. For online based
games, the data sent to the client, the player's computer, would constitute additional output.

---

Imagine that a student is trying to walk over the University campus without being seen by any of the professors, as he
has not refreshed his knowledge on algebraic geometry lately and is terribly afraid of being drawn into a conversation
with them. What would such a game loop look like?

```cpp
while(student.isAlive())
{
    // process input
    KeyboardData kbData = getKeyboardData();
    
    // update the game universe
    
    // update the position of the student based on the acquired keyboard data
    student.position.update(kbData);
    
    // update the professors
    for(auto professor : university)
    {
        if(player.position = professor.position)
            player.faint();
        else
            professor.ai.update(player.position);
    }
    
    // update other game logic
    campus.update();
    
    // generate the output
    game.draw();
    game.audio();
}
```

While the game is running, there are only two classes of objects that must be updated in each frame: the player object
is updated based on acquired keyboard data and the professors are updated based on the position of the player, just
imagine evil mathematicians trying to start a conversation about mathematics with everyone on sight (yes, a highly
unrealistic scenario).

After having acquired the keyboard input, the game updates the position of the player. Should the position of the player
now coincide with the position of a professor, the student faints. Else, the AI controlled professors adjust their
position based on the new position of the player, with the goal of intercepting him.

Once the player and professor objects are updated, the rest of the campus must be updated as well (time of the day,
trees, lights, …). Finally, the resulting output is drawn to the scene and the game plays some appropriate audio.

---

This is rather straightforward, and while many mobile and *Indie* games might still use this traditional game loop
pattern, modern games have evolved out of sheer necessity. With the amount of objects per scene ever-increasing and the
graphical detail becoming more and more photo-realistic, displaying $60$ frames per second is extremely difficult.
Imagining that it takes both $20$ milliseconds to update a large game universe and to render the updated world, with
this traditional game loop, using only a single thread, the resulting frames per second would be unacceptably low,
namely $\frac{1000}{20+20} = 25$fps.
Modern computers are multicore CPUs and in order to achieve maximal efficiency, a game would be wise to make use of all
the cores of the computer it is running on. If updating the game world and rendering the scene could be completed in
parallel, on different cores, the resulting frames per second would at least still be $\frac{1000}{20} = 40$fps.
Obviously, there are many things to consider when trying to implement a parallel game loop, for example, how can a scene
be updated and drawn at the same time? It is a rather advanced topic and won't be featured until way later.

---

We will discuss an actual implementation of a single-threaded game loop in the next tutorial.

## Time

In games, just as in real life, unfortunately, it is always important to keep track of time progression. For example, to
correctly animate game characters or to simulate the rules of physics, the time that passes between frames must be known
exactly. As games usually run at a high frame rate, it is essential that time measurement be very accurate, for example,
a game running at $60$fps has only $\frac{50}{3}$ms, or roughly about $17$ms, to complete each frame iteration.

One thing to consider is that the time passed in the real world might not coincide with the time passed in the game
world, for example, games might be paused (and surely time does not flow in a paused game universe). In other cases,
game designers might alter the flow of time deliberately, such as to implement slow-motion or, oppositely, to reduce the
length of a half-time in a football (real football, as in European football — not that it matters) game, as obviously
the players, or most of the players, do not want to sit through a $90$ minute session for each game of the season.

The High-Precision Timer implemented in this tutorial will make keeping track of time seem like child's play.

### Game Logic and Delta Time

While keeping track of the total elapsed time since the game was started, the time elapsed between two frames, the
so-called delta time, or $\Delta_t$, is equally, if not even more, important.

Imagine that in the game from above, the student is trying to just run over the campus in a straight horizontal line:

```cpp
// move the student two pixels to the right
student.position.x += 2;
```

The problem with this absolute movement is that it depends on the *fps* the game is running on. If the game runs on
$30$fps, then the student moves $30 * 2 = 60$ pixels per second. If the game runs on $60$fps, the student moves $60 *
2 = 120$ pixels per second. Obviously, such a dependence on the frames per second is not desirable. The simple solution
is to update game objects based on $\Delta_t$, that is, movement should not be thought of as absolute, but as relative
to the elapsed time. If the desired movement speed was $120$ pixels per second, it would be preferable to update the
position, $x = x + 120 \cdot \Delta_t$, like this:

```cpp
// move the student to the right by 120 pixels per second
student.position.x += 120 * deltaTime;
```

This new code works as desired, independent of the frames per second. At $30$fps, or $\Delta_t = \frac{1}{30}$s, the
student will move $120 \cdot \Delta_t = 4$ pixels per frame, for a total of $4 \cdot 30 = 120$ pixels per second. At
$60$fps, or $\Delta_t = \frac{1}{60}$s, the player will only move $120 \cdot \Delta_t = 2$ pixels per frame, but in
total, he will move $60 \cdot 2 = 120$ pixels per second once again. Thus, movement will be smoother when the game runs
with $60$ frames per second, but the overall speed per second will be identical.

This example shows that it is a good idea to update most game objects based on the elapsed time between two frames,
especially when movement is involved, that is, if a translation, or a rotation, is applied to a game object. When higher
mathematics or physics are evolved, a constant rate of update becomes even more important, as will be seen in the next
tutorial.

The High-Precision Timer implemented later in this tutorial has the computation of $\Delta_t$ as a main feature.

---

Another question to ponder is whether to limit the frames per second of a game, or to simply let it run as fast as
possibly possible. Usually, allowing the game to run with as many frames as possible causes all kinds of problems. Most
of those difficulties stem from the instability of numerical analysis, but that is the topic of the next tutorial.

## A High-Precision Timer

Thankfully Windows offers a high-performance timer, or performance counter, out of the box, which appears to be
significantly better than the C++11-timer available through std::chrono.

### [QueryPerformanceCounter](https://msdn.microsoft.com/en-us/library/windows/desktop/ms644904(v=vs.85).aspx)

The QueryPerfomanceCounter retrieves the current value of the performance counter in *counts*, which is a high
resolution ($<1\mu s$) time stamp. Here is an example directly from the MSDN:

```cpp
LARGE_INTEGER currTime;
QueryPerformanceCounter(&currTime);
```

A [LARGE_INTEGER](https://msdn.microsoft.com/en-us/library/windows/desktop/aa383713(v=vs.85).aspx) represents a 64-bit
signed integer value. In Visual Studio, those are equivalent to __int64 or long long int.

### [QueryPerformanceFrequency](https://msdn.microsoft.com/en-us/library/windows/desktop/ms644905(v=vs.85).aspx)

The QueryPerfomanceFrequency retrieves the frequency of the performance counter, that is, the counts per second of the
performance timer. This value is fixed at system boot and is consistent across all processors. Therefore, the frequency
need only be queried once upon application initialization. Here is an example taken from the MSDN again:

``` cpp
LARGE_INTEGER frequency;
QueryPerformanceFrequency(&frequency);
```

Obviously, to get the seconds per count, it is enough to compute the reciprocal of the number of counts per second.
Thus, assuming $y$ to be the time value in counts and $z$ the frequency of the performance counter, then the time value
in seconds $x$ can be computed by $x = y \cdot z^{-1}$.

This is very straightforward, and this bit of information is already enough to create a high-precision timer for a game.
Note that both functions return $0$ if an error occurred.

## Time Between Two Frames

As discussed above, to animate game objects, it is very important to know the exact time that has elapsed between
frames. Let $t_i$ and $t_{i+1}$ denote the count value at frame $i$ and $i+1$ respectively, then the time elapsed
between those two frames can easily be computed by $\Delta t = t_{i+1} - t_i$.

## Total Time

When trying to keep track of the total time $t_{total}$ that has elapsed since the start of the game $t_{start}$, it is
critical to stop the timer when the game becomes inactive. Stopping the timer is done by recording the count value $t_
{paused}$ at the moment the game is paused. When the game becomes active again, the time the game was idle is computed
as follows: If the game is resumed at count value $t_{resumed}$, then the game was idle for a count value of $$t_
{idle} = t_{resumed} - t_{paused}.$$Each time the game is resumed once more, $t_{idle}$ is added to the total time $t_
{totalIdle}$ the game has been idle so far since the start of the application.

Now to get the total running time $t_{total}$, in counts, at any moment in the game, there are two possible situations:

1. Inquiry when the game is paused: $$t_{total} = (t_{paused} - t_{start}) - t_{totalIdle},$$where $t_{paused}$ holds
   the count value at the time the game was paused last.
2. Inquiry when the game is running: $$t_{total} = (t_{now} - t_{start}) -t_{totalIdle},$$ where $t_{now}$ is the count
   value at the moment of the inquiry.

Please note that all computations are done in $(\mathbb{Z},+)$, which is obviously associative, and thus the parentheses
above are only used to highlight the idea that, to get the total time the game was running, the total idle time must be
subtracted from the total time the game has existed.

Here are two numerical examples.

1. Suppose that the game started at $t=0$, that the game was paused between $t=10$ and $t=20$ and again at $t=30$. Now
   if the total time is requested while the game is still paused, the above formula yields: $$t_{total} = (30-0) - 10 =
   30-10 = 20,$$which makes sense, since the game ran for $10$ counts twice, between $t=0$ and $t=10$ as well as $t=20$
   and $t=30$.

2. Suppose that the game started at $t=5$, that again the game was paused between $t=10$ and $t=20$ and additionally
   between $t=30$ and $t=50$. Then $t_{totalIdle} = 30$, and if the total time is requested at $t=70$, the above formula
   yields: $$t_{total} = (70-5)-30 = 65-30 = 35,$$which again makes sense as the game ran for $5$ counts between $t=5$
   and $t=10$, for $10$ counts between $t=20$ and $t=30$, and for $20$ counts between $t=50$ and $t=70$, which leads to
   a total running time of $5+10+15=35$ counts.

## Timer Class

Now with the theory out of the way, it is time to implement the actual timer class.

``` cpp
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

The times, measured in counts, match those described above, with slightly different names.

### Constructor

``` cpp
Timer::Timer() : startTime(0), totalIdleTime(0), pausedTime(0), currentTime(0), previousTime(0), secondsPerCount(0.0), deltaTime(0.0), isStopped(false)
{
	// get the frequency of the PerformanceCounter
	long long int frequency = 0;
	if (QueryPerformanceFrequency((LARGE_INTEGER*)&frequency))
	{
		// compute the secondsPerCount as the reciprocal of the frequency
		secondsPerCount = 1.0 / (double)frequency;
	}
	else
		// the hardware does not support a high-precision timer -> throw an error
		throw std::runtime_error("The hardware does not support a high-precision timer!");
}
```

The constructor initializes most member variables to $0$, queries for the performance frequency and then computes the
amount of seconds per count, by the formula from above, and stores that value in the appropriate *secondsPerCount*
member variable. A return value of $0$ from *QueryPerformanceFrequency* is a very strong indicator that the hardware
does not support a high-precision timer. It would be possible to then use the C++11-chrono class, but for now, the
constructor simply throws an exception.

### Start, Reset and Stop

Those three functions very much behave like an ordinary stopwatch.

#### Start

```cpp
util::Expected<void> Timer::start()
{
	// this function starts the timer (if it is not already running)
	if (isStopped)
	{
		long long int now = 0;
		if (QueryPerformanceCounter((LARGE_INTEGER*)&now))
		{
			// add the duration of the pause to the total idle time
			totalIdleTime += (now - pausedTime);

			// set the previous time to the current time
			previousTime = now;

			// reset the pausedTime to 0 and isStopped to false
			pausedTime = 0;
			isStopped = false;

			// return success
			return { };
		}
		else
			// unable to query the performance counter, throw an error
			return std::runtime_error("Unable to query the performance counter!");
	}

	// return success
	return { };
}
```

The *Timer::start* function starts the timer (crazy stuff, I know). If the timer was already running, then nothing
happens. Else — if the game was paused — the function queries for the current time $t_{now}$ and, as discussed above,
the duration of the pause, $t_{now} - t_{pausedTime}$, is added to the total time $t_{totalIdle}$ the game was idle so
far.

Since at the next frame, the current frame will be the previous frame, the previous time is set to *now*. Then the last
time the game was paused is set to $0$ and the *isStopped* flag is reset to false.

If there was an error with the performance timer, the function returns a *runtime_error*.

#### Stop

```cpp
util::Expected<void> Timer::stop()
{
	// this function stops the timer (if it is currently running)
	if (!isStopped)
	{
		long long int now = 0;
		if (QueryPerformanceCounter((LARGE_INTEGER*)&now))
		{
			// set the time the timer was stopped to "now"
			pausedTime = now;
			isStopped = true;

			// return success
			return { };
		}
		else
			// unable to query the performance counter, throw an error
			return std::runtime_error("Unable to query the performance counter!");
	}

	// return success
	return { };
}
```

The *Timer::stop* function stops the timer (yeah, even more crazy stuff!). If the timer is already stopped, then nothing
happens. Else — if the timer is running — the function queries for the current time, stores the returned value as the
time the game was paused and sets the *isStopped* flag to *true*.

If there was an error with the performance timer, the function returns a *runtime_error*.

#### Reset

``` cpp
util::Expected<void> Timer::reset()
{
	// this function resets the timer
	long long int now = 0;
	if (QueryPerformanceCounter((LARGE_INTEGER*)&now))
	{
		startTime = now;
		previousTime = now;
		pausedTime = 0;
		isStopped = false;

        // return success
		return { };
	}
	else
		// unable to query the performance counter, throw an error
		return std::runtime_error("Unable to query the performance counter!");
}
```

The *Timer::reset* function resets the timer (okay, no more stupid jokes, I promise). It queries for the current time
and sets both the starting time of the application and the time of the previous frame to the returned value from the
query. Then it sets the time the game was last paused to $0$ and resets the *isStopped* flag to *false*. The *Timer::
reset* function must be invoked once at the start of the game loop.

On encountering an error, the function returns a *runtime_error*.

### Time between frames

To keep track of the elapsed time $\Delta_t$ between two frames, $\Delta_t = t_{currentTime} - t_{previousTime}$ is
constantly updated during the game loop using the *Timer::tick* function:

``` cpp
util::Expected<void> Timer::tick()
{
	// this function lets the timer tick, i.e. it computes the time that has elapsed between two frames
	if (isStopped)
	{
        // if the game is stopped, the elapsed time is obviously 0
		deltaTime = 0.0;

		// return success
		return { };
	}
	else
	{
		// get the current time
		if (QueryPerformanceCounter((LARGE_INTEGER*)&currentTime))
		{
			// compute the time elapsed since the previous frame
			deltaTime = (currentTime - previousTime) * secondsPerCount;

			// set previousTime to crrentTime, as in the next tick, this frame will be the previous frame
			previousTime = currentTime;

			// deltaTime can be negative if the processor goes idle for example
			if (deltaTime < 0.0)
				deltaTime = 0.0;

			// return success
			return { };
		}
		else
			// unable to query the performance counter, throw an error
			return std::runtime_error("Unable to query the performance counter!");
	}
}
```

Note that $\Delta_t$ might be negative if the processor goes into power save mode, if the running process is moved to
another processor, or simply if an overflow occurs. If such is the case, $\Delta_t$ is set to $0$.

To retrieve $\Delta_t$, use the *Timer::getDelta* function:

```cpp
double Timer::getDeltaTime() const
{
	// this function returns the time elapsed between two frames; delta time is updated during the game loop
	return deltaTime;
}
```

### Total Time

The *Timer::getTotalTime* function returns the total time elapsed since the start of the application, minus the total
idle time, as discussed above.

```cpp
double Timer::getTotalTime() const
{
	// this function returns the total time since the game started: (t_now - t_start) - t_totalIdle
	if (isStopped)
		return (pausedTime - startTime - totalIdleTime)*secondsPerCount;
	else
		return (currentTime - startTime - totalIdleTime)*secondsPerCount;
}
```

---

To use the new timer in a game, the *DirectXApp* class is updated with members to hold a pointer to an instance of the
timer class, the frames shown per second and the milliseconds elapsed per frame, as well as methods to calculate those
frame statistics and to update the game objects based on the elapsed time.

```cpp
class DirectXApp
{
protected:
	...
    // timer
	util::Timer* timer;					// high-precision timer
	int fps;							// frames per second
	double mspf;					    // milliseconds per frame

	...
    
	void calculateFrameStatistics();	// computes fps and spf

	...
    
    virtual void update(double dt);     // update game objects and logic based on elapsed time since last frame
};
```

Obviously, for now, the *DirectXApp::update* function does absolutely nothing, but it will definitely be useful later
on.

To compute the frames per second, the *DirectXApp::calculateFrameStats* function updates the number of frames it has
seen since the start of the game each time it is called during the game loop using a static variable. Using a second
static variable, it keeps track of the elapsed time since it was last evoked. The lifetime of such static variables
begins the first time they are encountered, and it only ends as the program terminates. Live long and prosper.

Now then, once per second, the *fps* variable can simply be set to the number of frames counted in this way, and the
milliseconds it took to render a frame, on average, is $1000$ divided by the frames per second.

``` cpp
void DirectXApp::calculateFrameStatistics()
{
	static int nFrames;				    // number of frames seen
	static double elapsedTime;		    // time since last call
	nFrames++;

	// compute average statistics over one second
	if ((timer->getTotalTime() - elapsedTime) >= 1.0)
	{
		// set fps and mspf
		fps = nFrames;
		mspf = 1000.0 / (double)fps;

		// reset
		nFrames = 0;
		elapsedTime += 1.0;
	}
}
```

Now when the game runs, the frame statistics are computed each frame and the game is updated based on the elapsed time:

```cpp
util::Expected<int> DirectXApp::run()
{
	// reset (start) the timer
	timer->reset();

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
				continueRunning = false;

		}

		// let the timer tick
		timer->tick();

		if (!isPaused)
		{
            // compute fps
			calculateFrameStatistics();
            
			// acquire input
							
			// now update the game logic based on the input and the elapsed time since the last frame
			update(timer->getDeltaTime());

            // generate output
		}
	}
	return (int)msg.wParam;
}
```

Finally, the only thing left to do is to update the message procedure function in the windows class to actually start
and stop the timer whenever the game is paused or unpaused, for now, that means, whenever the game window becomes
inactive.

## Exercises

### Exercise 1

Which events must be updated in the message procedure of the windows class to appropriately start and stop the timer?

### Exercise 2

What happens if in the DirectXApp::init() function the window is created before the timer?

### Exercise 3

Change the source code in such a way, that the current fps will always be shown as caption of the window. (Hint: Use the
SetWindowText function.)

## Exercise 4

In the next tutorial, we will discuss timing in game loops. Can you figure out what is wrong with the game loop from
this tutorial?

## Putting It All Together

The sourcecode is
available [here](https://filedn.eu/ltgnTcOBnsYpGSo6BiuFrPL/Game%20Programming/Fundamentals/Mathematics/time.7z).

And here is the log file after having minimized and restored the window:

```
0: 10/7/2017 23:9:22	INFO:    mainThread:	The file logger was created successfully.
1: 10/7/2017 23:9:22	INFO:    mainThread:	The high-precision timer was created successfully.
2: 10/7/2017 23:9:22	INFO:    mainThread:	The client resolution was read from the Lua configuration file: 800 x 600.
3: 10/7/2017 23:9:22	WARNING: mainThread:	The window was resized. The game graphics must be updated!
4: 10/7/2017 23:9:22	INFO:    mainThread:	The main window was successfully created.
5: 10/7/2017 23:9:22	INFO:    mainThread:	The DirectX application initialization was successful.
6: 10/7/2017 23:9:22	INFO:    mainThread:	Game initialization was successful.
7: 10/7/2017 23:9:22	INFO:    mainThread:	Entering the game loop...
8: 10/7/2017 23:9:22	INFO:    mainThread:	The timer was reset.
9: 10/7/2017 23:9:24	INFO:    mainThread:	The timer was stopped.
10: 10/7/2017 23:9:25	WARNING: mainThread:	The window was resized. The game graphics must be updated!
11: 10/7/2017 23:9:25	INFO:    mainThread:	The timer was started.
12: 10/7/2017 23:9:26	INFO:    mainThread:	The timer was stopped.
13: 10/7/2017 23:9:26	INFO:    mainThread:	The main window was flagged for destruction.
14: 10/7/2017 23:9:26	INFO:    mainThread:	Leaving the game loop...
15: 10/7/2017 23:9:26	INFO:    mainThread:	The game was shut down successfully.
16: 10/7/2017 23:9:26	INFO:    mainThread:	Main window class destruction was successful.
17: 10/7/2017 23:9:26	INFO:    mainThread:	The timer was successfully destroyed.
18: 10/7/2017 23:9:26	INFO:    mainThread:	The DirectX application was shutdown successfully.
19: 10/7/2017 23:9:26	INFO:    mainThread:	The file logger was destroyed.
```

---

In the next tutorial we will discuss different designs for game loops, in particular, we will show why the game loop
used in this tutorial, which also features in many prominent books and other online tutorials, leads to very unstable
and non-deterministic behaviour!

## References

(in alphabetic order)

* Game Programming Algorithms and Techniques, by Sanjay Madhav
* Game Programming Patterns, by Robert Nystrom
* Introduction to 3D Game Programming with DirectX 11, by Frank D. Luna
* Microsoft Developer Network ([MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/ee663274(v=vs.85)))
* Tricks of the Windows Game Programming Gurus, by André LaMothe