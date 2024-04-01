---
title: Expected
description: This tutorial briefly explains the Expected concept introduced by Dr. Andrei Alexandrescu to improve exception handling in the C++ programming language.
---

> And I say to any creature who may be listening, there can be no justice so long as laws are absolute.
> Even life itself is an exercise in exceptions.
>
> -- Captain Jean-Luc Picard

This tutorial is optional, in the sense that it does not talk about Windows programming per se. Error handling is an
important topic, though, thus, please don't disregard it completely. If you are on the fast track to get your first
window up and running, however, it will be enough to understand how to use the *Expected* idea introduced in this
tutorial; or at least to understand it well enough to be able to read the source code of the tutorials.

## Exceptions

The C++ programming language provides built-in support for throwing and catching exceptions if something goes wrong at
runtime, by offering the *try*, *throw*, and *catch* expressions.

Here is a silly example:

```cpp
// windows includes
#include <windows.h>

// exceptions
#include <exception>
#include <stdexcept>

// test function
bool nurDerBVB(int x)
{
	if (x == 4)
		throw std::invalid_argument("I don't like the number 4 very much!");
	if (x == 9)
		return true;
	else
		return false;
}

// winmain
int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nShowCmd)
{
	try
	{
		nurDerBVB(4);
	}
	catch (std::invalid_argument)
	{
		// handle the exception
		return -1;
	}
	
	return 0;
}

```

First, a *try*-block is used to enclose the statement that might *throw* an exception. The test function signals that an
exceptional condition, often, an error, occurred, by throwing an exception. C++ offers a few standard exceptions to
*throw*, which are listed [here](http://en.cppreference.com/w/cpp/error/exception). In this case, an *invalid argument*
exception is thrown when the test function is fed with the number $4$.

To handle exceptions that may be thrown, *catch*-blocks are implemented immediately following a *try*-block. In this
example, *WinMain* simply exits with return value $-1$ after an exception was caught.

It is possible to use an object of any type as the operand of a *throw* expression, in most cases it is easiest to use
the *std::exception* or one of its derived classes. However, if those are not appropriate enough, it is possible to
derive a custom exception class from *std::exception*.

For more information about exception handling, check the appropriate page on
the [MSDN](https://docs.microsoft.com/en-us/cpp/cpp/cpp-exception-handling).

---

There are a few problems with *exceptions* though: most importantly for games, exceptions are really slow. In most C++
implementations the code in a *try*-block runs as fast as it normally would, however, a *catch*-block is orders of
magnitude slower: The runtime increases linearly with the depth of the call-stack.

Exceptions are also hopelessly serial and do not allow storing of error messages to be handled at a later moment.

## Expected

To overcome these limitions, [Dr. Andrei Alexandrescu](https://de.wikipedia.org/wiki/Andrei_Alexandrescu) proposes the
*Expected<T>* class. Please listen to his excellent
talk [Systematic Error Handling in C++](https://channel9.msdn.com/Shows/Going+Deep/C-and-Beyond-2012-Andrei-Alexandrescu-Systematic-Error-Handling-in-C)
to understand the main ideas and the full power of this strategy.

The key idea is that *Expected<T>* is either a *T* or the exception preventing *T* to be created. The advantages of
using *Expected* over standard exceptions are plenty. The new strategy allows for multiple exceptions to exist at the
same time, and they can be teleported across thread boundaries, *nothrow* boundaries and even across time: they can be
stored and thrown later. In later tutorials, this will prove to be extremely handy.

Here is the class based on the above talk:

``` cpp
template<class T>
class Expected
{
protected:
	union
	{
		T result;
		std::exception_ptr spam;
	};
    bool gotResult;
	Expected() {};
    
public:
	// constructors and destructor
	Expected(const T& r) : result(r), gotResult(true) {};
	Expected(T&& r) : result(std::move(r)), gotResult(true) {};
	Expected(const Expected& e) : gotResult(e.gotResult) { ... }
	Expected(Expected&& e) : gotResult(e.gotResult) { ... }
    ~Expected() {};

	void swap(Expected& e) { ... }
    
    // creating expect from exceptions
	template<class E>
	static Expected<T> fromException(const E& exception) { ... }
    
    static Expected<T> fromException(std::exception_ptr p) { ... }
    static Expected<T> fromException() { ... }
    
    // operator overload
	Expected& operator=(const Expected& e) { ... }
    
	// getters
	bool isValid() const { return gotResult; }
    bool wasSuccessful() const { return gotResult; }
	T& get()
	{
		if (!gotResult)
			std::rethrow_exception(spam);
		return result;
	}
	const T& get() const { ... }		
	
    // probe for exception
	template<class E>
	bool hasException() const { ... }
};

template<> 
class Expected<void> 
{
	std::exception_ptr spam;
	
public:
	template <typename E>
	Expected(E const& e) : spam(std::make_exception_ptr(e)) { }
	Expected(Expected&& o) : spam(std::move(o.spam)) { }
	Expected() : spam() {}

	Expected& operator=(const Expected& e) { ... }

	bool isValid() const { return !spam; }
    bool wasSuccessful() const { return !spam; }
	void get() const { if (!valid()) std::rethrow_exception(spam); }
};
```

And here is a variation of the example from above:

```cpp
util::Expected<void> nurDerBVB(int x)
{
	if (x != 9)
		return std::invalid_argument("I really only like the number 9!");

	return { };
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nShowCmd)
{
	if (nurDerBVB(4).isValid())
		return 0;
	else
		return -1;
}
```

So the basic idea behind the *Expected*-idiom is that each function has an expected return value (an int, a class,
void, …). Thus, if the function call succeeds, the return value is stored in an instance of the *Expected* class. If
something goes wrong however, the actual error is stored in the same instance of the *Expected* class. After having
called a function, it is very easy to simply check whether we got the expected return value or an error.

In this example, the function returns an empty *Expected* (as it was supposed to return *void*) if everything went well,
but if it sees the number $4$, it returns an *Expected* with an error message. In WinMain, it is then possible to branch
off depending on whether the returned *Expected* is empty or holds a nasty error within.

You can download the source code for the above example
from [here](https://filedn.eu/ltgnTcOBnsYpGSo6BiuFrPL/Game%20Programming/Fundamentals/C%2B%2B/expected.7z).

---

In conclusion: Error handling with *Expected* is a lot more powerful than standard exceptions and in addition, it makes
the code a lot easier to read. Everything flows more naturally.

## References

(in alphabetic order)

* Microsoft Developer Network ([MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/ee663274(v=vs.85)))
* [Systematic Error Handling in C++](https://channel9.msdn.com/Shows/Going+Deep/C-and-Beyond-2012-Andrei-Alexandrescu-Systematic-Error-Handling-in-C),
  by [Dr. Andrei Alexandrescu](https://de.wikipedia.org/wiki/Andrei_Alexandrescu)