import { Color, Container, Graphics, Text } from "pixi.js";

const DEFAULT_OPTIONS = {
	width: 300,
	height: 30,
	backgroundColor: 0x333333,
	progressColor: new Color("orange").toNumber(),
	textColor: 0xFFFFFF,
	text: "Loading... 0%",
} as const;

interface ProgressBarOptions
{
	width?: number;
	height?: number;
	backgroundColor?: number;
	progressColor?: number;
	textColor?: number;
	text?: string;
}

export class ProgressBar extends Container
{
	private options: ProgressBarOptions = {};

	private background: Graphics;
	private bar: Graphics;
	private progressText: Text;

	private readonly barWidth: number;
	private readonly barHeight: number;
	private _progress: number = 0;
	private _targetProgress: number = 0;
	private _lerpFactor: number = 0.1; // Controls smoothing speed (0.1 = 10% per frame)

	public set progress(value: number)
	{
		this._targetProgress = Math.max(0, Math.min(1, value));
	}

	public get progress(): number
	{
		return this._progress;
	}

	public get targetProgress(): number
	{
		return this._targetProgress;
	}

	constructor(options: ProgressBarOptions = {})
	{
		super();

		const opts = Object.assign({}, DEFAULT_OPTIONS, options);
		const { width, height, backgroundColor, textColor, text } = opts;
		this.options = opts;

		this.barWidth = width;
		this.barHeight = height;

		this.background = new Graphics()
			.roundRect(0, 0, width, height, height / 3)
			.fill({ color: backgroundColor });

		this.bar = new Graphics();
		this.updateBar();

		this.progressText = new Text({
			text,
			style: {
				fontFamily: "Arial",
				fontSize: height / 2,
				fill: textColor,
			}
		});

		this.progressText.anchor.set(0.5);
		this.progressText.position.set(width / 2, height / 2);

		this.addChild(this.background);
		this.addChild(this.bar);
		this.addChild(this.progressText);
	}

	private updateBar(): void
	{
		this.bar.clear();
		this.bar
			.roundRect(0, 0, this.barWidth * this._progress, this.barHeight, this.barHeight / 3)
			.fill({ color: this.options.progressColor });
	}

	public update(): void
	{
		if (this._progress === this._targetProgress)
			return;

		// If progress is not at target, smoothly interpolate towards it
		this._progress += (this._targetProgress - this._progress) * this._lerpFactor;

		// Snap to target if very close to avoid tiny movements
		if (Math.abs(this._targetProgress - this._progress) < 0.001)
			this._progress = this._targetProgress;

		this.updateBar();
		this.progressText.text = `Loading... ${Math.round(this._progress * 100)}%`;
	}
}
