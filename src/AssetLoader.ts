import { Assets } from "pixi.js";

interface AssetDefinition
{
	alias: string;
	src: string;
}

export class AssetLoader
{
	private static bundleDefinitions = new Map<string, AssetDefinition[]>();
	private static registeredAssets = new Set<string>();

	public static registerBundle(name: string, assets: AssetDefinition[])
	{
		this.bundleDefinitions.set(name, assets);
	}

	public static registerAssets(assets: [string, string][])
	{
		for (const [name, path] of assets)
		{
			Assets.add({ alias: name, src: path });
			this.registeredAssets.add(name);
		}
	}

	public static async loadAll(onProgress?: (progress: number) => void): Promise<void>
	{
		// First register UI kit assets
		this.registerBundle('ui-kit', [
			{ alias: "font-ui", src: "/assets/fonts/Gluten-VariableFont.ttf" },
			{ alias: "button", src: "/assets/cozy-garden-kit/big-bar.png" },
			{ alias: "button-pressed", src: "/assets/cozy-garden-kit/big-bar-pressed.png" },
			{ alias: "button-back", src: "/assets/cozy-garden-kit/button-back.png" },
			{ alias: "button-back-pressed", src: "/assets/cozy-garden-kit/button-back-pressed.png" },
			{ alias: "bg-blue", src: "/assets/cozy-garden-kit/bg-blue.png" },
			{ alias: "bg-green", src: "/assets/cozy-garden-kit/bg-green.png" },
			{ alias: "bg-pink", src: "/assets/cozy-garden-kit/bg-pink.png" },
			{ alias: "bg-yellow", src: "/assets/cozy-garden-kit/bg-yellow.png" },
		]);

		// Register card assets
		const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
		const values = new Array(13).fill(0).map((_, i) => (i + 1).toString());
		this.registerAssets(suits.flatMap(suit =>
			values.map(value => [
				`card_${suit}-${value}`,
				`/assets/card-deck-fronts/sheet_${suit}/sheet_${suit}-${value}.png`
			] as [string, string])
		));
		this.registerAssets([
			["cardback", "/assets/colorful-poker-card-back/red.png"],
			["sfx_card_hover", "/assets/audio/hover-card.mp3"],
			["sfx_whoosh", "/assets/audio/whoosh.mp3"]
		]);

		// Register fire particle assets
		const fireFrames = new Array(64).fill(0)
			.map((_, i) => [
				`fire_${String(i).padStart(2, '0')}.png`,
				`/assets/particles/fire_${String(i).padStart(2, '0')}.png`
			] as [string, string]);
		this.registerAssets(fireFrames);

		// Register dialogue assets
		this.registerAssets([
			["gibberish-01", "/assets/audio/talking/gibberish-01.mp3"],
			["gibberish-02", "/assets/audio/talking/gibberish-02.mp3"],
			["gibberish-03", "/assets/audio/talking/gibberish-03.mp3"]
		]);

		// Load everything
		const bundles = Array.from(this.bundleDefinitions.entries());
		const totalBundles = bundles.length;
		let loadedBundles = 0;

		for (const [name, assets] of bundles)
		{
			Assets.addBundle(name, assets);
			await Assets.loadBundle(name, (bundleProgress) =>
			{
				if (onProgress)
				{
					const totalProgress = (loadedBundles + bundleProgress) / totalBundles;
					onProgress(totalProgress);
				}
			});
			loadedBundles++;
		}

		// Load remaining registered assets
		const remainingAssets = Array.from(this.registeredAssets);
		await Assets.load(remainingAssets, (progress) =>
		{
			if (onProgress)
			{
				// Scale remaining progress to the last portion
				const scaledProgress = (loadedBundles + progress) / (totalBundles + 1);
				onProgress(scaledProgress);
			}
		});
	}
}