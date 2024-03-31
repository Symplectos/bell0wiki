---
title: Group Operations
description: The concept of group actions provides a general interpretation of group elements as mappings. The Orbit-Stabilizer theorem is proven.
---

## The Symmetric Group
A permutation of a set $M$ ($M$ for *Menge*, the German word for set) is a [bijective](https://en.wikipedia.org/wiki/Bijection) [function](https://en.wikipedia.org/wiki/Function_(mathematics)) $\sigma: M \to M$. 

As an example, consider the set $M := \{ \Delta, \circ, \star \}$; now one such permutation $\sigma$ might be defined to do the following: $\Delta \mapsto \circ, \circ \mapsto \Delta, \star \mapsto \star$. The *star* is fixed, but the triangle and the circle are *permutated*.

For a more concrete example, the *shape* or the *nature* of the objects in the set is not relevant, all that needs to be known is the number of objects in $M$, called the cardinality $\| M \|$ of $M$. Let $M := \{ 1, 2, 3 \}$ be a set with $3$ elements, then the above permutation can then be described by $1 \mapsto 2, 2 \mapsto 1, 3 \mapsto 3$. The third element is left fixed, while the first two are permutated.

Generally, as such permutations are bijective, they are invertible, with their inverse being a, probably different, permutation of $M$ as well. The [composition](https://en.wikipedia.org/wiki/Function_composition) of permutations is again a, probably different, permutation of $M$. There also clearly exists a permutation that does nothing, the identity, namely $m \mapsto m$, for each element $m \in M$. Therefore, the set of all the permutations of a set $M$ is a [group](https://en.wikipedia.org/wiki/Group_(mathematics)), the so called [symmetry group]((https://en.wikipedia.org/wiki/Permutation_group)) $\operatorname{Sym}M := \{ \sigma : M \to M \, \mid \, \sigma \text{ bijective } \}$ of $M$.

For a finite set $M := \{1,2, \dots n\}$, the [symmetric group](https://en.wikipedia.org/wiki/Permutation_group) $S_n$ of $M$, or the symmetric group of order $n$, is defined as the permutation group of $M$: $S_n := \operatorname{Sym}\\{1, 2, \dots, n\\}$. Note that the order of $S_n$is $n!$.

One can consider those permutations to be the symmetries of an object. Imagine a square rotated by $\frac{\pi}{2}$, the actual *vertices* have *moved*, but the square still looks the same. Can you figure out all the eight symmetries of the square?

If you ever wanted to see the mathematical beauty of symmetry, think about visiting the Qalat Al-Hamra, or the [Alhambra](https://en.wikipedia.org/wiki/Alhambra), in Grenada, Spain.

![Alhambra](../../../../assets/mathematics/algebra/alhambra.webp)

## Cayley's Theorem
[Arthur Cayley](https://en.wikipedia.org/wiki/Arthur_Cayley) was a British mathematician, and probably the first man to clearly define the concept of a group. One of his famous theorems states that **every group is isomorphic to a group of permutations**.

Two *objects* are said to be isomorphic, if there exists an isomorphism, which is a bijective [homomorphism](https://en.wikipedia.org/wiki/Homomorphism) (from the ancient Greek words *ὁμός (homós)*, which means *equal* or *similar*, and *μορφή (morphé)*, which means *form*), between the two objects. Homomorphisms are structure preservering maps that identify objects which, although looking differently, are essentially the same.

To prove the theorem, let $\operatorname{Sym}G$ denote the symmetry group of a group $(G, \cdot)$. The basic idea is that each element $g \in G$ corresponds to a permutation of $G$:
$\sigma: G \to \operatorname{Sym}G \, , \, g \mapsto \sigma(g) =: \sigma_g$, with $\sigma_g : G \to G \, , \, h \mapsto \sigma_g(h) = g.h := g \cdot h$. Since $G$ is a group, it is clear that $\sigma_g$ is bijective, thus indeed a permutation of $G$. 

Furthermore, $G$ being a group ensures that $\sigma$ is an injective homomorphism, which means that $G$ is indeed isomorphic to a [subgroup](https://en.wikipedia.org/wiki/Subgroup) of $\operatorname{Sym}G$. Subgroups of $\operatorname{Sym}G$ are often called *permutation groups* and are denoted by $\operatorname{Per}G$.

## Group Operations
With Cayley's theorem, it is now clear how to define a group operation on a set: An operation of a group $(G, \cdot)$ on a set $M$ is a homomorphism $\sigma$ of $G$ into the symmetry group of $M$ defined as above. An operation thus provides a mapping $G \times M \to M$, $(g,m) \mapsto \sigma_g(m) = g.m = g \cdot m$. We also say that $G$ acts on $M$.

Obviously, the following two properties hold:

1. $\forall m \in M \, : \, e.m = m$, where $e_G$ is the unit element of $G$.
2. $\forall g_1, g_2 \in G, m \in M \, : \, g_1(g_2.m) = (g_1g_2).m$.

Conversely, a map $G \times M \to M \, , \, (g,m) \mapsto g.m$ satisfying these two properties defines a permutation for each $g \in G$. We thus obtain a homomorphism from $G$ into $\operatorname{Sym}G$. So an operation of $G$ on $M$ could also be defined as a mapping $G \times M \to M$ with the two properties from above. 

### The Orbit
Let $m \in M$ be arbitrary chosen but fixed. The subset of $M$ consisting of the images of $m$ under operation by elements of $G$ is denoted by $G.m := \{ g.m \, \mid \, g \in G \}$ and called the orbit of $m$ under $G$.

Clearly, all the orbits define a partition of $M = \bigcup_{m \in M}G.m$. If an element $m \in M$ belongs to the orbit of both $m_1 \in M$ and $m_2 \in M$, then there exist $g_1, g_2 \in G$ such, that $m = g_1.m_1 = g_2.m_2$. Since $G$ is a group, this implies that $m_1 = g_1^{-1} \cdot g_2.m_2$ and $m_2 = g_2^{-1} \cdot g_1.m_1$, thus $m_1$ belongs to the orbit of $m_2$ and vice versa. In conclusion: $G.m_1 = G.m_2$, thus, by choosing representatives $v$ for each orbit, we can write $M = \bigcup_{v \in V} G.v$, where $V$ denotes the set of the chosen representatives. 

A group operation is called transitive, or G is said to act transitively on $M$, if there is only one orbit: $M = G.m$, for any $m \in M$, that is, for all $m_1, m_2 \in M$ there exists $g \in G$ such, that $m_2 = g.m_1$.

### The Stabilizer
Let $m \in M$ be arbitrarily chosen but fixed. The set of elements $g \in G$ which leave $m$ fixed, that is $g.m = m$, is a subgroup of $G$, the so-called isotropy group of $m$ in $G$, or the stabilizer of $m$ under the action of $G$, denoted by $G_m := \{ g \in G \, \mid \, g.m = m \}$. An element $m \in M$ is called a fixed point of $G$, if $G_m = G$, in other words, if it is fixed by each operation.

Obviously, the [kernel](https://en.wikipedia.org/wiki/Kernel_(algebra)) $\operatorname{ker}\sigma = \{g \in G \, \mid \, \forall m \in M \, : \,g.m = m \}$ of a group operation is the intersection of all the isotropy groups: $\operatorname{ker}\sigma = \bigcap_{m \in M}G_m$. This is the set of all the elements of $G$ which leave all the elements of $M$ fixed. 

A group operation is said to be faithful, if its kernel is trivial, i.e. if $\operatorname{ker}\sigma = \{ e_G \}$.

## The Orbit-Stabilizer Theorem
The size of the orbit of an element $m \in M$ is the [index](https://de.wikipedia.org/wiki/Index_(Gruppentheorie)), the relative size, of the stabilizer of $m$ in $G$:
$| G.m | = [ G : G_m ]$.

For a finite set $G$, this corresponds to:
$| G.m | = \frac{| G |}{|G_m|}$. 
Note that in particular, the size of any orbit divides the [order](https://en.wikipedia.org/wiki/Order_(group_theory)), or the cardinality, of the group.

For a proof, we must define a bijective map $\varphi$ between $G.m$ and $G / G_m := \{ g.G_m \, \mid \, g \in G \}$, the set of left [cosets](https://en.wikipedia.org/wiki/Coset) of $G_m$ in $G$. We can do so as follows: $\varphi: G.m \to G/G_m \, , \, n = g.m \mapsto g.G_m$.

The first thing to check is whether $\varphi$ is well-defined, as for a given $n$, as above, the choice of $g$ in $n = g.m$ is not unique, as there is no bijection between $G$ and $G.m$ in general. Suppose that $n = g_1.m = g_2.m$, then clearly $g_2^{-1}g_1.m = m \Leftrightarrow g_1.G_m = g_2.G_m$, thus the image of $n$ under $f$ does not depend on the choice of $g$, since the images are still in the same coset.

By the definition of $\varphi$ it is clear that $\varphi$ is [surjective](https://en.wikipedia.org/wiki/Surjective_function). To see that it is also [injective](https://en.wikipedia.org/wiki/Injective_function), assume that $\varphi(m_1) = \varphi(m_2)$, for $m_1 = g_1.m \in G.m$ and $m_2 = g_2.m \in G.m$. Then, as $g_1.G_m = g_2.G_m$, i.e. $g_2^{-1} \cdot g_1 \in G_m$, it follows that $g_2^{-1} \cdot g_1.m = m$, and in conclusion $g_1 \cdot m = g_2 \cdot m$, as desired. 

## The Orbit-Counting Theorem
In the case of a finite group operating on a finite set, a theorem, probably due to [Ferdinand Georg Frobenius](https://en.wikipedia.org/wiki/Ferdinand_Georg_Frobenius), allows us to count the number of orbits $n_o$:

$n_o = \frac{1}{|G|} \cdot \sum\limits_{g \in G} | M_g |$, where $M_g := \{ m \in M \, \mid \, g.m = m\}$ denotes the subset of all the elements of $M$ fixed by $g \in G$. 

In other words, the number of orbits under a group operation is the average number of points, or elements of $M$, that are left fixed by the elements of $G$.

To prove this, we use the Orbit-Stabilizer Theorem: 

$$
\begin{align*}
\sum\limits_{g \in G}|M_g| &= |\{(g,m) \in G \times M \, \mid \, g.m = m \}| \\ &= \sum\limits_{m \in M} | G_m | \\ &= \sum\limits_{m \in M} \frac{|G|}{|G.m|}.
\end{align*}
$$
Further, using the fact that $M$ can be written as a disjoint union of the orbits under the group operation, we get the desired result:

$$
\begin{align*}
\frac{|G|}{|G.m|} &= |G| \cdot \sum\limits_{m \in M}\frac{1}{|G.m|} \\ &= |G| \cdot \sum\limits_{v \in V}1 \\ &= |G| \cdot n_o.
\end{align*}
$$
## Exercises
### Exercise 1
Show that $\| S_n \| = n!$.
### Exercise 2
Prove that $D_3$, the [dihedral group of order $6$](https://en.wikipedia.org/wiki/Dihedral_group_of_order_6), is isomorphic to $S_3$.
### Exercise 3
Prove that the isotropy group is indeed a subgroup of $G$.

## References
### Literature
* Algebra, by Serge Lang
* Algebra I, by Rudolf Scharlau
### Art
* [The Art of M.C. Escher](http://mathstat.slu.edu/escher/index.php/Math_and_the_Art_of_M._C._Escher)
* Wikipedia