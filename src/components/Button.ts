import { Container, Text, Rectangle } from "pixi.js";
import { Button as PixiButton } from "@pixi/ui";
import { Tween, Easing } from "tweedle.js";

export interface ButtonOptions
{
	text: string;
	width?: number;
	height?: number;
	fontSize?: number;
	onClick?: () => void;
}

export class Button extends Container
{
	private readonly defaultScale = 1;
	private readonly hoverScale = 1.1;
	private scaleTween?: Tween<{ x: number; y: number }>;

	constructor({
		text,
		width = 120,
		height = 40,
		fontSize = 20,
		onClick
	}: ButtonOptions)
	{
		super();

		const container = new Container();
		container.pivot.set(width / 2, height / 2);

		const textSprite = new Text({
			text,
			style: {
				fontFamily: "Arial",
				fontSize,
				fill: 0xFFFFFF,
				align: "center"
			},
		});

		textSprite.anchor.set(0.5);
		textSprite.position.set(width / 2, height / 2);
		container.addChild(textSprite);

		// Set up hit area for the button
		container.eventMode = 'static';
		container.cursor = 'pointer';
		container.hitArea = new Rectangle(0, 0, width, height);

		const pixiButton = new PixiButton(container);

		this.setupInteractivity(pixiButton, onClick);
		this.addChild(container);
	}

	private setupInteractivity(pixiButton: PixiButton, onClick?: () => void): void
	{
		pixiButton.onDown.connect(() => this.startAnimation(0.9));
		pixiButton.onUp.connect(() => this.startAnimation(this.defaultScale));
		pixiButton.onUpOut.connect(() => this.startAnimation(this.defaultScale));
		pixiButton.onHover.connect(() => this.startAnimation(this.hoverScale));
		pixiButton.onOut.connect(() => this.startAnimation(this.defaultScale));

		if (onClick)
		{
			pixiButton.onPress.connect(onClick);
		}
	}

	private startAnimation(targetScale: number): void
	{
		if (this.scaleTween)
			this.scaleTween.stop();

		this.scaleTween = new Tween(this.scale)
			.to({ x: targetScale, y: targetScale }, 100)
			.easing(Easing.Back.Out)
			.start();
	}
}