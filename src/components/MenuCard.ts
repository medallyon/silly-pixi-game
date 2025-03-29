import { Text, Graphics } from "pixi.js";
import { Card, CARD_WIDTH, CARD_HEIGHT, CORNER_RADIUS } from "./Card";
import { Tween, Easing } from "tweedle.js";
import { Howl } from "howler";

export class MenuCard extends Card
{
	private hoverSound: Howl;
	private text: Text;
	private _restRotation: number = 0;
	private readonly hoverOffset = 40;
	private isHovering = false;
	private static readonly TEXT_WIDTH = 120;

	constructor(text: string, onClick: () => void)
	{
		super();

		// Remove the card back and front sprites
		this.removeChild(this.backSprite);
		this.removeChild(this.frontSprite);

		// Create a gradient background with subtle shadow
		const background = new Graphics();

		// Add a subtle shadow
		background
			.roundRect(-CARD_WIDTH / 2 + 2, -CARD_HEIGHT / 2 + 2, CARD_WIDTH, CARD_HEIGHT, CORNER_RADIUS)
			.fill({
				color: 0xffffff
			});

		// Create base white card with border
		background
			.setStrokeStyle({
				width: 2,
				color: 0x000000,
				alpha: 0.5
			})
			.roundRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, CORNER_RADIUS)
			.fill({
				color: 0xffffff
			});

		background
			.roundRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, CORNER_RADIUS)
			.fill({
				color: 0xFFFFFF,
				alpha: 0.5
			});

		this.addChild(background);

		this.hoverSound = new Howl({
			src: ['/assets/audio/hover-card.mp3'],
			volume: 0.2
		});

		// Create and position the text with word wrap
		this.text = new Text({
			text: text,
			style: {
				fontFamily: "RubikBubbles, Arial",
				fontSize: 24,
				fill: 0x000000,
				align: "center",
				wordWrap: true,
				wordWrapWidth: MenuCard.TEXT_WIDTH
			}
		});
		this.text.anchor.set(0.5);
		this.text.position.set(0, 0);
		// Keep text upright regardless of card rotation
		this.text.rotation = -this.rotation;
		this.addChild(this.text);

		// Set up interactivity
		this.cursor = 'pointer';
		this.eventMode = 'static';
		this.on('pointerover', this.onHover.bind(this));
		this.on('pointerout', this.onHoverEnd.bind(this));
		this.on('pointertap', onClick);
	}

	override set rotation(value: number)
	{
		super.rotation = value;
		this._restRotation = value;
		// Keep text upright
		if (this.text)
		{
			this.text.rotation = -value;
		}
	}

	private onHover(): void
	{
		if (this.isHovering) return;
		this.isHovering = true;

		this.hoverSound.play();

		// Move card outward perpendicular to its angle
		const perpAngle = this._restRotation - Math.PI / 2; // 90 degrees offset for perpendicular movement
		const targetX = Math.cos(perpAngle) * this.hoverOffset;
		const targetY = Math.sin(perpAngle) * this.hoverOffset;

		new Tween(this.position)
			.to({
				x: this.position.x + targetX,
				y: this.position.y + targetY
			}, 300)
			.easing(Easing.Back.Out)
			.start();

		// Scale up but maintain upward rotation
		new Tween(this)
			.to({
				scale: { x: 1.1, y: 1.1 },
				rotation: this._restRotation // Keep original rotation
			}, 300)
			.easing(Easing.Back.Out)
			.start();
	}

	private onHoverEnd(): void
	{
		if (!this.isHovering) return;
		this.isHovering = false;

		// Move back along perpendicular angle
		const perpAngle = this._restRotation - Math.PI / 2;
		const targetX = Math.cos(perpAngle) * this.hoverOffset;
		const targetY = Math.sin(perpAngle) * this.hoverOffset;

		new Tween(this.position)
			.to({
				x: this.position.x - targetX,
				y: this.position.y - targetY
			}, 300)
			.easing(Easing.Back.Out)
			.start();

		// Return to original scale while maintaining rotation
		new Tween(this)
			.to({
				scale: { x: 1, y: 1 },
				rotation: this._restRotation
			}, 300)
			.easing(Easing.Back.Out)
			.start();
	}
}