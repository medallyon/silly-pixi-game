import { Container, Graphics, Text } from "pixi.js";
import { Screen } from "./Screen";
import { Fire } from "../components/Fire";
import { Tween, Easing } from "tweedle.js";
import Game from "../Game";

export class PhoenixFlame extends Screen
{
	private fire?: Fire;
	private backButton?: Container;
	private targetPosition = { x: 0, y: 0 };
	private readonly LERP_FACTOR = 0.1;
	private cleanupCallbacks?: {
		move: (event: MouseEvent | TouchEvent) => void;
	};

	constructor()
	{
		super();
		this.createBackButton();
	}

	private createBackButton(): void
	{
		const button = new Container();
		button.eventMode = 'static';
		button.cursor = 'pointer';

		const bg = new Graphics()
			.roundRect(0, 0, 120, 40, 8)
			.fill({ color: 0x666666 });

		const label = new Text({
			text: "Back",
			style: {
				fontFamily: "Arial",
				fontSize: 20,
				fill: 0xFFFFFF,
			}
		});
		label.anchor.set(0.5);
		label.position.set(60, 20);

		button.addChild(bg, label);
		button.position.set(20, 20);

		button.on('pointerover', () =>
		{
			new Tween(button.scale)
				.to({ x: 1.1, y: 1.1 }, 100)
				.easing(Easing.Back.Out)
				.start();
		});

		button.on('pointerout', () =>
		{
			new Tween(button.scale)
				.to({ x: 1, y: 1 }, 100)
				.easing(Easing.Back.Out)
				.start();
		});

		button.on('pointertap', () =>
		{
			this.hide();
			Game.showMenu();
		});

		this.backButton = button;
		this.addChild(button);
	}

	private setupGlobalPointerEvents(): void
	{
		// Handle DOM-level events on the canvas
		const canvas = Game.app.canvas;
		const moveHandler = (event: MouseEvent | TouchEvent) =>
		{
			if (this.fire && this.visible)
			{
				const pos = event instanceof MouseEvent ?
					Game.getCanvasMousePosition(event) :
					Game.getCanvasMousePosition(event.touches[0]);
				this.targetPosition = pos;
			}
		};

		canvas.addEventListener('mousemove', moveHandler);
		canvas.addEventListener('touchmove', moveHandler);
		canvas.addEventListener('touchstart', moveHandler);

		this.cleanupCallbacks = {
			move: moveHandler
		};
	}

	private cleanupGlobalPointerEvents(): void
	{
		const canvas = Game.app.canvas;
		if (this.cleanupCallbacks)
		{
			canvas.removeEventListener('mousemove', this.cleanupCallbacks.move);
			canvas.removeEventListener('touchmove', this.cleanupCallbacks.move);
			canvas.removeEventListener('touchstart', this.cleanupCallbacks.move);
			this.cleanupCallbacks = undefined;
		}
	}

	public show(): void
	{
		this.visible = true;

		this.fire = new Fire();
		this.fire.position.set(
			Game.app.screen.width * 0.5,
			Game.app.screen.height * 0.3
		);
		this.addChild(this.fire);
		this.fire.start();

		this.setupGlobalPointerEvents();
		Game.registerUpdateMethod(this.update.bind(this));
	}

	public hide(): void
	{
		this.visible = false;
		if (this.fire)
		{
			this.fire.stop();
			this.removeChild(this.fire);
			this.fire = undefined;
		}

		this.cleanupGlobalPointerEvents();
	}

	public update(deltaTime: number): void
	{
		if (!this.fire)
			return;

		this.fire.position.x += (this.targetPosition.x - this.fire.position.x) * this.LERP_FACTOR;
		this.fire.position.y += (this.targetPosition.y - this.fire.position.y) * this.LERP_FACTOR;
		this.fire.update(deltaTime);
	}
}