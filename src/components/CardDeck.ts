import { Tween, Easing } from "tweedle.js";
import { Deck } from "./Deck";
import { DiscardPile } from "./DiscardPile";
import Game from "../Game";
import { Card } from "./Card";

const MOVE_DURATION = 2; // Duration of the card move animation in seconds
const MOVE_INTERVAL = 1; // Interval between card moves in seconds

export class CardDeck extends Deck
{
	private moveTimer: number = 0;
	private targetPile: DiscardPile;

	constructor(initialCount: number = 144, targetPile: DiscardPile)
	{
		super("Draw Pile");

		this.cardCount = initialCount;
		this.targetPile = targetPile;
		this.updateCardDisplay();
	}

	public update(deltaTime: number): void
	{
		this.moveTimer += deltaTime;
		if (this.moveTimer >= MOVE_INTERVAL * 1000)
		{
			this.moveTimer = 0;
			this.moveTopCard();
		}
	}

	/**
	 * Move the top card from this deck to the target pile.
	 * This method creates a tween animation to move the card smoothly from its current position to the target pile's position.
	 */
	private moveTopCard(): void
	{
		if (this.cardCount <= 0 || !this.topCard)
			return;

		this.cardCount--;
		this.countText.text = `${this.title}\n${this.cardCount} cards`;

		const targetPosition = this.targetPile.getGlobalPosition();
		const startPosition = this.topCard.getGlobalPosition();
		const currentCard = this.topCard;

		// Release the card from the deck immediately
		this.removeChild(currentCard);
		Game.app.stage.addChild(currentCard);
		currentCard.position.set(startPosition.x, startPosition.y);

		// Move bottom card to top position with animation
		if (this.bottomCard)
		{
			this.topCard = this.bottomCard;
			this.bottomCard = null;
			this.topCard.zIndex = 1;

			new Tween(this.topCard.position)
				.to({ y: -Deck.CARD_SPACING }, 200)
				.easing(Easing.Quadratic.Out)
				.start();

			new Tween(this.topCard)
				.to({ rotation: (Math.random() - 0.5) * 0.1 }, 200)
				.easing(Easing.Quadratic.Out)
				.start();
		} else
		{
			this.topCard = null;
		}

		// Create new bottom card immediately if we have more cards
		if (this.cardCount > 1)
		{
			const newBottomCard = new Card();
			newBottomCard.position.y = 0;
			newBottomCard.alpha = 0;
			newBottomCard.zIndex = 0;
			this.addChild(newBottomCard);
			this.bottomCard = newBottomCard;

			new Tween(newBottomCard)
				.to({ alpha: 1 }, 200)
				.easing(Easing.Quadratic.Out)
				.start();
		}

		// Animate the released card
		currentCard.flip();
		new Tween(currentCard)
			.to({
				x: targetPosition.x,
				y: targetPosition.y,
				rotation: (Math.random() - 0.5) * Math.PI / 2
			}, MOVE_DURATION * 1000)
			.easing(Easing.Quadratic.Out)
			.start()
			.onComplete(() =>
			{
				Game.app.stage.removeChild(currentCard);
				this.targetPile.addCard(currentCard);
			});
	}
}
