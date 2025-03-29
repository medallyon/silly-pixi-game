import { Application, Container, ExtensionType, Texture, extensions } from "pixi.js";
import { Group } from "tweedle.js";
import { Menu } from "./screens/Menu";
import { FpsCounter } from "./components/FpsCounter";
import { Card } from "./components/Card";
import { CardDeck } from "./components/CardDeck";
import { DiscardPile } from "./components/DiscardPile";
import { Dialogue } from "./components/Dialogue";
import { Fire } from "./components/Fire";
import { LoadingScreen } from "./screens/LoadingScreen";

const TARGET_WIDTH = 1920;
const TARGET_HEIGHT = 1080;
const ASPECT_RATIO = TARGET_WIDTH / TARGET_HEIGHT;

// We use a more generic type that allows any constructor that returns a Container
type ComponentConstructor = {
	new(...args: unknown[]): Container
} & { update?(deltaTime: number): void };

// @ts-expect-error Classes that extend PIXI.Container are not recognized as valid constructors by TypeScript
const components: ComponentConstructor[] = [FpsCounter, Card, CardDeck, DiscardPile, LoadingScreen, Dialogue, Fire];
const updateMethods: ((deltaTime: number) => void)[] = [];

function setupAssetParser()
{
	const imageDelivery = {
		extension: ExtensionType.LoadParser,
		test: (url: string) => url.startsWith('https://api.dicebear.com/'),
		async load(src: string)
		{
			return new Promise((resolve, reject) =>
			{
				const img = new Image();
				img.crossOrigin = 'anonymous';
				img.onload = () => resolve(Texture.from(img));
				img.onerror = reject;
				img.src = src;
			});
		},
	};

	extensions.add(imageDelivery);
}

export default abstract class Game
{
	public static app: Application;
	private static orientationOverlay: HTMLDivElement;
	private static menu?: Menu;
	private static canvas: HTMLCanvasElement;

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

	private static onResize()
	{
		const { app } = this;
		let w, h;

		if (window.innerWidth / window.innerHeight >= ASPECT_RATIO)
		{
			w = window.innerHeight * ASPECT_RATIO;
			h = window.innerHeight;
		} else
		{
			w = window.innerWidth;
			h = window.innerWidth / ASPECT_RATIO;
		}

		app.canvas.style!.width = `${w}px`;
		app.canvas.style!.height = `${h}px`;
	}

	private static createOrientationOverlay()
	{
		const overlay = document.getElementById("orientation-overlay") as HTMLDivElement;
		this.orientationOverlay = overlay;

		// Add orientation change listener
		window.addEventListener('orientationchange', () =>
		{
			setTimeout(() => this.handleOrientationChange(), 100);
		});
	}

	private static handleOrientationChange()
	{
		const isPortrait = window.matchMedia("(orientation: portrait)").matches;
		if (isPortrait)
		{
			this.app.stop();
			this.orientationOverlay.style.display = 'flex';
		} else
		{
			this.app.start();
			this.orientationOverlay.style.display = 'none';
			this.canvas.requestFullscreen();
		}
	}

	public static async initialize()
	{
		const app = new Application();
		this.app = app;

		await app.init({
			background: "#222",
			width: TARGET_WIDTH,
			height: TARGET_HEIGHT,
			roundPixels: true
		});

		this.canvas = app.canvas;

		this.createOrientationOverlay();
		await this.requestLandscapeOrientation();
		this.handleOrientationChange();

		document.getElementById("pixi-container")!.appendChild(app.canvas);
		window.addEventListener("resize", this.onResize.bind(this));
		this.onResize();

		setupAssetParser();

		app.ticker.add((ticker) =>
		{
			for (const updateMethod of updateMethods)
				updateMethod(ticker.deltaMS);

			Group.shared.update(ticker.elapsedMS);
		});

		const loadingScreen = new LoadingScreen(components, () =>
		{
			Game.instantiateComponent(FpsCounter);

			this.menu = new Menu();
			app.stage.addChild(this.menu);
			this.menu.show();
		});

		app.stage.addChild(loadingScreen);
		loadingScreen.show();
	}

	public static getCanvasMousePosition(event: MouseEvent | Touch): { x: number, y: number }
	{
		const rect = this.canvas.getBoundingClientRect();
		const scaleX = this.app.screen.width / rect.width;
		const scaleY = this.app.screen.height / rect.height;

		return {
			x: (event.clientX - rect.left) * scaleX,
			y: (event.clientY - rect.top) * scaleY
		};
	}

	private static async requestLandscapeOrientation()
	{
		if ('screen' in window && 'orientation' in screen)
		{
			try
			{
				// Handle potential missing lock method
				const orientation = screen.orientation as ScreenOrientation & { lock?: (type: string) => Promise<void> };
				if (orientation.lock)
				{
					await orientation.lock('landscape');
				}
			} catch (err)
			{
				console.warn('Failed to lock orientation:', err);
			}
		}
	}

	public static showMenu(): void
	{
		if (this.menu)
			this.menu.show();
	}
}
