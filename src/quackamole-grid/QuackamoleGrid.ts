export class QuackamoleGrid {
  private readonly container: HTMLElement;
  gridItemClass: string;
  options: QuackamoleGridOptions | undefined;
  defaultOptions: QuackamoleGridOptions = defaultOptions;

  private resizer: HTMLElement | null = null;
  private posStart: { x: number, y: number } = { x: 0, y: 0 };
  private computedStyle: CSSStyleDeclaration | null = null;
  private gridColumnStart = -1;
  private gridColumnEnd = -1;
  private gridRowStart = -1;
  private gridRowEnd = -1;

  constructor(containerId: string, gridItemClass: string, options?: QuackamoleGridOptions) {
    const container = document.getElementById(containerId);
    this.options = options;
    this.gridItemClass = gridItemClass;
    if (!container) throw new Error(`Container with id ${containerId} not found`);
    this.container = container;

    this.container.style.cssText = `
      display: grid;
      padding: ${this.options?.gridGap || this.defaultOptions.gridGap}px;
      grid-template-columns: repeat(${this.options?.columns || this.defaultOptions.columns}, 1fr);
      grid-template-rows: repeat(${this.options?.rows || this.defaultOptions.rows}, 1fr);
      grid-gap: ${this.options?.gridGap || this.defaultOptions.gridGap}px;
    `;

    setTimeout(() => {

      const gridItems = document.querySelectorAll<HTMLElement>('.' + this.gridItemClass);
      console.log('---------griditems', gridItems);
      gridItems.forEach(el => this.insertResizeHandles(el));
      const resizers = document.querySelectorAll<HTMLElement>('.resizer');
      resizers.forEach(el => el.addEventListener("mousedown", this.mousedownHandler.bind(this))); // TODO single listener
      document.addEventListener("mousemove", this.mousemoveHandler.bind(this));
      document.addEventListener("mouseup", this.mouseupHandler.bind(this));
    }, 1000);
  }

  private insertResizeHandles(el: HTMLElement) {
    const resizerLeft = document.createElement('div');
    const resizerRight = document.createElement('div');
    const resizerTop = document.createElement('div');
    const resizerBottom = document.createElement('div');
    const resizerTopLeft = document.createElement('div');
    const resizerTopRight = document.createElement('div');
    const resizerBottomLeft = document.createElement('div');
    const resizerBottomRight = document.createElement('div');
    // const dragger = document.createElement('div');
    resizerLeft.classList.add('resizer', 'resizer-left');
    resizerRight.classList.add('resizer', 'resizer-right');
    resizerTop.classList.add('resizer', 'resizer-top');
    resizerBottom.classList.add('resizer', 'resizer-bottom');
    resizerTopLeft.classList.add('resizer', 'resizer-top-left');
    resizerTopRight.classList.add('resizer', 'resizer-top-right');
    resizerBottomLeft.classList.add('resizer', 'resizer-bottom-left');
    resizerBottomRight.classList.add('resizer', 'resizer-bottom-right');

    // dragger.classList.add('dragger');
    el.appendChild(resizerLeft);
    el.appendChild(resizerRight);
    el.appendChild(resizerTop);
    el.appendChild(resizerBottom);
    el.appendChild(resizerTopLeft);
    el.appendChild(resizerTopRight);
    el.appendChild(resizerBottomLeft);
    el.appendChild(resizerBottomRight);
    // el.appendChild(dragger);
  }

  private mousedownHandler(e: MouseEvent) {
    this.resizer = e.target as HTMLElement;
    this.posStart = { x: e.clientX, y: e.clientY };
    this.computedStyle = getComputedStyle(this.resizer.parentElement as HTMLElement);
    this.gridColumnStart = parseInt(this.computedStyle.getPropertyValue('grid-column-start'));
    this.gridColumnEnd = parseInt(this.computedStyle.getPropertyValue('grid-column-end'));
    this.gridRowStart = parseInt(this.computedStyle.getPropertyValue('grid-row-start'));
    this.gridRowEnd = parseInt(this.computedStyle.getPropertyValue('grid-row-end'));
    (e.target as HTMLElement)?.parentElement?.classList.add('resizing');
  }

  private mousemoveHandler(e: MouseEvent) {
    if (!this.resizer?.parentElement) return
    const containerCompStyle = getComputedStyle(this.container);
    const cellSizeX = parseInt(containerCompStyle.getPropertyValue('grid-template-columns').split('px ')[0]);
    const cellSizeY = parseInt(containerCompStyle.getPropertyValue('grid-template-rows').split('px ')[0]);
    const changeX = Math.floor((e.clientX - this.posStart.x + (cellSizeX / 2)) / cellSizeX);
    const changeY = Math.floor((e.clientY - this.posStart.y + (cellSizeY / 2)) / cellSizeY);

    console.log('-------changeX', changeX, 'changeY', changeY);

    if (this.resizer.classList.contains('resizer-right')) {
      this.resizer.parentElement.style.gridColumnEnd = String(this.gridColumnEnd + changeX);
    } else if (this.resizer.classList.contains('resizer-left')) {
      this.resizer.parentElement.style.gridColumnStart = String(this.gridColumnStart + changeX);
    } else if (this.resizer.classList.contains('resizer-top')) {
      this.resizer.parentElement.style.gridRowStart = String(this.gridRowStart + changeY);
    } else if (this.resizer.classList.contains('resizer-bottom')) {
      this.resizer.parentElement.style.gridRowEnd = String(this.gridRowEnd + changeY);
    }
  }

  private mouseupHandler(e: MouseEvent) {
    if (!this.resizer) return;
    this.resizer?.parentElement?.classList.remove('resizing');
    this.resizer = null;
  }


}
export interface QuackamoleGridOptions {
  columns: number;
  rows: number;
  gridGap: number;
}

const defaultOptions: QuackamoleGridOptions = {
  columns: 24,
  rows: 18,
  gridGap: 6,
};
