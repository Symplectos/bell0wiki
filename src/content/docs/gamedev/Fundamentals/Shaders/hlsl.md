---
title: High-Level Shading Language
description: This tutorial is an introduction to the High-Level Shading Language. It focuses on the two main differences between C and HLSL; variable names and semantics.
---

> Talk is cheap. Show me the code.
>
> -- L. Torvalds

## The Basics

As we have learned in earlier tutorials, shaders are not programmed in C++. DirectX shaders are written in their own
language called High-Level Shader Language, or HLSL, for short. The syntax of HLSL is similar to C, but there are a few
major differences:

## Variables

HLSL has three basic variable types: scalars, vectors and matrices.

Scalar variables work just like normal variables in C. HLSL has support for bool, int, unsigned int, half and float
scalar variables. Since most GPUs are optimized to work with floats, it is probably a good idea to use floats most of
the time.

Vector variables simply store up to four scalar variables, declared by placing a number at the end of the type:

```c
float3 pos; // an array with three float scalar variables
float3 loc = {1.0f, 0.0f, 0.5f}; // an initialized float variable
```

Matrix variables are made up by up to sixteen scalar variables, stored in rows and columns:

```c
float2x2 matrix; // a matrix containing 2 rows and 2 columns
float2x2 mat = {0.0f, 0.1f, 1.0f, 1.1f}; // an initialized 2x2 matrix
```

## Semantics

Another big difference are the keywords (semantics) to describe how variables are being used on the GPU.

When passing variables between the different stages of the graphics pipeline, it must always be clear what the variables
actually represent, for example, as information is passed into the rasterizer stage, it must be clear what variables
represent the position and colour of each vertex, and so forth.

To define the role of each variable, each parameter and even all return values must get a suffix, separated by a colon
from the variable name:

```c
float3 pos: POSITION;
```

The *POSITION* suffix tells the GPU that this variable is used to store the position of a vertex.

A standard function call thus looks like this:

```c
float3 main(float3 pos : POSITION, float3 col : COLOR) : COLOR
{
    ...
}
```

This function takes two parameters, holding position and colour information, and outputs only colour information. To
handle multiple output, one would use structures, like this:

```c
struct VS_OUTPUT
{
    float3 pos : POSITION;
    float3 col : COLOR;
}

VS_OUTPUT main(float3 pos : POSITION, float3 col : COLOR)
{
    ...
}
```

While at first using semantics seems a bit cumbersome, an obvious benefit of semantics is that variables can be named
differently between stages. The DirectX pipeline does variable matching via semantics instead of variable names.

For another less obvious advantage, consider the following example

```c
// Vertex Shader
struct VertexShaderInput
{
    float3 pos : POSITION;
    float3 norm : NORMAL;
    float3 col : COLOR;
}

struct VertexShaderOutput
{
    float3 pos : SV_POSITION;
    float3 norm : NORMAL;
    float3 col : COLOR;
}

VertexShaderOutput VertexShader(VertexShaderInput in)
{
    ...
}

// Pixel Shader
struct PixelShaderInput
{
    float3 pos : POSITION;
    float3 col : COLOR;
}
```

Since the vertex shader output provides all the information the pixel shader needs, this is perfectly valid, the
*normal* variable will simply be ignored, and DirectX knows which variable represents the needed information.

And with this implementation, it is possible to write a new pixel shader, using the *normal* variable, without having to
write a new vertex shader.

Thus, semantics provide a way to encapsulate input and output between stages, effectively giving us the equivalent of
pointer addresses.

Just a warning though: While using different names does not slow down the program, different layout positions will, as
DirectX will reorganize the data then.

For further details about semantics, check
the [MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/bb509647(v=vs.85).aspx#VS).

---

As another example, here are the vertex and pixel shaders from the previous tutorials:

### Vertex Shader

```c
struct VertexOut
{
	float4 position : SV_POSITION;
	float4 colour : COLOR;
};

VertexOut main(float3 pos : POSITION, float3 col : COLOR)
{
	// create a VertexOut structure
	VertexOut vertexOutput;

	// transform the position into homogeneous coordinates (projective geometry)
	float4 outputPos = { pos.x, pos.y, pos.z, 1.0f };
	vertexOutput.position = outputPos;

	// set the colour (set full alpha)
	float4 outputCol = { col.x, col.y, col.z, 1.0f };
	vertexOutput.colour = outputCol;

	// return position
	return vertexOutput;
}
```

### Pixel Shader

```c
float4 main(float4 pos : SV_POSITION, float4 col : COLOR) : SV_TARGET
{
	return col;
}
```

## Vector Variables

The individual components of a vector are accessed like *structs*, using predefined keys, namely x,y,z,w for positions
and r,g,b,a for colours:

```c
float4 col, pos;

col.r = 1.0f; // full red
col.a = 0.0f; // no alpha

pos.x = 0.3f;
pos.z = col.r; // go away, red!
```

Please note that whether you use x,y,z,w or r,g,b,a is not relevant, they access the same components:

```c
float4 dummy = {1.0f, 0.75f 0.5f, 0.0f};

bvb.y;  // the value is: 0.75f
bvb.g;  // the value is: 0.75f
```

HLSL offers an easy way to create vectors of equal or smaller dimensions from existing vectors:

```c
float4 dummy = {1.0f, 0.75f 0.5f, 0.0f};
float2 smallerDummy;

smallerDummy = dummy.xy;  // smallerDummy is: {1.0f, 0.75f}
smallerDummy = dummy.ba;  // smallerDummy is: {0.5f, 0.0f}
smallerDummy = dummy.xx;  // smallerDummy is: {1.0f, 1.0f}
smallerDummy = dummy.xr;  // invalid!

equalDummy.xz = dummy.yz;  // equalDummy is: {0.75f, 0.0f, 0.5f, 0.0f}
equalDummy.x = dummy.y;    // equalDummy is: {0.75f, 0.0f, 0.0f, 0.0f}
equalDummy.y = dummy;      // equalDummy is: {0.0f, 1.0f, 0.0f, 0.0f}
```

Note that the keys must be in the same name set, else the declaration is invalid. Also note that using a vector variable
as a scalar always only accesses the first coordinate of the vector.

---

In the next tutorial, we will create a few special shader effects, just for fun!

## References

* Microsoft Developer Network ([MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/ee663274(v=vs.85)))
* Wikipedia