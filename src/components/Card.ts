import { Howl } from "howler";
import { Container, Sprite, Graphics } from "pixi.js";
import { Tween, Easing } from "tweedle.js";

const FLIP_DURATION = 350;
const CARD_WIDTH = 140;
const CARD_HEIGHT = 190;
const CORNER_RADIUS = 10;
const HOVER_SCALE_PERCENT = [0.1, 0.15]; // 10-15% on hover
const BOUNCE_HEIGHT = [40, 60]; // pixels to bounce up on flip
const SKEW_AMOUNT = [0.25, 0.35]; // radians to skew on flip

export class Card extends Container
{
	private static suits = ['hearts', 'diamonds', 'clubs', 'spades'];
	private static values = new Array(13).fill(0).map((_, i) => (i + 1).toString()); // 1-13

	private frontSprite: Sprite;
	private backSprite: Sprite;
	private isFlipped = false;
	private isAnimating = false;
	private scaleTween: Tween<{ x: number, y: number }> | null = null;

	private readonly hoverSound: Howl
	private readonly flipSound: Howl;

	constructor()
	{
		super();

		this.hoverSound = new Howl({
			src: ['/assets/audio/hover-card.mp3'],
			volume: 0.3,
			preload: true,
		});

		this.flipSound = new Howl({
			src: ['/assets/audio/whoosh.mp3'],
			volume: 0.2,
			preload: true,
		});

		// Round off the corners of the Card
		const mask = new Graphics()
			.roundRect(
				-CARD_WIDTH / 2,
				-CARD_HEIGHT / 2,
				CARD_WIDTH,
				CARD_HEIGHT,
				CORNER_RADIUS
			)
			.fill({
				color: 0xFFFFFF,
			});

		this.mask = mask;
		this.addChild(mask);

		this.backSprite = Sprite.from('cardback');
		this.frontSprite = Card.createRandomCardFront();

		for (const sprite of [this.backSprite, this.frontSprite])
		{
			sprite.anchor.set(0.5);
			sprite.width = CARD_WIDTH;
			sprite.height = CARD_HEIGHT;
			this.addChild(sprite);
		};

		this.frontSprite.alpha = 0;

		this.eventMode = 'static';
		this.cursor = 'pointer';
	}

	private static createRandomCardFront(): Sprite
	{
		const randomSuit = Card.suits[Math.floor(Math.random() * Card.suits.length)];
		const randomValue = Card.values[Math.floor(Math.random() * Card.values.length)];

		return Sprite.from(`card_${randomSuit}-${randomValue}`);
	}

	public flip(): void
	{
		if (this.isAnimating)
			return;
		this.isAnimating = true;

		// Reset scale from any hover effect
		this.scaleTween?.stop();
		this.scale.set(1);

		this.flipSound.rate(Math.random() * 0.1 + 0.75);
		this.flipSound.play();

		const currentSprite = this.isFlipped ? this.frontSprite : this.backSprite;
		const nextSprite = this.isFlipped ? this.backSprite : this.frontSprite;

		// Combined flip and bounce animation
		const bounceHeight = BOUNCE_HEIGHT[Math.floor(Math.random() * BOUNCE_HEIGHT.length)];
		const skewAmount = SKEW_AMOUNT[Math.floor(Math.random() * SKEW_AMOUNT.length)];

		new Tween(this)
			.to({ y: this.y - bounceHeight }, FLIP_DURATION / 2)
			.easing(Easing.Quadratic.In)
			.start();

		new Tween(this.skew)
			.to({ x: -skewAmount }, FLIP_DURATION / 2)
			.easing(Easing.Quadratic.In)
			.start()
			.onComplete(() =>
			{
				new Tween(this.skew)
					.to({ x: 0 }, FLIP_DURATION / 2)
					.easing(Easing.Quadratic.Out)
					.start();
			});

		// Horizontal flip animation
		new Tween(this.scale)
			.to({ x: 0 }, FLIP_DURATION / 2)
			.easing(Easing.Quadratic.In)
			.start()
			.onComplete(() =>
			{
				currentSprite.alpha = 0;
				nextSprite.alpha = 1;

				// Flip back with bounce return
				new Tween(this.scale)
					.to({ x: 1 }, FLIP_DURATION / 2)
					.easing(Easing.Quadratic.Out)
					.start();

				new Tween(this)
					.to({ y: this.y + bounceHeight }, FLIP_DURATION / 2)
					.easing(Easing.Bounce.Out)
					.start()
					.onComplete(() =>
					{
						this.isAnimating = false;
					});
			});

		this.isFlipped = !this.isFlipped;
	}
}
