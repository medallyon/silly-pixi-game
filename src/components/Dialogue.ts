import { Container, Text, Assets, Sprite, Graphics, Color } from "pixi.js";
import { Howl } from "howler";
import { DialogueData, DialogueEmoji, DialogueAvatar } from "../types/dialogue";

export class Dialogue extends Container
{
	private static readonly WIDTH = 600;
	private static readonly FONT_SIZE = 28;
	private static readonly LINE_HEIGHT = 80;
	private static readonly AVATAR_SIZE = 128;
	private static readonly EMOJI_SIZE = 40;
	private static readonly PADDING = 10;
	private static readonly DEFAULT_AVATAR_URL = "https://api.dicebear.com/9.x/avataaars/svg?seed=Oliver";
	private static readonly BUBBLE_RADIUS = 15;
	private static readonly TAIL_SIZE = 20;
	private static readonly VERTICAL_OFFSET = 120;
	private static readonly CHARS_PER_SECOND = 50;
	private static readonly GIBBERISH_PITCH_RANGE = [0.5, 1.2];
	private static readonly GIBBERISH_COUNT = 3;

	private emojis: Map<string, Container> = new Map();
	private avatars: Map<string, Sprite> = new Map();
	private currentLine = 0;
	private dialogueData?: DialogueData;

	// Animation variables
	private isAnimating = false;
	private elapsedTime = 0;
	private visibleCharacters = 0;
	private currentTextItems: Array<{
		element: Text | Container,
		originalText?: string,
		length: number
	}> = [];
	private static gibberishPool: Howl[] = [];
	private currentGibberish?: Howl;
	private lastPlayedIndex?: number;

	constructor()
	{
		super();

		// Initialize gibberish sound pool
		if (Dialogue.gibberishPool.length === 0)
		{
			for (let i = 1; i <= Dialogue.GIBBERISH_COUNT; i++)
			{
				Dialogue.gibberishPool.push(new Howl({
					src: [`/assets/audio/talking/gibberish-0${i}.mp3`],
					volume: 0.5,
					preload: true
				}));
			}
		}

		this.eventMode = 'static';
		this.cursor = 'pointer';
		this.onpointerdown = this.handleTap.bind(this);

		this.pivot.set(Dialogue.WIDTH / 2, Dialogue.LINE_HEIGHT / 2);
	}

	/**
	 * Load the dialogue data and preload assets.
	 * @param data The dialogue data to load.
	 */
	public async loadDialogue(data: DialogueData): Promise<void>
	{
		this.dialogueData = data;
		await this.preloadAssets();
		this.showNextLine();
	}

	private async preloadAssets(): Promise<void>
	{
		if (!this.dialogueData)
			return;

		for (const emoji of this.dialogueData.emojies)
			await this.loadEmoji(emoji);

		this.dialogueData.avatars.push({
			name: 'default',
			url: Dialogue.DEFAULT_AVATAR_URL,
			position: 'left'
		});

		for (const avatar of this.dialogueData.avatars)
			await this.loadAvatar(avatar);
	}

	// Remove port numbers from URLs (e.g., :81 or :8080)
	private sanitizeUrl(url: string): string
	{
		return url.replace(/:\d+(?=\/)/, '');
	}

	private async loadEmoji(emoji: DialogueEmoji): Promise<void>
	{
		const sanitizedUrl = this.sanitizeUrl(emoji.url);

		const texture = await Assets.load({
			src: sanitizedUrl,
			format: 'texture'
		});

		const container = new Container();

		const sprite = Sprite.from(texture);
		sprite.width = sprite.height = Dialogue.EMOJI_SIZE;

		// rounding the corners of the emoji
		const mask = new Graphics({ roundPixels: true })
			.roundRect(0, 0, Dialogue.EMOJI_SIZE, Dialogue.EMOJI_SIZE, 5)
			.fill({ color: 0xffffff });

		container.addChild(sprite);
		container.addChild(mask);
		container.mask = mask;

		this.emojis.set(emoji.name, container);
	}

	private async loadAvatar(avatar: DialogueAvatar): Promise<void>
	{
		const sanitizedUrl = this.sanitizeUrl(avatar.url);

		const texture = await Assets.load({
			src: sanitizedUrl,
			format: 'texture'
		});

		const sprite = Sprite.from(texture);
		sprite.width = sprite.height = Dialogue.AVATAR_SIZE;

		this.avatars.set(avatar.name, sprite);
		this.addChild(sprite);
	}

