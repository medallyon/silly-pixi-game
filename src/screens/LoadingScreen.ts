import { Container, Assets } from "pixi.js";
import { Screen } from "./Screen";
import Game from "../Game";
import { ProgressBar } from "../components/ProgressBar";

interface ComponentConstructor
{
	new(...args: any[]): Container;
	gatherAssets?(): string[];
	update?(deltaTime?: number): void;
}

export class LoadingScreen extends Screen
{
	private progressBar: ProgressBar;
	private loadingProgress = 0;
	private readonly REAL_PROGRESS_PERCENT = 0.5; // 50% of the progress bar is real loading
	private readonly MIN_LOADING_TIME = 1; // Minimum loading time in seconds
	private componentsToLoad: ComponentConstructor[] = [];
	private onLoadComplete?: () => void;

	constructor(components: ComponentConstructor[], onLoadComplete: () => void)
	{
		super();
		this.componentsToLoad = components;
		this.onLoadComplete = onLoadComplete;

		// Create progress bar
		this.progressBar = new ProgressBar({
			width: 400,
			height: 40,
			text: "Loading..."
		});
		this.progressBar.position.set(
			(Game.app.screen.width - 400) / 2,
			(Game.app.screen.height - 40) / 2
		);
		this.addChild(this.progressBar);
	}

	public show(): void
	{
		this.visible = true;
		Game.registerUpdateMethod(this.update.bind(this));
		this.loadAssets();
	}

	public hide(): void
	{
		this.visible = false;
		Game.app.stage.removeChild(this);
	}

	private async loadAssets(): Promise<void>
	{
		const startTime = Date.now();
		const assetPromises: Promise<Record<string, unknown>>[] = [];

		for (const component of this.componentsToLoad)
		{
			if (typeof component.gatherAssets === "function")
			{
				const assetNames = component.gatherAssets();
				const loadingPromise = Assets.load(assetNames, (progress: number) =>
				{
					this.loadingProgress += (progress - (this.loadingProgress / assetPromises.length)) / assetPromises.length;
					// Scale real loading to only use 50% of the progress bar
					this.progressBar.progress = this.loadingProgress * this.REAL_PROGRESS_PERCENT;
				});

				assetPromises.push(loadingPromise);
			}
		}

		await Promise.all(assetPromises);

		const elapsedTime = Date.now() - startTime;
		const remainingTime = Math.max(0, this.MIN_LOADING_TIME * 1000 - elapsedTime);

		if (remainingTime > 0)
		{
			const currentProgress = this.progressBar.targetProgress;
			await this.simulateRemainingProgress(currentProgress, remainingTime);
		}

		this.hide();
		this.onLoadComplete?.();
	}

	private async simulateRemainingProgress(startValue: number, remainingTime: number): Promise<void>
	{
		const totalSteps = 20;
		const stepTime = remainingTime / totalSteps;
		const endValue = 1.0; // 100%
		const progressIncrement = (endValue - startValue) / totalSteps;

		for (let step = 1; step <= totalSteps; step++)
		{
			await new Promise(resolve => setTimeout(resolve, stepTime));
			this.progressBar.progress = startValue + (progressIncrement * step);
		}
	}

	public update(): void
	{
		this.progressBar.update();
	}
}