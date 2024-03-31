---
title: Intro to Quadratic Forms
description: This tutorial introduces the quadratic forms associated with symmetric bilinear forms.
---

The theory of symmetric bilinear forms is intrinsically linked to the theory of quadratic forms. Over rings where two is a unit, they are even *the same*.

### Definition I.4.1
A quadratic form on a $R$-module $M$ is a function $q: M \to R$ such, that $q(ax)=a^2x$, for all $a \in R$, and such, that the function $b_q(x,y)$ on $M \times M$ defined by $$b_q(x,y) = q(x+y)-q(x)-q(y)$$is a bilinear form over $R$. The pair $(M,q)$ is then called a quadratic module.

### Definition I.4.2
Just as for bilinear modules, an isometry between two quadratic modules is an homomorphism between the two modules which retains the structure of the quadratic modules. Two quadratic modules are called isometric if there exists a bijective isometry between them.

### Remark
Just as for bilinear forms, isometries are also isomorphisms in the category of quadratic modules and we therefor also say that two quadratic modules are isomorphic instead of isometric.

### Remark
An isometry of quadratic modules is also an isometry of the underlying bilinear modules, but the converse only holds if $2$ is not a zero divisor in $R$.

### Remark
If $2 \in R^*$, then the following maps $$q \mapsto b_q \text{ and } b \mapsto q_b,$$where $q_b(x) := \frac{1}{2}b(x,x)$, are isomorphisms, inverse to each other, between the $R$-modules of quadratic and bilinear forms on a given module.

It is easy to see that if $b$ is a not necessarily symmetric bilinear form, then the function $q(x) = b(x,x)$ is quadratic with $b_q = b(x,y) + b(y,x)$. 

### Theorem I.4.3
If $M$ is finitely generated and projective, every quadratic form is of the form described above.

### Remark
Note that two bilinear forms give rise to the same quadratic form if, and only if, their difference is symplectic.

As for bilinear modules, we can construct the orthogonal sum of quadratic modules:

### Definition I.4.4
For quadratic modules $(M_1,q_1), (M_2, q_2), ..., (M_n,q_n)$ the orthogonal sum is defined as the direct sum of the modules $M_i$ with a quadratic form $q$ defined by $$q(x_1 \oplus x_2 \oplus ... \oplus x_n)=\sum q_i(x_i).$$
### Definition I.4.5
We call $(M,q)$ a quadratic space if $M$ is finitely generated and projective, and if, in addition, the underlying bilinear form is regular.

Similar to $\langle G \rangle$ for a Gram-Matrix $G$ of a bilinear module, we will use the notation $[G]$ to define isometry classes of quadratic modules. As such, we write $[\begin{pmatrix}1&1\\0&1\end{pmatrix}]$ for the quadratic module with quadratic form $x_1^2 + x_1x_2 + x_2^2$. The bilinear module associated with this is $\langle \begin{pmatrix} 2&1\\1&2 \end{pmatrix} \rangle$.

---

We now want to investigate what information the determinant of a quadratic module holds. Using basic linear algebra, particularly the Leibniz-rule, we get the following:

### Lemma
The determinant of a matrix $\operatorname{diag}(a_{11},a_{22}, ..., a_{nn}) + (a_{ij})_{ij}$, with n odd, is of the form: 
$2 \cdot P_n(a_{ii},a_{ij})$, where $P_n \in \mathbb{Z}[x_{ii},y_{ij}]$ with $\frac{n(n+1)}{2}$ unknowns.

### Definition and Remark I.4.6
Let $(M,q)$ be a finitely generated and free quadratic module with odd dimension and bases $(v_1, v_2, ..., v_n)$ and $(w_1, w_2, ..., w_n)$, with $w_j = \sum t_{ij}v_i$, then:

* $d_q(v_1, v_2, ..., v_n) := P_n(q(v_1),q(v_2),...,q(v_n),b_q(v_i,v_j))$,
* $2 \cdot d_q(v_1, ..., v_n) = d_{b_q}(v_1, ..., v_n)$,
* $d_q(w_1, ..., w_n) = (det T)^2 \cdot d_q(v_1, ..., v_n)$.

Similar to bilinear modules, we have the following

### Definition I.4.7
Let $(M,q)$ be a finitely generated free quadratic module of odd dimension n. The half-determinant of $(M,q)$ is the class modulo squares of units of the half-discriminant of any basis $v_1, ..., v_n$ of $M$, written as $$\operatorname{hdet} M := \operatorname{hdet}(M,q) = d_q(v_1, ..., v_n).$$The quadratic module is called half-regular if its half-determinant is represented by a unit in $R$.

### Remark
Over a field of characteristic two, a quadratic space of odd dimensions cannot be regular, as the underlying bilinear form must then be symplectic.

---

We now give a first decomposition theorem over fields:
### Theorem 1.4.8
Let $(V,q)$ be a regular quadratic space over a field $K$ of characteristic not equal two, then $V$ can be decomposed into orthogonal subspaces as follows: $V = \perp_{i=1}^m V_i \perp_{i=1}^s W_i \perp V_0^\perp$, where the $V_i$ are regular spaces of dimension two, the $W_i$ are one-dimensional spaces with $q(W_i) \neq 0$ and $q(V_0^\perp)=0$.

## Literature
 * Symmetric Bilinear Forms by J. Milnor and D. Husemoller
 * Arithmetic Theory of Quadratic Forms by [R. Scharlau](http://www.mathematik.tu-dortmund.de/~scharlau/)