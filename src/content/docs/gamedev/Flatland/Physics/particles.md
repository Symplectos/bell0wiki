---
title: A Basic Particle System
description: Particle Systems are physics models that model small particles. Long ago those systems have been introduced to game engines and are the foundation of creating a realistic looking environment. They are great to, for example, model explosions, vapor trails and general lights in a game.
---

> The clever people at CERN are smashing particles together in the hope that Doctor Who will turn up and tell them to
> stop.
>
> – Ben Aaronovitch, Moon Over Soho

Particle Systems are physics models that model small particles. Long ago, those systems have been introduced to game
engines and are the foundation of creating a realistic looking environment. They are great to, for example, model
explosions, vapour trails and general lights in a game.

## A Single Particle

Basically speaking, a particle system is a group of particles that all act and behave the same way — think of rain drops
or parts of a car after a crash. All those particles have a few things in common, namely a position, a velocity vector,
a colour, and an age. The age is used to *delete* particles after a certain specified time:

```cpp
namespace physics
{
	namespace particles
	{
		// a single particle
		class Particle
		{
		private:
			mathematics::Vector2F position;				// the position of the particle
			mathematics::Vector2F velocity;				// the velocity vector
			mathematics::Vector2F acceleration;			// the acceleration vector, depends on environmental factors
			float age;									// the age of the particle; a particle is deleted once its age surpasses the maximal lifespan defined by the particle system
			std::wstring colour;						// the colour of the particle
			float intensity = 1.0f;						// the intensity diminishes as the particle nears the end of its life
			float width = 1.0f;							// the width of each particle

		public:
			// constructors
			Particle();
			Particle(const mathematics::Vector2F& position, const mathematics::Vector2F& velocity, const mathematics::Vector2F& acc, const float age = 0.0f, const std::wstring& colour = L"Black", const float width = 1.0f);

			// update
			void update(double deltaTime, float maxLifeSpan);		// returns false iff the particle should be destroyed (for example, because its lifespan is reached)

			// getters
			float getAge() const { return age; };

			// setters
			void setWidth(float w) { width = w; };

			friend class ParticleSystem;
		};
        
        ...
    }
    
    ...
}
```

Updating the particles is once again done using our semi-implicit symplectic Euler integrator:

```cpp
void Particle::update(double deltaTime,float maxLifeSpan)
{
	// update position and velocity
	physics::Kinematics::semiImplicitEuler(position, velocity, acceleration, deltaTime);
			
	// update the age and intensity
	age += 0.1f;
	intensity = (maxLifeSpan - age) / (maxLifeSpan);
}
```

### Environment

To define the environment in which the particles live, a singleton is used. All external forces acting on the particles
can be defined here.

```cpp
// Environment class - Singleton
// the environment class defines the environment for the particles, such as, for example, gravity and wind
class Environment
{
private:
	// environment settings
	mathematics::Vector2F gravity;				// force due to gravity
	mathematics::Vector2F wind;					// force due to wind

protected:
	// protected constructor -> singleton
	Environment();

	public:

	// create a single instance
	static Environment& getInstance()
	{
		static Environment instance;
		return instance;
	};

	// delete copy and assignment operators
	Environment(Environment const&) = delete;
	Environment& operator = (Environment const&) = delete;

	// getters
	mathematics::Vector2F getGravity() const { return gravity; };
	mathematics::Vector2F getWind() const { return wind; };

	// setters
	void setGravity(mathematics::Vector2F& grav) { gravity = grav; };
	void setWind(mathematics::Vector2F& wi) { wind = wi; };
};
```

## Abstract Particle System

To enjoy the marvellous beauty of hundreds of particles moving together in perfect harmony, an abstract class to handle
all their needs is implemented:

