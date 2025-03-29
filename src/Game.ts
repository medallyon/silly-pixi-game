import { Application, Container, Assets } from "pixi.js";

import { Card } from "./components/Card";

const REAL_PROGRESS_PERCENT = 0.5; // 50% of the progress bar is real loading
const MIN_LOADING_TIME = 1; // Minimum loading time in seconds

const components = [Card];
const updateMethods: ((deltaTime: number) => void)[] = [];

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

	/**
	 * Register a method to be called on every frame update.
	 * @param method The method to register.
	 */
	public static registerUpdateMethod(method: (deltaTime: number) => void)
	{
		updateMethods.push(method);
	}

	/**
	 * Instantiate a component and register relevant runtime methods.
	 * Then, add it to the stage of the application at the given position.
	 * @param component The component class to instantiate. 
	 * @param position The position to place the component at.
	 * @param args Additional arguments to pass to the component constructor.
	 * @returns The instantiated component.
	 */
	public static instantiateComponent<T extends Container, Args extends unknown[]>(
		component: new (...args: Args) => T,
		position?: { x: number, y: number },
		args: Args = [] as unknown[] as Args
	): T
	{
		const instance = new component(...args);
		if ('update' in instance && typeof instance.update === "function")
			this.registerUpdateMethod(instance.update.bind(instance));

		this.app.stage.addChild(instance);

		if (position)
			instance.position.set(position.x, position.y);

		return instance;
	}

	public static async initialize()
	{
		const app = new Application();
		this.app = app;

		await app.init({ background: "#222", resizeTo: window, roundPixels: true });
		document.getElementById("pixi-container")!.appendChild(app.canvas);

		app.ticker.add((ticker) =>
		{
			for (const updateMethod of updateMethods)
				updateMethod(ticker.deltaTime);
		});

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
