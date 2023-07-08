export class QuackamoleGrid {

  static init(containerId: string, columns = 16, rows = 10, gridGap = 6, resizerWidth = 6) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container with id ${containerId} not found`);
    container.classList.add('quackamole-grid-container');
    this.container = container;

    document.getElementById('quackamole-grid-styles')?.remove();
    const style: HTMLStyleElement = document.createElement('style');
    style.id = 'quackamole-grid-styles';
    style.appendChild(document.createTextNode(quackamoleGridCssFactory(containerId, columns, rows, gridGap, resizerWidth)));
    document.head.insertAdjacentElement("beforeend", style);

    document.addEventListener("mousedown", this.mousedownHandler.bind(QuackamoleGrid));
    document.addEventListener("mousemove", this.mousemoveHandler.bind(QuackamoleGrid));
    document.addEventListener("mouseup", this.mouseupHandler.bind(QuackamoleGrid));


    // style.type='text/css';
    // if(style.){
    //     style.cssText='your css styles';
    // }else{
    //     style.appendChild(document.createTextNode('your css styles'));
    // }
    // document.getElementsByTagName('head')[0].appendChild(style);
  }

  static registerGridItem(gridItemId: string, gridColumnStart = 1, gridRowStart = 1, gridColumnEnd = 1, gridRowEnd = 1) {
    const gridItem = document.getElementById(gridItemId);
    if (!gridItem) throw new Error(`GridItem with id ${gridItemId} not found`);
    gridItem.classList.add('quackamole-grid-item');
    this.insertResizeHandles(gridItem);
    gridItem.style.cssText = `
      grid-column-start: ${gridColumnStart};
      grid-row-start: ${gridRowStart};
      grid-column-end: ${gridColumnEnd};
      grid-row-end: ${gridRowEnd};
      position: relative;
    `;
  }
  private static container: HTMLElement;
  // gridItemClass: string;
  // options: QuackamoleGridOptions | undefined;
  // defaultOptions: QuackamoleGridOptions = defaultOptions;

  private static resizer: HTMLElement | null = null;
  private static posStart: { x: number, y: number } = { x: 0, y: 0 };
  private static computedStyle: CSSStyleDeclaration | null = null;
  private static gridColumnStart = -1;
  private static gridColumnEnd = -1;
  private static gridRowStart = -1;
  private static gridRowEnd = -1;

  // constructor(containerId: string, gridItemClass: string, options?: QuackamoleGridOptions) {
  //   const container = document.getElementById(containerId);
  //   this.options = options;
  //   this.gridItemClass = gridItemClass;
  //   if (!container) throw new Error(`Container with id ${containerId} not found`);
  //   this.container = container;

  //   this.container.style.cssText = `
  //     display: grid;
  //     padding: ${this.options?.gridGap || this.defaultOptions.gridGap}px;
  //     grid-template-columns: repeat(${this.options?.columns || this.defaultOptions.columns}, 1fr);
  //     grid-template-rows: repeat(${this.options?.rows || this.defaultOptions.rows}, 1fr);
  //     grid-gap: ${this.options?.gridGap || this.defaultOptions.gridGap}px;
  //   `;

  //   setTimeout(() => {

  //     const gridItems = document.querySelectorAll<HTMLElement>('.' + this.gridItemClass);
  //     console.log('---------griditems', gridItems);
  //     gridItems.forEach(el => this.insertResizeHandles(el));
  //     const resizers = document.querySelectorAll<HTMLElement>('.resizer');
  //     resizers.forEach(el => el.addEventListener("mousedown", this.mousedownHandler.bind(this))); // TODO single listener
  //     document.addEventListener("mousemove", this.mousemoveHandler.bind(this));
  //     document.addEventListener("mouseup", this.mouseupHandler.bind(this));
  //   }, 1000);
  // }

  private static insertResizeHandles(el: HTMLElement) {
    const resizerLeft = document.createElement('div');
    const resizerRight = document.createElement('div');
    const resizerTop = document.createElement('div');
    const resizerBottom = document.createElement('div');
    const resizerTopLeft = document.createElement('div');
    const resizerTopRight = document.createElement('div');
    const resizerBottomLeft = document.createElement('div');
    const resizerBottomRight = document.createElement('div');
    // const dragger = document.createElement('div');
    resizerLeft.classList.add('quackamole-grid-resizer', 'quackamole-grid-resizer-left');
    resizerRight.classList.add('quackamole-grid-resizer', 'quackamole-grid-resizer-right');
    resizerTop.classList.add('quackamole-grid-resizer', 'quackamole-grid-resizer-top');
    resizerBottom.classList.add('quackamole-grid-resizer', 'quackamole-grid-resizer-bottom');
    resizerTopLeft.classList.add('quackamole-grid-resizer', 'quackamole-grid-resizer-top-left');
    resizerTopRight.classList.add('quackamole-grid-resizer', 'quackamole-grid-resizer-top-right');
    resizerBottomLeft.classList.add('quackamole-grid-resizer', 'quackamole-grid-resizer-bottom-left');
    resizerBottomRight.classList.add('quackamole-grid-resizer', 'quackamole-grid-resizer-bottom-right');

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

  private static mousedownHandler(e: MouseEvent) {
    if (!(e.target as HTMLElement).classList.contains('quackamole-grid-resizer')) return;
    this.resizer = e.target as HTMLElement;
    this.posStart = { x: e.clientX, y: e.clientY };
    this.computedStyle = getComputedStyle(this.resizer.parentElement as HTMLElement);
    this.gridColumnStart = parseInt(this.computedStyle.getPropertyValue('grid-column-start'));
    this.gridColumnEnd = parseInt(this.computedStyle.getPropertyValue('grid-column-end'));
    this.gridRowStart = parseInt(this.computedStyle.getPropertyValue('grid-row-start'));
    this.gridRowEnd = parseInt(this.computedStyle.getPropertyValue('grid-row-end'));
    (e.target as HTMLElement)?.parentElement?.classList.add('resizing');
  }

  private static mousemoveHandler(e: MouseEvent) {
    if (!this.resizer?.parentElement) return
    console.log('-------mousemove', this.resizer);
    const containerCompStyle = getComputedStyle(this.container);
    const cellSizeX = parseInt(containerCompStyle.getPropertyValue('grid-template-columns').split('px ')[0]);
    const cellSizeY = parseInt(containerCompStyle.getPropertyValue('grid-template-rows').split('px ')[0]);
    const changeX = Math.floor((e.clientX - this.posStart.x + (cellSizeX / 2)) / cellSizeX);
    const changeY = Math.floor((e.clientY - this.posStart.y + (cellSizeY / 2)) / cellSizeY);

    // console.log('-------changeX', changeX, 'changeY', changeY);

    if (this.resizer.classList.contains('quackamole-grid-resizer-right')) {
      this.resizer.parentElement.style.gridColumnEnd = String(this.gridColumnEnd + changeX);
    } else if (this.resizer.classList.contains('quackamole-grid-resizer-left')) {
      this.resizer.parentElement.style.gridColumnStart = String(this.gridColumnStart + changeX);
    } else if (this.resizer.classList.contains('quackamole-grid-resizer-top')) {
      this.resizer.parentElement.style.gridRowStart = String(this.gridRowStart + changeY);
    } else if (this.resizer.classList.contains('quackamole-grid-resizer-bottom')) {
      this.resizer.parentElement.style.gridRowEnd = String(this.gridRowEnd + changeY);
    }
  }

  private static mouseupHandler(e: MouseEvent) {
    if (!this.resizer) return;
    this.resizer?.parentElement?.classList.remove('resizing');
    this.resizer = null;
  }
}


const quackamoleGridCssFactory = (containerId: string, columns: number, rows: number, gridGap: number, resizerWidth: number) => `
  #${containerId}.quackamole-grid-container {
    display: grid;
    padding: ${gridGap}px;
    grid-template-columns: repeat(${columns}, 1fr);
    grid-template-rows: repeat(${rows}, 1fr);
    grid-gap: ${gridGap}px;
  }

  .quackamole-grid-resizer {
    position: absolute;
    cursor: pointer;
    opacity: 0;
    z-index: 1001;
  }

  .quackamole-grid-resizer-left {
    width: ${resizerWidth}px;
    top: 0;
    bottom: 0;
    left: 0;
    cursor: w-resize;
  }

  .quackamole-grid-resizer-right {
    width: ${resizerWidth}px;
    top: 0;
    bottom: 0;
    right: 0;
    cursor: e-resize;
  }

  .quackamole-grid-resizer-top {
    height: ${resizerWidth}px;
    top: 0;
    left: 0;
    right: 0;
    cursor: n-resize;
  }

  .quackamole-grid-resizer-bottom {
    height: ${resizerWidth}px;
    bottom: 0;
    left: 0;
    right: 0;
    cursor: s-resize;
  }

  .quackamole-grid-item {
    overflow: hidden;
    position: relative;
  }

  .quackamole-grid-item.resizing::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
  }
`;
