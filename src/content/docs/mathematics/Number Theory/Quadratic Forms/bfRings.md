---
title: Bilinear Forms over Rings
description: Before embarking on a journey to study quadratic (and hermitian) forms on modules over general rings, we will learn about bilinear forms over rings
---

Quadratic forms were probably first studied by Babylonian mathematicians and from its birth until the beginning of the twentieth century, quadratic forms were only studied over the field of real numbers, the complex field or the ring of integers. It was only in 1937 that [Ernst Witt](https://en.wikipedia.org/wiki/Ernst_Witt) published a groundbreaking paper that would become the founding stone to incorporate the study of quadratic forms into the theory of pure algebra.

We want to embark on a journey to study quadratic (and hermitian) forms on modules over general rings, but first, we will give an introduction into the theory of bilinear forms over rings (our rings will always be associative with identity element 1).

## Bilinear Forms
### Definition I.1.1
Let $M$ be a left $R$-module. A *bilinear form* on $M$ is a function $b: M \times M \to R$, which is a linear function for both arguments. A bilinear form $b$ is called *symmetric*, if $b(x,y)=b(y,x)$, for all $x,y \in M$. The form is called *screw-symmetric*, if $b(x,y)=-b(y,x)$, for all $x,y \in M$, and *symplectic* or *alternating*, if $b(m,m)=0$, for all $m \in M$.

An object $(M,b)$, where $M$ is a $R$-module and $b$ a symmetric bilinear form on $M$, is called a *symmetric bilinear module* over $R$. Since we are mostly only interested in the theory of symmetric bilinear forms, we will omit the word symmetric in this notion for the rest of this blog entry. 

### Remark
A symplectic form is always screw-symmetric, for if $x,y \in M$ are arbitrarily chosen, it is easy to see that $b(x,y) + b(y,x) = b(x+y,x+y)-b(x,x)-b(y,y)$.

### Remark
If $2 \in R^*$, then a form is symplectic if, and only if, it is screw-symmetric, which follows immediately from $b(m,m)=-b(m,m)$ for all $m \in M$. 

### Definition and Remark I.1.2
Now let $(M_1,b_1), (M_2,b_2)$ be two bilinear modules. An injective module homomorphism $\varphi: M_1 \to M_2$ which preserves the bilinear forms is called an *isometry* and we say that the two bilinear modules are *isometric* if there exists a bijective homomorphism between them. The relation of being isometric is an equivalence relation, and thus it makes sense to say that a bijective isometry is an isomorphism in the category of bilinear modules. (We will talk more about that category in a later entry.)

### Definition I.1.3
Two elements $x,y$ of a bilinear module $(M,b)$ are called orthogonal, if $b(x,y)=0$. For a submodule $N \subseteq M$, we define the orthogonal submodule $N^\perp$ as follows $$N^\perp:= \{ m \in M \mid \forall x \in M : b(x,y)=0 \}.$$
### Remark
It is easy to see that $N^\perp = \bigcap_{\\{ n \in N \\}}^\perp$, and it is interesting to note that $\\{y\\}^\perp = \operatorname{ker} x \mapsto b(x,y)$.

### Definition I.1.4
A sum of submodules $M_1, M_2, ..., M_n$ of $M$ is called an *internal orthogonal sum*, or orthogonal sum, if it is a direct sum, that is, if $M = \bigoplus_{i=1}^n M_i$ and $M_i \perp M_j$ for all $i \neq j$.

The *external orthogonal sum* of two submodules $(M_1,b_1), (M_2, b_2)$ is defined as $(M_1 \times M_2, b)$ with $b((x_1,x_2),(y_1,y_2))=b_1(x_1,y_1)+b_2(x_2,y_2)$.

### Remark
Those two types of orthogonal sums are obviously canonically isomorphic.

### Definition and Remark I.1.5
For a given bilinear module $(M,b)$ we have a natural $R$-module-homomorphism $\widehat{b} : M \to M^\*$, $m \mapsto b(-,m)$ and conversely, a linear form $f: M \to M^*$ defines a bilinear form by $b(x,y):=f(y)(x)$, with $\widehat{b}=f$.

### Remark
We thus have a module isomorphism between the set of all bilinear forms on $M$ and all homomorphisms from $M$ to $M^*$.

The next definition is essential to further specify the bilinear forms we are actually interested in:

### Definition I.1.6
A bilinear module $(M,b)$ is called *non-degenerate*, if $\widehat{b}$ is injective. It is called *regular*, if $\widehat{b}$ is bijective.

### Remark
For finite vector spaces over fields those two definitions are the same, as then $\operatorname{dim}M = \operatorname{dim}M^*$.

### Remark
It is easy to see that $(M,b)$ is non-degenerate if, and only if, $M^\perp=\{0\}$, as clearly $M^\perp = \operatorname{ker}\widehat{b}$.

### Remark
In other words: Regularity means that for a given $m^* \in M^*$, $m^*: M \to R$, there exists one, and only one, $m \in M$ such, that $m^* = b(-,m)$. This is the famous representation theorem: Each linear function is defined by a unique vector.

We will now specify the modules we are truly interested in:

### Definition I.1.7
A $R$-module $P$ is projective, if there exists an $R$-module $Q$ such, that $P \oplus Q$ is free, that is, isomorphic to a direct sum of copies of $R$.

### Definition I.1.8
A bilinear module $(M,b)$ is called a *regular bilinear module* if $b$ is regular. It is called a *bilinear space* if additionally $M$ is finitely generated and projective over $R$.

### Remark
If $(M,b)$ is a regular bilinear module, then the only element $m \in M$ orthogonal to every $x \in M$ is $m=0$. Over a field, the converse statement is true: If $(M,b)$ is a bilinear module over a field such that only the zero element is orthogonal to every other element, that is, if $M^\perp = \{0\}$, then $(M,b)$ is a regular bilinear module.

### Theorem I.1.9
An orthogonal sum of bilinear modules is non-degenerate / regular if and only if each summand is a non-degenerate / regular bilinear module.

As a last result for this introductory chapter, we want to state an easy to prove theorem over fields:

### Theorem I.1.10
Let $U \subseteq V$ be a subspace of a $K$-vector space, $K$ being a field and consider the non-degenerate bilinear space $(V,b)$, then the following statements are equivalent:

 1. $\exists W : V = U \perp W$,
 2. $V = U \oplus W$,
 3. $U \cap U^\perp = \{ 0 \}$ and
 4. $b_{\mid U \times U }$ is non-degenerate.

## Literature
 * Symmetric Bilinear Forms by J. Milnor and D. Husemoller
 * Arithmetic Theory of Quadratic Forms by [R. Scharlau](http://www.mathematik.tu-dortmund.de/~scharlau/)