```cpp
// abstract particle system class
// this abstract class defines the actual particle systems
class ParticleSystem
{
private:
	unsigned int maxParticles = 150;				// the maximal number of particles
	float maxLifeSpan = 2500.0f;					// the maximal lifespan of a particle

protected:
	core::DirectXApp& dxApp;						// the DirectXApp
	const graphics::GraphicsComponent2D& gc;		// pointer to the Direct2D object of the DirectXApp
	const mathematics::NumberTheory& nt;			// pointer to the number theory object of the DirectXApp
	std::vector<Particle> particles;				// the array containing the actual particles in the system
	bool regenerate = false;						// true iff the particles shoul regenerate over time (think of a water fountain)
	mathematics::Vector2F position;					// central position of the particle system

	virtual void GenerateParticle(const mathematics::Vector2F& position, mathematics::Vector2F& velocity, const mathematics::Vector2F& acceleration, const float age = 0.0f, const std::wstring& colour = L"Black", const float width = 1.0f) = 0;

	// setters
	void setMaxParticles(unsigned int mp) { maxParticles = mp; };
	void setMaxLifeSpan(float mls) { maxLifeSpan = mls; };

public:
	ParticleSystem(core::DirectXApp& app, const graphics::GraphicsComponent2D& gc) : dxApp(app), gc(gc), nt(dxApp.getNumberTheoryComponent()) {};

	virtual bool update(double deltaTime) = 0;		// returns false iff there are no more particles alive in the system
	virtual void draw(double farSeer) const;		// render the particles

	unsigned int nParticles() const;				// returns the number of particles in the system
	float getMaxLifeSpan() const;					// returns the maximal life span possible
	unsigned int getMaxParticles() const;			// returns the possible maximal number of particles
};
```

### maxParticles and maxLifeSpan

The maxParticles and maxLifeSpan variables define how many particles are allowed to be alive at the same time and for
how long a particle may live.

### dxApp, gc, nt

Those variables simply store references to the main DirectX App, to the graphics component of the DirectX class and to
an object of the number theory class. The number theory class is used to generate a few random numbers, to make the
movement of the particles appear more natural.

### std::vector<Particle> particles

This is the array where all the actual particles of the system are kept in as long as they are live.

### bool regenerate = false

This boolean, initially set to false, defines the behaviour of particles once they reach the end of their life cycle. If
set to false, they simply die, but if set to true, they regenerate and come back to life — this might be useful to
simulate water fountains, for example, or other closed systems.

### mathematics::Vector2F position

This vector defines the centre of the particle system, i.e. the location where all particles of the system spawn.

### virtual void GenerateParticle(...) = 0;

This purely abstract function must be overridden by the actual particle system classes. It defines how the particles for
a specific system are generated.

### Setters

The two setters are self-explanatory.

### ParticleSystem(...)

The constructors simply initializes the DirectX components.

### virtual bool update(double deltaTime) = 0;

This purely abstract function must also be overridden by the actual particle system to define how the particles are
updated each frame.

### virtual void draw(double farSeer) const

Drawing the particles is easy, it works as it has always worked:

```cpp
void ParticleSystem::draw(double /*farSeer*/) const
{
	// draw particles
	for (auto particle : particles)
	{
		if(particle.colour == L"Black")
			gc.fillRectangle(particle.position.x - particle.width, particle.position.y - particle.width, particle.position.x + particle.width, particle.position.y + particle.width, particle.intensity);
		else
			gc.fillRectangle(particle.position.x - particle.width, particle.position.y - particle.width, particle.position.x + particle.width, particle.position.y + particle.width, particle.intensity, &gc.getBrush(particle.colour));
	}
}
```

#### Getters

The getters are self-explanatory.

## An Example: Explosions

As an example, we will add a little explosion to the *Kicker*-demo each time the ball hits one of the edges of the
table. Have a look at the header file:

```cpp
namespace physics
{
namespace particles
{
	class ExplosionPS : public ParticleSystem
	{
	private:

	protected:
		virtual void GenerateParticle(const mathematics::Vector2F& position, mathematics::Vector2F& velocity, const mathematics::Vector2F& acceleration, const float age = 0, const std::wstring& colour = L"Black", const float width = 1.0f) override;

	public:
		ExplosionPS(core::DirectXApp& app, const graphics::GraphicsComponent2D& gc, const mathematics::Vector2F& pos, const mathematics::Vector2F& velocity);
		virtual bool update(double deltaTime) override;
	};
}
}
```

### Construction

The entire explosion, i.e. all the particles, are created during construction, as follows:

```cpp
ExplosionPS::ExplosionPS(core::DirectXApp& app, const graphics::GraphicsComponent2D& gc, const mathematics::Vector2F& pos, const mathematics::Vector2F& velocity) : ParticleSystem(app, gc)
{
	this->position = pos;
	float velo = velocity.getLength()*0.5f;

	for (unsigned int i = 0; i < getMaxParticles(); i++)
	{
		mathematics::Vector2F posi(pos.x + nt.generateRandomFloat(-50.0f, 50.0f), pos.y - nt.generateRandomFloat(-50.0f, 50.0f));
		mathematics::Vector2F vel(nt.generateRandomFloat(-velo, velo), nt.generateRandomFloat(-velo, velo));
		mathematics::Vector2F acc(0.0f, 0.0f);
		float age = nt.generateRandomFloat(0.0f, 500.0f);

		if(i % 3 == 0)
			GenerateParticle(posi, vel, acc, age, L"Black",  nt.generateRandomFloat(0.25f, 2.5f));
		else if(i % 3 == 1)
			GenerateParticle(posi, vel, acc, age, L"DarkGoldenrod",  nt.generateRandomFloat(0.25f, 2.5f));
		else
			GenerateParticle(posi, vel, acc, age, L"DarkRed",  nt.generateRandomFloat(0.25f, 2.5f));
	}
}
```