	private createBubbleBackground(isLeft: boolean): Graphics
	{
		const graphics = new Graphics();
		const width = Dialogue.WIDTH + Dialogue.PADDING * 4;
		const height = Dialogue.LINE_HEIGHT + Dialogue.PADDING * 2;
		const radius = Dialogue.BUBBLE_RADIUS;
		const tailSize = Dialogue.TAIL_SIZE;

		// Draw bubble with tail
		graphics
			.moveTo(radius, 0)
			.lineTo(width - radius, 0)
			.arcTo(width, 0, width, radius, radius)
			.lineTo(width, height - radius)
			.arcTo(width, height, width - radius, height, radius);

		if (!isLeft)
		{
			graphics
				.lineTo(width - tailSize * 2, height)
				.lineTo(width - tailSize, height + tailSize)
				.lineTo(width - tailSize * 3, height);
		}

		graphics
			.lineTo(radius, height)
			.arcTo(0, height, 0, height - radius, radius)
			.lineTo(0, radius)
			.arcTo(0, 0, radius, 0, radius);

		if (isLeft)
		{
			graphics
				.lineTo(tailSize * 2, 0)
				.lineTo(tailSize, -tailSize)
				.lineTo(tailSize * 3, 0);
		}

		graphics.closePath();
		graphics.fill({
			color: new Color("orange")
		});

		return graphics;
	}

	private createNameText(name: string): Text
	{
		return new Text({
			text: name,
			style: {
				fontSize: Dialogue.FONT_SIZE * 0.8,
				fill: 0xFFFFFF,
				align: 'center',
				fontWeight: 'bold'
			}
		});
	}

	private showNextLine(): void
	{
		if (!this.dialogueData || this.currentLine >= this.dialogueData.dialogue.length)
			return;

		const line = this.dialogueData.dialogue[this.currentLine];
		const avatar = this.dialogueData.avatars.find(a => a.name === line.name || a.name === 'default');

		this.removeChildren();

		const isLeft = avatar?.position === 'left';
		const bubble = this.createBubbleBackground(isLeft);
		this.addChild(bubble);

		const textContainer = this.createTextWithEmojis(line.text);

		if (avatar)
		{
			const avatarSprite = this.avatars.get(avatar.name);
			if (avatarSprite)
			{
				const nameText = this.createNameText(line.name);
				nameText.anchor.set(0.5);
				const verticalOffset = isLeft ? Dialogue.VERTICAL_OFFSET : 0;

				if (isLeft)
				{
					avatarSprite.x = Dialogue.PADDING;
					textContainer.x = Dialogue.AVATAR_SIZE + Dialogue.PADDING * 3;
					bubble.x = textContainer.x - Dialogue.PADDING;
					nameText.x = avatarSprite.x + Dialogue.AVATAR_SIZE / 2;
					bubble.y = verticalOffset;
					textContainer.y = Dialogue.PADDING + verticalOffset;
				} else
				{
					avatarSprite.x = Dialogue.WIDTH + Dialogue.PADDING * 4;
					textContainer.x = Dialogue.PADDING * 2;
					bubble.x = 0;
					nameText.x = avatarSprite.x + Dialogue.AVATAR_SIZE / 2;
					textContainer.y = Dialogue.PADDING;
				}

				avatarSprite.y = 0;
				nameText.y = avatarSprite.height + 12;
				this.addChild(avatarSprite, nameText);
			}
		} else
			textContainer.y = Dialogue.PADDING;

		this.addChild(textContainer);
		this.currentLine++;
		this.playRandomGibberish();
	}

	private createTextWithEmojis(text: string): Container
	{
		const container = new Container();
		const maxWidth = Dialogue.WIDTH - Dialogue.PADDING * 2;
		const TEXT_BASELINE_OFFSET = 4;

		// Split text by emoji placeholders {emoji}
		const parts = text.split(/(\{[^}]+\})/);
		const words: Array<{ type: 'text' | 'emoji', content: string | Container, width: number }> = [];

		// First pass: gather all words and their widths
		for (const part of parts)
		{
			if (part.startsWith('{') && part.endsWith('}'))
			{
				const emojiName = part.slice(1, -1);
				const emojiContainer = this.emojis.get(emojiName);
				if (emojiContainer)
				{
					words.push({
						type: 'emoji',
						content: emojiContainer,
						width: Dialogue.EMOJI_SIZE + 2
					});
				}
			} else if (part.trim())
			{
				// Split text into words and calculate their widths
				const textWords = part.split(/\s+/);
				for (const word of textWords)
				{
					const tempText = new Text({
						text: word + ' ',
						style: { fontSize: Dialogue.FONT_SIZE, fill: 0xFFFFFF }
					});
					words.push({
						type: 'text',
						content: word + ' ',
						width: tempText.width
					});
				}
			}
		}


