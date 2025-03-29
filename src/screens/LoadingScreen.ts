import { Container } from "pixi.js";
import { Screen } from "./Screen";
import Game from "../Game";
import { ProgressBar } from "../components/ProgressBar";
import { AssetLoader } from "../AssetLoader";

interface ComponentConstructor
{
	new(...args: unknown[]): Container;
	update?(deltaTime: number): void;
}

export class LoadingScreen extends Screen
{
	private progressBar: ProgressBar;
	private onLoadComplete?: () => void;

	constructor(_components: ComponentConstructor[], onLoadComplete: () => void)
	{
		super();
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
		try
		{
			await AssetLoader.loadAll((progress) =>
			{
				this.progressBar.progress = progress;
			});

			this.hide();
			this.onLoadComplete?.();
		} catch (error)
		{
			console.error('Failed to load assets:', error);
		}
	}

	public update(): void
	{
		this.progressBar.update();
	}
}