The position of the particle system is set to the position of the ball, plus/minus a random offset, and the initial
velocity of the particles is based on the velocity of the ball at the moment it hits the wall. The age of each particle
is also randomized, to make sure they don't all disappear at once.

The particles are then set to have three different colours: A third of the particles are each black, red, and golden.
Hello Germany!

### virtual void GenerateParticle(...)

This function describes how the particles are generated. In this case, the particles are simply added to the array:

```cpp
void ExplosionPS::GenerateParticle(const mathematics::Vector2F& pos, mathematics::Vector2F& vel, const mathematics::Vector2F& acc, const float age, const std::wstring& col, const float width)
{
	this->particles.push_back(Particle(pos, vel, acc, age, col, width));
}
```

### virtual bool update(double deltaTime) override;

Last but not least, we have the update function. Here each particle is updated using the semi-implicit symplectic
Euler-integration technique of the previous tutorials. In addition, the age and intensity of the particles are updated.
If a particle reaches the end of its lifecycle, it is deleted from the array. The deletion simulated the erase-remove
idiom:

```cpp
bool ExplosionPS::update(double deltaTime)
{
	for (auto it = particles.begin(); it != particles.end();)
	{
		it->update(deltaTime, getMaxLifeSpan());
		if (it->getAge() > getMaxLifeSpan())
			it = particles.erase(it);
		else
			it++;
	}

    if (particles.size() == 0)
		return false;
	else
		return true;
}
```

And that's it already — we now have our own particle system!

---

To use the particle system in the *Kicker*-demo, an array with particle systems of the type *explosion* is added to the
playstate header:

```cpp
...
// particle environment
physics::particles::Environment* environment;
std::vector<physics::particles::ExplosionPS* > crashes;
...
```

Now during the game update, if the ball hits one of the edges of the table, a particle system is created and added to
the array:

```cpp
util::Expected<void> PlayState::update(const double deltaTime)
{
	if (isPaused)
		return { };

	// update the ball and table
	ball->update(deltaTime, table->frictionCoeffK);

	// check wall intersections
	// check boundaries
	int i = -1;
	for (auto wall : table->walls)
	{
		i++;
		if (i != collision)
		{			
			//ball->direction->projectToVector(wall->getNormalVector());
			if (mathematics::Geometry::segmentIntersection2D(*wall, *ball->direction))
			{
				mathematics::reflectionVector(ball->velocity, wall->getNormalVector());
				collision = i;
				crashes.push_back(new physics::particles::ExplosionPS(this->dxApp, this->dxApp.getGraphicsComponent().get2DComponent(), *ball->position, *ball->velocity));
				break;
			}
		}
	}

	for (auto it = crashes.begin(); it != crashes.end();)
	{
		if ((*it)->update(deltaTime))
			it++;
		else
			it = crashes.erase(it);
	}

    ...
}
```

Perhaps it would be a nice idea to also use the event system to queue up particle systems, but for now, this will do.

---

Drawing the particles is a walk in the park:

```cpp
util::Expected<void> PlayState::render(const double farSeer)
{
	// render the table
	table->draw();

	// render the ball
	ball->draw(farSeer, dxApp.getPhysicsDeltaTime());

    ...
	
    for(auto ps : crashes)
		ps->draw(farSeer);

    ...
	
    // return success
	return { };
}
```

---

Enjoy the explosions!

---

<video width="800" height="450" controls>
  <source src="https://filedn.eu/ltgnTcOBnsYpGSo6BiuFrPL/Videos/bell0bytes/Game%20Programming%20Tutorials/DirectX%2011/particleSystem.mp4" type="video/mp4">
Your browser does not support HTML5 videos.
</video> 

---

This should be enough information for you to be able to create and add your own particle systems within minutes!

---

You can download the source
code [here](https://filedn.eu/ltgnTcOBnsYpGSo6BiuFrPL/Game%20Programming/Flatland/Physics/particleSystem.7z).

---

# References

* Tricks of the Windows Programming Gurus, by A. LaMothe
* Wikipedia