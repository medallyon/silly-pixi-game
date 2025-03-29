import { Container, Text, Assets, Sprite, Graphics, Color } from "pixi.js";
import { DialogueData, DialogueEmoji, DialogueAvatar } from "../types/dialogue";

export class Dialogue extends Container
{
	private static readonly LINE_HEIGHT = 40;
	private static readonly AVATAR_SIZE = 64;
	private static readonly EMOJI_SIZE = 24;
	private static readonly PADDING = 10;
	private static readonly TEXT_WIDTH = 400;
	private static readonly DEFAULT_AVATAR_URL = "https://api.dicebear.com/9.x/avataaars/svg?seed=Oliver";
	private static readonly BUBBLE_RADIUS = 15;
	private static readonly TAIL_SIZE = 20;
	private static readonly VERTICAL_OFFSET = 60;

	private emojis: Map<string, Container> = new Map();
	private avatars: Map<string, Sprite> = new Map();
	private currentLine = 0;
	private dialogueData?: DialogueData;

	constructor()
	{
		super();

		this.eventMode = 'static';
		this.cursor = 'pointer';
		this.onpointerdown = this.showNextLine.bind(this);

		this.pivot.set(Dialogue.TEXT_WIDTH / 2, Dialogue.LINE_HEIGHT / 2);
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
		const width = Dialogue.TEXT_WIDTH + Dialogue.PADDING * 4;
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
				fontSize: 14,
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
					avatarSprite.x = Dialogue.TEXT_WIDTH + Dialogue.PADDING * 4;
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
	}

	private createTextWithEmojis(text: string): Container
	{
		const container = new Container();
		let currentY = 0;
		const maxWidth = Dialogue.TEXT_WIDTH - Dialogue.PADDING * 2;
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
						style: { fontSize: 16, fill: 0xFFFFFF }
					});
					words.push({
						type: 'text',
						content: word + ' ',
						width: tempText.width
					});
				}
			}
		}

		// Second pass: layout words with wrapping
		let line: Array<{ type: 'text' | 'emoji', content: string | Container, width: number }> = [];
		let lineWidth = 0;

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
					container.addChild(emoji);
				} else
				{
					const text = new Text({
						text: item.content as string,
						style: { fontSize: 16, fill: 0xFFFFFF }
					});
					text.x = x;
					text.y = currentY;
					container.addChild(text);
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

		return container;
	}
}
