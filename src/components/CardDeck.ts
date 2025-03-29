import { Tween, Easing } from "tweedle.js";
import { Deck } from "./Deck";
import { DiscardPile } from "./DiscardPile";

const MOVE_DURATION = 2; // Duration of the card move animation in seconds
const MOVE_INTERVAL = 1; // Interval between card moves in seconds

export class CardDeck extends Deck
{
	private isMoving: boolean = false;
	private moveTimer: number = 0;
	private targetPile: DiscardPile;

	constructor(initialCount: number = 144, targetPile: DiscardPile)
	{
		super("Draw Pile");

		this.cardCount = initialCount;
		this.targetPile = targetPile;
		this.updateCardDisplay();
	}

	public async update(deltaTime: number): Promise<void>
	{
		super.update(deltaTime);

		if (this.isMoving)
			return;

		this.moveTimer += deltaTime;
		if (this.moveTimer >= MOVE_INTERVAL * 1000)
		{
			this.isMoving = true;
			this.moveTimer = 0;

			await this.moveTopCard();

			this.isMoving = false;
		}
	}

	/**
	 * Move the top card from this deck to the target pile.
	 * This method creates a tween animation to move the card smoothly from its current position to the target pile's position.
	 */
	private async moveTopCard(): Promise<void>
	{
		return new Promise((resolve) =>
		{
			if (this.cardCount <= 0 || !this.topCard)
				return;

			const targetPosition = this.targetPile.getGlobalPosition();
			const startPosition = this.topCard.getGlobalPosition();
			const currentCard = this.topCard;

			currentCard.flip();

			new Tween(currentCard)
				.to({
					x: targetPosition.x - startPosition.x,
					y: targetPosition.y - startPosition.y,
					rotation: (Math.random() - 0.5) * Math.PI / 2
				}, MOVE_DURATION * 1000)
				.easing(Easing.Quadratic.Out)
				.start()
				.onComplete(() =>
				{
					this.removeTopCard();
					this.cardCount--;
					this.targetPile.addCard(currentCard);
					this.updateCardDisplay();

					resolve();
				});
		});
	}
}
