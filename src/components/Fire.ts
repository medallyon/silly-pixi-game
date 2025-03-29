import { Assets, Sprite, Texture } from "pixi.js";
import { ParticleEffect, Particle, ParticleEffectOptions } from "./ParticleEffect";

export class Fire extends ParticleEffect
{
	private static textureNames = new Array(64).fill(0).map((_, i) => `fire_${String(i).padStart(2, '0')}.png`);
	private static textures: Texture[] = [];

	constructor(options: ParticleEffectOptions = {})
	{
		super({
			maxParticles: 50,
			emitRate: 0.02,
			gravity: -150,
			startScale: 0.5,
			endScale: 0,
			lifespan: [0.5, 1.0],
			...options
		});
	}

	public static gatherAssets(): string[]
	{
		const assetNames = Fire.textureNames.map((name) => [name, `/assets/particles/${name}`] as const);

		for (const [name, path] of assetNames)
			Assets.add({ alias: name, src: path });

		return assetNames.map(([name]) => name);
	}

	protected createParticle(): Particle
	{
		if (Fire.textures.length === 0)
			Fire.textures = Fire.textureNames.map((name) => Assets.get(name));

		const texture = Fire.textures[Math.floor(Math.random() * Fire.textures.length)];
		const p = new Sprite(texture) as Particle;

		p.anchor.set(0.5);

		p.position.set(
			(Math.random() - 0.5) * 20,
			(Math.random() - 0.5) * 10
		);

		// Random velocity
		const speed = 50 + Math.random() * 50;
		const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
		p.speed = {
			x: Math.cos(angle) * speed,
			y: Math.sin(angle) * speed
		};

		p.acceleration = { x: 0, y: 0 };

		// Life and scale
		p.life = p.maxLife = this.options.lifespan[0] +
			Math.random() * (this.options.lifespan[1] - this.options.lifespan[0]);

		const startScale = this.options.startScale * (0.8 + Math.random() * 0.4);
		p.scale.set(startScale);

		const scaleChange = (this.options.endScale - startScale) / p.maxLife;
		p.scaleSpeed = { x: scaleChange, y: scaleChange };

		this.addChild(p);
		return p;
	}
}
