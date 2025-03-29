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
}
