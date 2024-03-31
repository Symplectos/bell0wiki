---
title: Orthogonal Decompositions
description: In this tutorial we learn that over an arbitrary field, every finite-dimensional bilinear space has an orthogonal decomposition into subspaces of dimension at most two. Over a field of characteristic not two, every finite-dimensional bilinear space possesses an orthogonal basis.
---

To further investigate bilinear forms, we want to take a closer look at orthogonal sums of bilinear modules. For the definition of an orthogonal sum, see [I.1.4](https://bell0bytes.eu/introduction-to-bilinear-forms/). [Theorem I.1.9](https://bell0bytes.eu/introduction-to-bilinear-forms/) explained when an orthogonal sum is non-degenerate or regular. Following [I.2](https://bell0bytes.eu/p/d0bdc58f-e196-4c81-95c8-9a0b6d6d2658/), we add that for finitely generated free bilinear modules $M_i$, the rank $rk(M_1 \oplus M_2 \oplus ... \oplus M_n) = \sum rk(M_i)$ and $det(M_1 \oplus M_2 \oplus ... \oplus M_n) = \prod det(M_i)$.

In [theorem I.1.10](https://bell0bytes.eu/introduction-to-bilinear-forms/) we saw an example of an orthogonal decomposition over fields. A similar result is true (and important) for bilinear modules:

### Lemma I.3.1
Let $(M,b)$ be a symmetric bilinear module and $N \subseteq M$. If $b_{\mid N}$ is regular, then M is isomorphic to the orthogonal sum $N \oplus N^\perp$.

### Theorem I.3.2
Let $(M,b)$ be a symmetric bilinear module and $X$ a free module spanned by linear independent elements $x_1, x_2, ..., x_k$ (see remark after definition [I.2.2](https://bell0bytes.eu/bilinear-forms-over-free-modules/)), then $M \cong X \oplus X^\perp$.

As an application of this theorem, we immediately get the following 

### Corollary I.3.3
For a finitely generated symmetric bilinear module $(M,b)$ there exists an orthogonal decomposition of the following form: $$M \cong \langle u_1 \rangle \oplus \langle u_2 \rangle \oplus ... \oplus \langle u_k \rangle \oplus N,$$ where the $u_i$ are units and $b(n,n)$ is not a unit for every $n \in N$.

Investigating this module $N$ a bit more precisely, we notice that over a field $N$ must be symplectic, thus over a field of characteristic not equal to two, the bilinear form restricted to $N$ must be zero (symmetric and symplectic). In a general setting, we get the following:

### Corollary I.3.4
Over a local ring of characteristic not two, every symmetric bilinear space possesses an orthogonal basis.

### Remark
The proof is relatively easy if we remember that every finitely generated projective module over a local ring is free.

As a last example or theorem in this rather short *chapter*, we give an orthogonal decomposition for vector spaces over fields (basically the previous corollary with different words):

### Corollary I.3.5
Over an arbitrary field, every finite-dimensional bilinear space has an orthogonal decomposition into subspaces of dimension at most two. Over a field of characteristic not two, every finite-dimensional bilinear space possesses an orthogonal basis.

## Literature
 * Symmetric Bilinear Forms by J. Milnor and D. Husemoller
 * Arithmetic Theory of Quadratic Forms by [R. Scharlau](http://www.mathematik.tu-dortmund.de/~scharlau/)