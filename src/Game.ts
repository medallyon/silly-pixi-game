import { Application, Container, Assets } from "pixi.js";
import { Group } from "tweedle.js";

import { FpsCounter } from "./components/FpsCounter";
import { Card } from "./components/Card";
import { CardDeck } from "./components/CardDeck";
import { ProgressBar } from "./components/ProgressBar";
import { DiscardPile } from "./components/DiscardPile";

const REAL_PROGRESS_PERCENT = 0.5; // 50% of the progress bar is real loading
const MIN_LOADING_TIME = 1; // Minimum loading time in seconds

const components = [FpsCounter, Card, CardDeck, DiscardPile, ProgressBar];
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
				updateMethod(ticker.deltaMS);

			Group.shared.update(ticker.elapsedMS);
		});

		await Game.loadAssets();

		Game.instantiateComponent(FpsCounter);

		const discardPile = Game.instantiateComponent(DiscardPile, {
			x: app.screen.width * 0.7,
			y: app.screen.height / 2,
		});

		Game.instantiateComponent(CardDeck, {
			x: app.screen.width * 0.3,
			y: app.screen.height / 2,
		}, [undefined, discardPile]);
	}

	/**
	 * Load assets for the game and show a progress bar during loading.
	 */
	private static async loadAssets(): Promise<void>
	{
		const startTime = Date.now();

		const progressBar = Game.instantiateComponent(ProgressBar, {
			x: (Game.app.screen.width - 400) / 2,
			y: (Game.app.screen.height - 40) / 2,
		}, [{ width: 400, height: 40, text: "Loading..." }]);

		// Setup a ticker for smooth progress updates during loading
		const loadingTicker = () =>
		{
			progressBar.update();
		};

		Game.registerUpdateMethod(loadingTicker);

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

					// Scale real loading to only use 50% of the progress bar
					// This reserves 50% for our artificial loading simulation
					progressBar.progress = loadingProgress * REAL_PROGRESS_PERCENT;
				});

				assetPromises.push(loadingPromise);
			}
		}

		await Promise.all(assetPromises);

		const elapsedTime = Date.now() - startTime;
		const remainingTime = Math.max(0, MIN_LOADING_TIME * 1000 - elapsedTime);

		if (remainingTime > 0)
		{
			const currentProgress = progressBar.targetProgress;

			// Create a function to simulate loading progress over time
			const simulateRemainingProgress = async () =>
			{
				const totalSteps = 20;
				const stepTime = remainingTime / totalSteps;
				const startValue = currentProgress;
				const endValue = 1.0; // 100%
				const progressIncrement = (endValue - startValue) / totalSteps;

				for (let step = 1; step <= totalSteps; step++)
				{
					await new Promise(resolve => setTimeout(resolve, stepTime));
					progressBar.progress = startValue + (progressIncrement * step);
				}
			};

			await simulateRemainingProgress();
		}

		Game.app.ticker.remove(loadingTicker);
		Game.app.stage.removeChild(progressBar);
	}
}
