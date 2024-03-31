---
title: Bilinear Forms over Modules
description: Before embarking on a journey to study quadratic (and hermitian) forms on modules over general rings, we will learn about bilinear forms over rings
---

## Free Modules
To learn more about bilinear forms, it is first necessary to learn more about free modules.

### Definition I.2.1
For a finitely generated free $R$-module $M$ with basis $b_1, ..., b_n$, we call $n$ the *rank* of $M$ and denote this by $\operatorname{rk}M=n$.

### Remark
Since we live over commutative rings, the rank is uniquely defined.

### Definition I.2.2
Let $(M,b)$ be a bilinear module and $b_1, ..., b_k$ a system of elements of $M$. We can then construct the so-called *Gram-Matrix* with respect to $b$ of the system of elements as follows: $G:=(g_{ij})_{ij}=b(b_i,b_j)$. The determinant of $G$ is also called the determinant of $b_1, ..., b_k$, and denoted by $d_b(b_1, ..., b_k)$.

### Remark
Note that a bilinear module with a Gram matrix $G$ is symmetric, if and only if, $G$ is a symmetric matrix, that is, if $G=G^t$. Similarly, it is screw-symmetric, if and only if, $G=-G^t$, and symplectic, if and only if, it is screw-symmetric and if in addition $G$ has $0$ as the only diagonal entry.

### Remark
It is easy to see that the previously defined system of elements is linearly dependent if *their* determinant is not a zero divisor.

### Definition I.2.3
Given an $n \times n$ matrix $G=(g_{ij})$ with entries in $R$, $\langle G \rangle = \langle G \rangle _R$ will denote the free bilinear module over $R$ with basis $b_1, ..., b_n$ and bilinear form $b(b_1, ..., b_n)=g_{ij}$.

### Definition I.2.4
Two matrices $A,B \in R^{k \times k}_{symm}$ are called congruent, if there exists another matrix $S \in GL_k(R)$ such, that $B=S^tAS$.

### Remark
Given two different bases of a finitely generated free bilinear module $(M,b)$ it is easy to see that the two different Gram matrices respective to the different bases are congruent to each other. It thus makes sense to speak of **the** Gram-Matrix of a bilinear module.

This last remark immediately leads to the definition of a very useful invariant of finitely generated free bilinear modules.

### Definition I.2.5
The determinant of a finitely generated free bilinear module $(M,b)$ is the class modulo squares of units of the determinant of a Gram-Matrix of $(M,b)$.

### Remark
In a general setting the determinant of a finitely generated free bilinear module lives in $R / R^{ * 2}$, the so-called quotient monoid, but in the case of a free bilinear space (R is finitely generated and projective) the quotient monoid is actually a quotient group: $R^* / R^{*2}$.

### Example
Over a field, the determinant of a bilinear space is either zero or an element of the quotient group.

### Remark
To learn more about the groups of square classes and the quotient group, have a look at, for example, [JPS], page 14.

We now want to use the determinant as a tool to compute whether a finitely generated free module is non-degenerate or even regular. To do so, we obviously have to use $\widehat{b}$, thus we need to have a closer look at $M^*$, especially its basis:

### Lemma
To each basis of a finitely generated free module there corresponds a unique dual basis.

### Lemma
The Gram-Matrix of a finitely generated free bilinear module $(M,b)$ with respect to a given basis is equal to the transformation matrix representing $\widehat{b}$ with respect to the given basis and its dual basis.

With this lemmata, we can formulate the following

### Theorem I.2.6
A finitely generated free bilinear module $(M,b)$ is non-degenerate if and only if its determinant is not a zero-divisor (not represented by a zero divisor). The bilinear module $(M,b)$ is regular if and only its determinant is a unit (represented by a unit), or in other words, if and only if its Gram-Matrix is invertible.

## Literature
 * Symmetric Bilinear Forms by J. Milnor and D. Husemoller
 * Arithmetic Theory of Quadratic Forms by [R. Scharlau](http://www.mathematik.tu-dortmund.de/~scharlau/)
 * [JPS] Cours d'arithmétique by J.P. Serre