import { Application, Container, Assets } from "pixi.js";

import { Card } from "./components/Card";

const REAL_PROGRESS_PERCENT = 0.5; // 50% of the progress bar is real loading
const MIN_LOADING_TIME = 1; // Minimum loading time in seconds

let loadingProgress = 0;

interface ComponentConstructor
{
	new(...args: unknown[]): Container;
	gatherAssets?(): string[];
	update?(deltaTime?: number): void;
}

export default abstract class Game
{
	public static app: Application;

	public static async initialize()
	{
		const app = new Application();
		this.app = app;

		await app.init({ background: "#222", resizeTo: window, roundPixels: true });
		document.getElementById("pixi-container")!.appendChild(app.canvas);


		await Game.loadAssets();
	}

	/**
	 * Load assets for the game and show a progress bar during loading.
	 */
	private static async loadAssets(): Promise<void>
	{
		const startTime = Date.now();

		const assetPromises: Promise<Record<string, unknown>>[] = [];
		const componentsToLoad = components as ComponentConstructor[];

		for (const component of componentsToLoad)
		{
			if (typeof component.gatherAssets === "function")
			{
				const assetNames = component.gatherAssets();
				const loadingPromise = Assets.load(assetNames, (progress: number) =>
				{
					loadingProgress += (progress - (loadingProgress / assetPromises.length)) / assetPromises.length;
				});

				assetPromises.push(loadingPromise);
			}
		}

		await Promise.all(assetPromises);

		const elapsedTime = Date.now() - startTime;
		const remainingTime = Math.max(0, MIN_LOADING_TIME * 1000 - elapsedTime);
	}
}
