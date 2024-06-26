---
title: New Extremal Lattice
description: Two new twenty-dimensional five-modular lattices have been found; finally settling the question of the existence of such lattices.
---

## Extremal Lattices in $\operatorname{II}_{20}(5^{+10})$
> Patience and perseverance have a magical effect before which difficulties disappear and obstacles vanish.

After walking through a thick forest of lattices for a few weeks, Clara Oswald, the impossible girl, found an extremal lattice $L$ in the $\operatorname{II}_{20}(5^{+10})$ genus. $L$ has a trivial automorphism group and since it is not $5$-modular, its dual $L^\#$ is an extremal lattice for this genus as well. The existence of those lattices settles the question of the existence and uniqueness of such extremal lattices in this genus. The new lattices can be found in the [lattice database of Michael Jürgens](https://www.mathematik.tu-dortmund.de/sites/michael-juergens).

To traverse through this genus, Clara was entrusted with a modified version of [TN](https://arxiv.org/abs/math/0411134), implemented in [MAGMA](http://magma.maths.usyd.edu.au/magma/). This new version features a heuristic search strategy, which runs through the genus of a lattice without caring about isometry at all; it simply creates a suitable number of neighbours in each iteration and then chooses one of those neighbours with the highest minimum $m$ and the smallest number of short vectors with length $m$ as the next lattice to expand.

$$
L:=\begin{pmatrix}6&1&-2&0&-2&-3&1&1&1&-3&-2&-1&-1&2&1&-3&2&-3&-1&-1\\\\
1&6&-1&-2&-3&2&0&-1&1&-1&-1&-3&-3&3&-1&0&-1&-1&-2&-3\\\\
-2&-1&6&2&0&3&-2&-2&-3&3&0&-1&0&-3&-2&-1&-3&1&2&0\\\\
0&-2&2&6&1&2&0&1&1&3&-2&2&-1&0&2&1&1&-1&0&1\\\\
-2&-3&0&1&6&1&-1&-1&1&3&1&2&2&0&-1&3&2&3&-1&1\\\\
-3&2&3&2&1&8&0&-3&-1&5&0&-2&-2&-1&-2&2&-1&1&-2&0\\\\
1&0&-2&0&-1&0&6&1&1&0&2&2&-1&-2&2&0&2&-3&-2&-1\\\\
1&-1&-2&1&-1&-3&1&6&1&-1&-1&1&-1&2&1&0&0&-1&-1&0\\\\
1&1&-3&1&1&-1&1&1&6&-1&-2&2&-2&4&1&1&2&-2&-3&0\\\\
-3&-1&3&3&3&5&0&-1&-1&8&2&1&1&-2&-1&2&-1&1&-2&1\\\\
-2&-1&0&-2&1&0&2&-1&-2&2&6&1&2&-3&0&0&0&1&0&-1\\\\
-1&-3&-1&2&2&-2&2&1&2&1&1&6&1&-1&2&2&1&0&0&1\\\\
-1&-3&0&-1&2&-2&-1&-1&-2&1&2&1&6&-2&1&0&0&1&2&2\\\\
2&3&-3&0&0&-1&-2&2&4&-2&-3&-1&-2&8&0&1&1&0&-3&-1\\\\
1&-1&-2&2&-1&-2&2&1&1&-1&0&2&1&0&6&1&3&-2&1&0\\\\
-3&0&-1&1&3&2&0&0&1&2&0&2&0&1&1&6&1&3&-1&0\\\\
2&-1&-3&1&2&-1&2&0&2&-1&0&1&0&1&3&1&6&-1&-1&-1\\\\
-3&-1&1&-1&3&1&-3&-1&-2&1&1&0&1&0&-2&3&-1&6&1&0\\\\
-1&-2&2&0&-1&-2&-2&-1&-3&-2&0&0&2&-3&1&-1&-1&1&6&1\\\\
-1&-3&0&1&1&0&-1&0&0&1&-1&1&2&-1&0&0&-1&0&1&6\end{pmatrix}
$$
and

$$
L^\#:=\begin{pmatrix}6&-2&3&-2&1&0&-2&0&0&-2&-1&0&-1&1&1&-1&0&-1&1&0\\\\
-2&6&-1&3&-1&-1&2&-1&2&3&-2&1&2&1&0&-3&-1&1&1&-1\\\\
3&-1&6&0&-2&1&-1&2&-1&1&-2&-1&-3&-1&-1&0&1&1&0&1\\\\
-2&3&0&6&0&-3&1&1&1&3&-2&0&1&2&-3&-2&1&3&1&-1\\\\
1&-1&-2&0&6&-1&-1&-1&-1&-2&0&2&0&3&-1&-2&-2&-2&1&0\\\\
0&-1&1&-3&-1&6&-1&1&-2&-1&0&1&0&-3&2&3&-1&-2&-3&3\\\\
-2&2&-1&1&-1&-1&6&1&0&2&-1&1&-1&-2&2&-1&-1&3&-1&2\\\\
0&-1&2&1&-1&1&1&6&1&2&-2&0&0&-2&-1&1&2&3&-2&4\\\\
0&2&-1&1&-1&-2&0&1&6&1&-2&-2&2&1&-1&-1&0&1&2&1\\\\
-2&3&1&3&-2&-1&2&2&1&6&-2&1&1&-1&-2&0&0&2&1&0\\\\
-1&-2&-2&-2&0&0&-1&-2&-2&-2&6&1&1&-1&0&2&1&-2&-2&-3\\\\
0&1&-1&0&2&1&1&0&-2&1&1&6&2&0&1&0&0&-1&-2&1\\\\
-1&2&-3&1&0&0&-1&0&2&1&1&2&6&0&0&0&1&-1&-1&-1\\\\
1&1&-1&2&3&-3&-2&-2&1&-1&-1&0&0&6&-2&-3&-1&0&3&-2\\\\
1&0&-1&-3&-1&2&2&-1&-1&-2&0&1&0&-2&6&0&0&0&-1&1\\\\
-1&-3&0&-2&-2&3&-1&1&-1&0&2&0&0&-3&0&6&1&-1&-2&2\\\\
0&-1&1&1&-2&-1&-1&2&0&0&1&0&1&-1&0&1&6&1&-1&0\\\\
-1&1&1&3&-2&-2&3&3&1&2&-2&-1&-1&0&0&-1&1&6&0&1\\\\
1&1&0&1&1&-3&-1&-2&2&1&-2&-2&-1&3&-1&-2&-1&0&6&-2\\\\
0&-1&1&-1&0&3&2&4&1&0&-3&1&-1&-2&1&2&0&1&-2&8
\end{pmatrix}
$$
```
1. Standard Lattice of rank 20 and degree 20
Determinant: 9765625
Factored Determinant: 5^10
Minimum: 6
Inner Product Matrix:
[ 6  1 -2  0 -2 -3  1  1  1 -3 -2 -1 -1  2  1 -3  2 -3 -1 -1]
[ 1  6 -1 -2 -3  2  0 -1  1 -1 -1 -3 -3  3 -1  0 -1 -1 -2 -3]
[-2 -1  6  2  0  3 -2 -2 -3  3  0 -1  0 -3 -2 -1 -3  1  2  0]
[ 0 -2  2  6  1  2  0  1  1  3 -2  2 -1  0  2  1  1 -1  0  1]
[-2 -3  0  1  6  1 -1 -1  1  3  1  2  2  0 -1  3  2  3 -1  1]
[-3  2  3  2  1  8  0 -3 -1  5  0 -2 -2 -1 -2  2 -1  1 -2  0]
[ 1  0 -2  0 -1  0  6  1  1  0  2  2 -1 -2  2  0  2 -3 -2 -1]
[ 1 -1 -2  1 -1 -3  1  6  1 -1 -1  1 -1  2  1  0  0 -1 -1  0]
[ 1  1 -3  1  1 -1  1  1  6 -1 -2  2 -2  4  1  1  2 -2 -3  0]
[-3 -1  3  3  3  5  0 -1 -1  8  2  1  1 -2 -1  2 -1  1 -2  1]
[-2 -1  0 -2  1  0  2 -1 -2  2  6  1  2 -3  0  0  0  1  0 -1]
[-1 -3 -1  2  2 -2  2  1  2  1  1  6  1 -1  2  2  1  0  0  1]
[-1 -3  0 -1  2 -2 -1 -1 -2  1  2  1  6 -2  1  0  0  1  2  2]
[ 2  3 -3  0  0 -1 -2  2  4 -2 -3 -1 -2  8  0  1  1  0 -3 -1]
[ 1 -1 -2  2 -1 -2  2  1  1 -1  0  2  1  0  6  1  3 -2  1  0]
[-3  0 -1  1  3  2  0  0  1  2  0  2  0  1  1  6  1  3 -1  0]
[ 2 -1 -3  1  2 -1  2  0  2 -1  0  1  0  1  3  1  6 -1 -1 -1]
[-3 -1  1 -1  3  1 -3 -1 -2  1  1  0  1  0 -2  3 -1  6  1  0]
[-1 -2  2  0 -1 -2 -2 -1 -3 -2  0  0  2 -3  1 -1 -1  1  6  1]
[-1 -3  0  1  1  0 -1  0  0  1 -1  1  2 -1  0  0 -1  0  1  6]

|Aut|    = [ <2, 1> ]
Modular  = false
LatDB    = -
```

```
2. Standard Lattice of rank 20 and degree 20
Determinant: 9765625
Factored Determinant: 5^10
Minimum: 6
Inner Product Matrix:
[ 6 -2  3 -2  1  0 -2  0  0 -2 -1  0 -1  1  1 -1  0 -1  1  0]
[-2  6 -1  3 -1 -1  2 -1  2  3 -2  1  2  1  0 -3 -1  1  1 -1]
[ 3 -1  6  0 -2  1 -1  2 -1  1 -2 -1 -3 -1 -1  0  1  1  0  1]
[-2  3  0  6  0 -3  1  1  1  3 -2  0  1  2 -3 -2  1  3  1 -1]
[ 1 -1 -2  0  6 -1 -1 -1 -1 -2  0  2  0  3 -1 -2 -2 -2  1  0]
[ 0 -1  1 -3 -1  6 -1  1 -2 -1  0  1  0 -3  2  3 -1 -2 -3  3]
[-2  2 -1  1 -1 -1  6  1  0  2 -1  1 -1 -2  2 -1 -1  3 -1  2]
[ 0 -1  2  1 -1  1  1  6  1  2 -2  0  0 -2 -1  1  2  3 -2  4]
[ 0  2 -1  1 -1 -2  0  1  6  1 -2 -2  2  1 -1 -1  0  1  2  1]
[-2  3  1  3 -2 -1  2  2  1  6 -2  1  1 -1 -2  0  0  2  1  0]
[-1 -2 -2 -2  0  0 -1 -2 -2 -2  6  1  1 -1  0  2  1 -2 -2 -3]
[ 0  1 -1  0  2  1  1  0 -2  1  1  6  2  0  1  0  0 -1 -2  1]
[-1  2 -3  1  0  0 -1  0  2  1  1  2  6  0  0  0  1 -1 -1 -1]
[ 1  1 -1  2  3 -3 -2 -2  1 -1 -1  0  0  6 -2 -3 -1  0  3 -2]
[ 1  0 -1 -3 -1  2  2 -1 -1 -2  0  1  0 -2  6  0  0  0 -1  1]
[-1 -3  0 -2 -2  3 -1  1 -1  0  2  0  0 -3  0  6  1 -1 -2  2]
[ 0 -1  1  1 -2 -1 -1  2  0  0  1  0  1 -1  0  1  6  1 -1  0]
[-1  1  1  3 -2 -2  3  3  1  2 -2 -1 -1  0  0 -1  1  6  0  1]
[ 1  1  0  1  1 -3 -1 -2  2  1 -2 -2 -1  3 -1 -2 -1  0  6 -2]
[ 0 -1  1 -1  0  3  2  4  1  0 -3  1 -1 -2  1  2  0  1 -2  8]

|Aut|    = [ <2, 1> ]
Modular  = false
LatDB    = -
```