import { Container, Sprite } from "pixi.js";

export interface Particle extends Sprite
{
	life: number;
	maxLife: number;
	speed: { x: number; y: number };
	acceleration: { x: number; y: number };
	scaleSpeed: { x: number; y: number };
}

export interface ParticleEffectOptions
{
	maxParticles?: number;
	emitRate?: number;
	gravity?: number;
	startScale?: number;
	endScale?: number;
	lifespan?: [number, number]; // [min, max] in seconds
}

export abstract class ParticleEffect extends Container
{
	protected particles: Particle[] = [];
	protected emitCounter: number = 0;
	protected isEmitting: boolean = true;

	protected options: Required<ParticleEffectOptions> = {
		maxParticles: 10,
		emitRate: 0.1, // Seconds between particle emission
		gravity: 0,
		startScale: 1,
		endScale: 0,
		lifespan: [0.5, 1.5]
	};

	constructor(options: ParticleEffectOptions = {})
	{
		super();
		Object.assign(this.options, options);
	}

	protected abstract createParticle(): Particle;

	public update(deltaTime: number): void
	{
		const dt = deltaTime / 1000;

		if (this.isEmitting)
		{
			this.emitCounter += dt;
			while (this.emitCounter >= this.options.emitRate
				&& this.particles.length < this.options.maxParticles)
			{
				this.emitCounter -= this.options.emitRate;
				this.particles.push(this.createParticle());
			}
		}

		for (let i = this.particles.length - 1; i >= 0; i--)
		{
			const p = this.particles[i];
			p.life -= dt;

			// Update position
			p.speed.y += this.options.gravity * dt;
			p.x += p.speed.x * dt;
			p.y += p.speed.y * dt;

			// Update scale
			p.scale.x += p.scaleSpeed.x * dt;
			p.scale.y += p.scaleSpeed.y * dt;

			// Update alpha based on life
			p.alpha = p.life / p.maxLife;

			// Remove dead particles
			if (p.life <= 0)
			{
				this.removeChild(p);
				this.particles.splice(i, 1);
			}
		}
	}

	public start(): void
	{
		this.isEmitting = true;
	}

	public stop(): void
	{
		this.isEmitting = false;
	}
}