		this.currentTextItems = [];

		// Second pass: layout words with wrapping
		let line: Array<{ type: 'text' | 'emoji', content: string | Container, width: number }> = [];
		let lineWidth = 0;
		let currentY = 0;

		const addLine = () =>
		{
			let x = 0;
			for (const item of line)
			{
				if (item.type === 'emoji')
				{
					const emoji = item.content as Container;
					emoji.x = x;
					emoji.y = currentY - TEXT_BASELINE_OFFSET; // Adjust emoji position up slightly
					emoji.visible = false;
					container.addChild(emoji);
					this.currentTextItems.push({
						element: emoji,
						length: 1
					});
				} else
				{
					const text = new Text({
						text: '',
						style: { fontSize: Dialogue.FONT_SIZE, fill: 0xFFFFFF }
					});
					text.x = x;
					text.y = currentY;
					text.visible = true;
					container.addChild(text);

					this.currentTextItems.push({
						element: text,
						originalText: item.content as string,
						length: (item.content as string).length
					});
				}
				x += item.width;
			}

			currentY += Dialogue.LINE_HEIGHT / 2;
			line = [];
			lineWidth = 0;
		};

		for (const word of words)
		{
			if (lineWidth + word.width > maxWidth && line.length > 0)
				addLine();

			line.push(word);
			lineWidth += word.width;
		}

		if (line.length > 0)
			addLine();

		this.visibleCharacters = 0;
		this.elapsedTime = 0;
		this.isAnimating = true;

		return container;
	}

	private handleTap(): void
	{
		if (this.isAnimating)
		{
			// Skip animation
			this.visibleCharacters = Infinity;
			this.updateTextVisibility();
			this.isAnimating = false;
			this.currentGibberish?.stop();
		} else
			this.showNextLine();
	}

	private updateTextVisibility(): void
	{
		let totalChars = 0;
		let totalAvailableChars = 0;

		// First count total available characters
		for (const item of this.currentTextItems)
			totalAvailableChars += item.length;

		// Then update visibility
		for (const item of this.currentTextItems)
		{
			if (item.element instanceof Text && item.originalText)
			{
				const text = item.element;
				if (totalChars + item.length <= this.visibleCharacters)
				{
					text.visible = true;
					text.text = item.originalText;
					totalChars += item.length;
				} else if (totalChars >= this.visibleCharacters)
				{
					text.visible = false;
				} else
				{
					text.visible = true;
					const visibleLength = this.visibleCharacters - totalChars;
					text.text = item.originalText.slice(0, visibleLength);
					totalChars = this.visibleCharacters;
				}
			} else
			{
				// Handle emojis
				item.element.visible = totalChars < this.visibleCharacters;
				if (item.element.visible)
					totalChars += 1;
			}
		}

		// Only stop animating when we've shown all characters
		if (this.visibleCharacters >= totalAvailableChars)
		{
			this.isAnimating = false;

			// Make sure all text is fully visible
			for (const item of this.currentTextItems)
			{
				item.element.visible = true;
				if (item.element instanceof Text && item.originalText)
					item.element.text = item.originalText;
			}
		}
	}

	private playRandomGibberish(): void
	{
		// Stop any existing gibberish
		this.currentGibberish?.stop();

		// Pick a random gibberish sound that's different from the last one
		let index;
		do
		{
			index = Math.floor(Math.random() * Dialogue.GIBBERISH_COUNT);
		} while (index === this.lastPlayedIndex);

		this.lastPlayedIndex = index;
		this.currentGibberish = Dialogue.gibberishPool[index];

		// Set a random pitch
		const pitch = Dialogue.GIBBERISH_PITCH_RANGE[0] +
			Math.random() * (Dialogue.GIBBERISH_PITCH_RANGE[1] - Dialogue.GIBBERISH_PITCH_RANGE[0]);
		this.currentGibberish.rate(pitch);

		this.currentGibberish.play();
	}

	public update(deltaTime: number): void
	{
		if (!this.isAnimating)
			return;

		// Convert deltaTime from milliseconds to seconds
		this.elapsedTime += deltaTime / 1000;
		const targetChars = Math.floor(this.elapsedTime * Dialogue.CHARS_PER_SECOND);

		this.visibleCharacters = targetChars;
		this.updateTextVisibility();
	}
}
