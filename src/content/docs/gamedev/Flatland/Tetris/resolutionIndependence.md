---
title: Resolution Independence
description: To support multiple resolutions, a technique called "Resolution Independent Rendering", pioneered by Donald Knuth, is implemented using Direct2D and some linear algebra.
---

## Resolution Independent Rendering

[Resolution independence](https://en.wikipedia.org/wiki/Resolution_independence) means that elements on a computer
screen are rendered at sizes independent of the pixel grid, resulting in a graphical user interface that is displayed at
a consistent size, regardless of the resolution of the screen. This idea was pioneered by the
great [Donald Knuth](https://en.wikipedia.org/wiki/Donald_Knuth), as early as 1978, when his typesetting
system [TeX](https://en.wikipedia.org/wiki/TeX) introduced resolution independence into the world of computers.

The goal behind *resolution independence* is to not care too much about the screen resolution during game development,
to divert more energy into creating the actual gameplay. The idea is elementary: a virtual resolution is fixed, and the
entire game is developed with that virtual resolution in mind. Later on, when deployed, the game stretches, or shrinks,
all graphical elements depending on the player's actual screen resolution.

The following tutorial is based on
the [excellent tutorial on the same subject](http://www.david-amador.com/2013/04/opengl-2d-independent-resolution-rendering/)
by [David Amador](http://www.david-amador.com/about/).

## Independent Viewports

Basically all that needs to be done is to decide for which resolution the game should be developed for. In these
tutorials, I opted for a resolution of $1920 x 1080$ pixels. To finally render the game at different resolutions, it is
enough to stretch or shrink the game graphics and user interface. The best place to do so is when creating the viewport.

For example, if the real screen resolution is bigger then the virtual resolution, the viewport will be stretched, that
is the entire game will be stretched and rendered on a bigger viewport. For a smaller screen, the opposite happens: the
viewport is shrunk, and the game graphics will shrink to fit into this smaller viewport. To avoid ugly artifacts, it is
a good idea to not change the aspect ratio defined by the virtual resolution in both cases.

Let $cW$ be the width and $cH$ the height of the current screen resolution and $vW$ and $vH$ the virtual width and
height respectively. The first thing to do is thus to calculate the desired (virtual) aspect ratio $r :=
\dfrac{vW}{vH}.$

```cpp
float targetAspectRatio = (float)virtualWidth / (float)virtualHeight;
```

Knowing the aspect ratio of the virtual resolution, it is now possible to compute the largest area of pixels (in the
actual resolution) that fits into the desired aspect ratio.

Let $w$ and $h$ be the width, respectively the height, of the viewport to be created, then, knowing the width of the
screen resolution, to keep the aspect ratio of the virtual resolution, the height of the viewport must be $h:
=\dfrac{cW}{r}$, as we know the desired ratio between height and width. In C++-code, this looks as follows:

```cpp
unsigned int width = currentWidth;
unsigned int height = (unsigned int)(width / targetAspectRatio + 0.5f);
```

If $h > cH$, if the computed height of the viewport is larger than the height of the screen resolution, then the game
doesn't fit into the current resolution, and thus a technique called
*[pillarbox](https://en.wikipedia.org/wiki/Pillarbox)* must be used to place black bars on the sides of the viewport. To
do so, the height of the viewport is set to the height of the screen resolution and the width of the viewport is then
recomputed with respect to the desired virtual aspect ratio: $w = h \cdot r$, or in C++:

```cpp
if (height > currentHeight)
{
	// it doesn't fit our height, we must switch to pillarbox then
	height = currentHeight;
	width = (unsigned int)((float)height * targetAspectRatio + 0.5f);
}
```

Knowing the height and width of the viewport, it is now easy to place it in the middle of the backbuffer, via a
translation:

```cpp
// set up the new viewport centered in the backbuffer
int vpX = 0.5f * (currentWidth - width);
int vpY = 0.5f * (currentHeight - height);
```

Here is all of the code in one place:

```cpp
// set the viewport depending on the screen resolution
unsigned int currentHeight = currentModeDescription.Height;
unsigned int currentWidth = currentModeDescription.Width;

float targetAspectRatio = (float)virtualWidth / (float)virtualHeight;

// figure out the largest area that fits in this resolution at the desired aspect ratio
unsigned int width = currentWidth;
unsigned int height = (unsigned int)(width / targetAspectRatio + 0.5f);

if (height > currentHeight)
{
	// it doesn't fit our height, we must switch to pillarbox then
	height = currentHeight;
	width = (unsigned int)((float)height * targetAspectRatio + 0.5f);
}

// set up the new viewport centered in the backbuffer
int vpX = 0.5f * (currentWidth - width);
int vpY = 0.5f * (currentHeight - height);

D3D11_VIEWPORT vp;
vp.TopLeftX = vpX;
vp.TopLeftY = vpY;
vp.Width = width;
vp.Height = height;
vp.MinDepth = 0.0f;
vp.MaxDepth = 1.0f;
devCon->RSSetViewports(1, &vp);
```

## Matrix Transformation

The actual transformation of the game graphics is done using elementary linear algebra, as seen in a previous tutorial
on *[transformations](https://bell0bytes.eu/transforms/)*

### Lost in Translation

The first thing to do is to create a translation matrix, that is, a matrix defining the translation of each game object
by the vector $\begin{pmatrix}\dfrac{cW-vW}{2}\\\ \dfrac{cH-vH}{2}\end{pmatrix}:$

```cpp
// translate to the middle of the screen
float translateX = 0.5f * (currentWidth - virtualWidth);
float translateY = 0.5f * (currentHeight - virtualHeight);
D2D1::Matrix3x2F translationMatrix = D2D1::Matrix3x2F::Translation(translateX, translateY);
```

### Scaling

To scale the graphics, it is sufficient to compute the ratio between the current and the virtual width, as well as
between the current and the virtual height — and to then define the corresponding matrix to scale each game object
accordingly, regarding the centre of the screen:

```cpp
// calculate the scaling factor depending in the virtual and the actual screen resolution
float scaleX = currentWidth / virtualWidth;
float scaleY = currentHeight / virtualHeight;

// get middle of the screen
float x = currentWidth * 0.5f;
float y = currentHeight * 0.5f;
D2D1::Matrix3x2F scaleMatrix = D2D1::Matrix3x2F::Scale(scaleX, scaleY, D2D1::Point2F(x, y));
```

### Combining Transformations

It is a well-known fact from linear algebra that the concatenation of two linear maps is equivalent to the
multiplication of their associated matrices:

```cpp
// multiply the matrices
D2D1::Matrix3x2F transformationMatrix = translationMatrix * scaleMatrix;
```

Now behold the entire function that grants us resolution independence:

```cpp
void Direct3D::computeResolutionIndependentTransformationMatrix()
{
	// get dimensions
	float currentWidth = (float)currentModeDescription.Width;
	float currentHeight = (float)currentModeDescription.Height;
	
	// translation

	// translate to the middle of the screen
	float translateX = 0.5f * (currentWidth - virtualWidth);
	float translateY = 0.5f * (currentHeight - virtualHeight);
	D2D1::Matrix3x2F translationMatrix = D2D1::Matrix3x2F::Translation(translateX, translateY);

	// scaling
	float scaleX = currentWidth / virtualWidth;
	float scaleY = currentHeight / virtualHeight;

	// get middle of the screen
	float x = currentWidth * 0.5f;
	float y = currentHeight * 0.5f;
	D2D1::Matrix3x2F scaleMatrix = D2D1::Matrix3x2F::Scale(scaleX, scaleY, D2D1::Point2F(x, y));

	// multiply the matrices
	D2D1::Matrix3x2F transformationMatrix = translationMatrix * scaleMatrix;

	// store the matrix
	this->resolutionIndependentTransformationMatrix = transformationMatrix;

	// compute and store the inverse
	transformationMatrix.Invert();
	this->inverseResolutionIndependentTransformationMatrix = transformationMatrix;
}
```

Note that the transformation matrix as well as its inverse (which can be computed using the [
*Invert*](https://docs.microsoft.com/en-us/windows/desktop/api/d2d1helper/nf-d2d1helper-matrix3x2f-invert) function
provided by Direct2D) are stored. The inverse of such a transformation matrix decodes a translation in the other
direction (by the same length) with the scaling factor inverted.

---

All that is left to do now is to set the transformation before drawing:

```cpp
util::Expected<int> DirectXGame::render(const double farSeer)
{
	// clear the back buffer and the depth/stencil buffer
	graphics3D->clearBuffers();

	// set transformation for resolution independence
	graphicsComponent->setResolutionIndependentTransformation();

	graphics2D->beginDraw();

	// render all active states from bottom to top
	for(auto state : gameStates)
		if(!state->render(farSeer).wasSuccessful())
			return std::runtime_error("Critical error: Unable to render scene!");

	// reset transformation
	graphics2D->resetTransformation();

	// draw cursor (if active)
	if(inputHandler->activeMouse)
		inputHandler->drawMouseCursor();

	if(!graphics2D->endDraw().wasSuccessful())
		return std::runtime_error("Failed to draw 2D graphics!");

    // present the scene
	if (!graphics3D->present().wasSuccessful())
		return std::runtime_error("Failed to present the scene!");

	// return success
	return 0;
}
```

### Transforming the Mouse

As you can see, the transformation is reset before the mouse cursor is drawn, as the translation leads to clipping
errors (it seems as if the mouse is transformed internally anyway?). To handle mouse input, the stored information about
the transformation matrix, or rather, its inverse, is used to compute the virtual coordinates of the mouse pointer. Let
$p \in \mathbb{R}^2$ be the current position of the mouse and $T$ the transformation matrix as explained above, then the
virtual position, $v \in \mathbb{R}^2$, of the mouse can be computed as follows: $v = T^{-1} \cdot p.$

To multiple a matrix by a vector, Direct2D offers
the [TransformPoint](https://docs.microsoft.com/en-us/windows/desktop/api/d2d1helper/nf-d2d1helper-matrix3x2f-transformpoint)
method. In C++ the above computation thus looks as follows:

```cpp
void InputHandler::getTransformedMousePosition(float& mouseX, float& mouseY) const
{
	D2D1::Matrix3x2F transMatrix = dxApp.getGraphicsComponent().getInverseResolutionIndependentTransformationMatrix();
	D2D1_POINT_2F mousePos;
	mousePos.x = kbm->mouseX;
	mousePos.y = kbm->mouseY;
	D2D1_POINT_2F transMousePos;
	transMousePos = transMatrix.TransformPoint(mousePos);
	
	mouseX = transMousePos.x;
	mouseY = transMousePos.y;
}
```

To get the virtual position of the mouse cursor, it is now sufficient to call the *getTransformedMousePosition* method:

```cpp
// get mouse position
float mouseX, mouseY;
dxApp.getInputComponent().getInputHandler().getTransformedMousePosition(mouseX, mouseY);
```

To see this technique of resolution independent rendering in action, have a look at the latest beta version of
*[Stécker vum Himmel](https://bell0bytes.eu/stecker-vum-himmel/)*, a Tetris clone powered by the bell0bytes engine
developed in these tutorials, and play around with the screen resolution.

## References

(in alphabetic order)

* [David Amador](http://www.david-amador.com/about/)
* Game Programming Algorithms, by Sanjay Madhav
* Game Programming Patterns, by Robert Nystrom
* Microsoft Developer Network ([MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/ee663274(v=vs.85)))
* Tricks of the Windows Game Programming Gurus, by André LaMothe
* Wikipedia