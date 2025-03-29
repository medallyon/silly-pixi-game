import { Container, Text, Rectangle, Assets, Sprite, Texture } from "pixi.js";
import { Button as PixiButton } from "@pixi/ui";
import { Tween, Easing } from "tweedle.js";

export interface ButtonOptions
{
	text?: string;
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

	constructor(options: ButtonOptions)
	{
		super();
		this.loadFontAndCreateText(options);
	}

	private async loadFontAndCreateText({ text, width = 200, height = 50, fontSize, onClick }: ButtonOptions)
	{
		const container = new Container();
		container.pivot.set(width / 2, height / 2);

		const buttonTexture = Assets.get("button");
		const buttonPressedTexture = Assets.get("button-pressed");
		const buttonSprite = new Sprite(buttonTexture);
		buttonSprite.width = width;
		buttonSprite.height = height;
		container.addChild(buttonSprite);

		try
		{
			const fontFace = new FontFace('font-ui', 'url(/assets/fonts/Gluten-VariableFont.ttf)');
			await fontFace.load();
			document.fonts.add(fontFace);
		} catch (error)
		{
			console.error('Failed to load font:', error);
		}

		const textSprite = new Text({
			text,
			style: {
				fontFamily: "font-ui, Arial",
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

		this.setupInteractivity(pixiButton, onClick, buttonSprite, buttonTexture, buttonPressedTexture);
		this.addChild(container);
	}

	private setupInteractivity(
		pixiButton: PixiButton,
		onClick?: () => void,
		buttonSprite?: Sprite,
		normalTexture?: Texture,
		pressedTexture?: Texture
	): void
	{
		pixiButton.onDown.connect(() =>
		{
			this.startAnimation(0.9);
			if (buttonSprite && pressedTexture) buttonSprite.texture = pressedTexture;
		});
		pixiButton.onUp.connect(() =>
		{
			this.startAnimation(this.defaultScale);
			if (buttonSprite && normalTexture) buttonSprite.texture = normalTexture;
		});
		pixiButton.onUpOut.connect(() =>
		{
			this.startAnimation(this.defaultScale);
			if (buttonSprite && normalTexture) buttonSprite.texture = normalTexture;
		});
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