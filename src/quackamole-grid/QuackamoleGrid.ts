export class QuackamoleGrid {
  private static CLASS_RESIZER = 'quackamole-grid-resizer';
  private static CLASS_EDGE_T = 'quackamole-grid-edge-t';
  private static CLASS_EDGE_R = 'quackamole-grid-edge-r';
  private static CLASS_EDGE_B = 'quackamole-grid-edge-b';
  private static CLASS_EDGE_L = 'quackamole-grid-edge-l';
  private static CLASS_CORNER_TL = 'quackamole-grid-corner-tl';
  private static CLASS_CORNER_TR = 'quackamole-grid-corner-tr';
  private static CLASS_CORNER_BL = 'quackamole-grid-corner-bl';
  private static CLASS_CORNER_BR = 'quackamole-grid-corner-br';

  static init(containerId: string, columns = 16, rows = 10, gridGap = 6, resizerWidth = 6) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container with id ${containerId} not found`);
    container.classList.add('quackamole-grid-container');
    this.container = container;

    document.getElementById('quackamole-grid-styles')?.remove();
    const style: HTMLStyleElement = document.createElement('style');
    style.id = 'quackamole-grid-styles';
    style.appendChild(document.createTextNode(this.quackamoleGridCssFactory(containerId, columns, rows, gridGap, resizerWidth)));
    document.head.insertAdjacentElement("beforeend", style);

    document.addEventListener("mousedown", this.mousedownHandler.bind(QuackamoleGrid));
    document.addEventListener("mousemove", this.mousemoveHandler.bind(QuackamoleGrid));
    document.addEventListener("mouseup", this.mouseupHandler.bind(QuackamoleGrid));
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

  private static insertResizeHandles(el: HTMLElement) {
    const resizerLeft = document.createElement('div');
    const resizerRight = document.createElement('div');
    const resizerTop = document.createElement('div');
    const resizerBottom = document.createElement('div');
    const resizerTopLeft = document.createElement('div');
    const resizerTopRight = document.createElement('div');
    const resizerBottomLeft = document.createElement('div');
    const resizerBottomRight = document.createElement('div');
    resizerLeft.classList.add(this.CLASS_RESIZER, this.CLASS_EDGE_L);
    resizerRight.classList.add(this.CLASS_RESIZER, this.CLASS_EDGE_R);
    resizerTop.classList.add(this.CLASS_RESIZER, this.CLASS_EDGE_T);
    resizerBottom.classList.add(this.CLASS_RESIZER, this.CLASS_EDGE_B);
    resizerTopLeft.classList.add(this.CLASS_RESIZER, this.CLASS_CORNER_TL);
    resizerTopRight.classList.add(this.CLASS_RESIZER, this.CLASS_CORNER_TR);
    resizerBottomLeft.classList.add(this.CLASS_RESIZER, this.CLASS_CORNER_BL);
    resizerBottomRight.classList.add(this.CLASS_RESIZER, this.CLASS_CORNER_BR);
    el.appendChild(resizerLeft);
    el.appendChild(resizerRight);
    el.appendChild(resizerTop);
    el.appendChild(resizerBottom);
    el.appendChild(resizerTopLeft);
    el.appendChild(resizerTopRight);
    el.appendChild(resizerBottomLeft);
    el.appendChild(resizerBottomRight);
  }

  private static mousedownHandler(e: MouseEvent) {
    if (!(e.target as HTMLElement).classList.contains(this.CLASS_RESIZER)) return;
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
    // TODO there is sometimes an issue when mouseup event seems to be ignored and it continues to resize the element. Find out why
    if (!this.resizer?.parentElement) return
    const containerCompStyle = getComputedStyle(this.container);
    const cellSizeX = parseInt(containerCompStyle.getPropertyValue('grid-template-columns').split('px ')[0]);
    const cellSizeY = parseInt(containerCompStyle.getPropertyValue('grid-template-rows').split('px ')[0]);
    const changeX = Math.round((e.clientX - this.posStart.x) / cellSizeX);
    const changeY = Math.round((e.clientY - this.posStart.y) / cellSizeY);

    const cl = this.resizer.classList;
    const pes = this.resizer.parentElement.style;
    // TODO it would be simpler to just assign both classes edge-t and edge-r for top left corner but for some reason I had trouble with that 
    if (cl.contains(this.CLASS_EDGE_R) || cl.contains(this.CLASS_CORNER_TR) || cl.contains(this.CLASS_CORNER_BR)) pes.gridColumnEnd = String(this.gridColumnEnd + changeX);
    if (cl.contains(this.CLASS_EDGE_L) || cl.contains(this.CLASS_CORNER_TL) || cl.contains(this.CLASS_CORNER_BL)) pes.gridColumnStart = String(this.gridColumnStart + changeX);
    if (cl.contains(this.CLASS_EDGE_T) || cl.contains(this.CLASS_CORNER_TR) || cl.contains(this.CLASS_CORNER_TL)) pes.gridRowStart = String(this.gridRowStart + changeY);
    if (cl.contains(this.CLASS_EDGE_B) || cl.contains(this.CLASS_CORNER_BL) || cl.contains(this.CLASS_CORNER_BR)) pes.gridRowEnd = String(this.gridRowEnd + changeY);
  }

  private static mouseupHandler(e: MouseEvent) {
    if (!this.resizer) return;
    this.resizer?.parentElement?.classList.remove('resizing');
    this.resizer = null;
  }

  private static quackamoleGridCssFactory(containerId: string, columns: number, rows: number, gridGap: number, resizerWidth: number) {
    return `
      #${containerId}.quackamole-grid-container {
        display: grid;
        padding: ${gridGap}px;
        grid-template-columns: repeat(${columns}, 1fr);
        grid-template-rows: repeat(${rows}, 1fr);
        grid-gap: ${gridGap}px;
      }

      .${this.CLASS_RESIZER} {
        position: absolute;
        cursor: pointer;
        opacity: 0;
        z-index: 1001;
      }

      .${this.CLASS_RESIZER}.${this.CLASS_EDGE_L} {
        width: ${resizerWidth}px;
        top: 0;
        bottom: 0;
        left: 0;
        cursor: w-resize;
      }

      .${this.CLASS_RESIZER}.${this.CLASS_EDGE_R} {
        width: ${resizerWidth}px;
        top: 0;
        bottom: 0;
        right: 0;
        cursor: e-resize;
      }

      .${this.CLASS_RESIZER}.${this.CLASS_EDGE_T} {
        height: ${resizerWidth}px;
        top: 0;
        left: 0;
        right: 0;
        cursor: n-resize;
      }

      .${this.CLASS_RESIZER}.${this.CLASS_EDGE_B} {
        height: ${resizerWidth}px;
        bottom: 0;
        left: 0;
        right: 0;
        cursor: s-resize;
      }

      .${this.CLASS_RESIZER}.${this.CLASS_CORNER_TL},
      .${this.CLASS_RESIZER}.${this.CLASS_CORNER_TR},
      .${this.CLASS_RESIZER}.${this.CLASS_CORNER_BL},
      .${this.CLASS_RESIZER}.${this.CLASS_CORNER_BR} {
        width: ${resizerWidth}px;
        height: ${resizerWidth}px;
        z-index: 1002;
      }

      .${this.CLASS_RESIZER}.${this.CLASS_CORNER_TL} {
        top: 0;
        left: 0;
        cursor: nw-resize;
      }
      
      .${this.CLASS_RESIZER}.${this.CLASS_CORNER_TR} {
        top: 0;
        right: 0;
        cursor: ne-resize;
      }
      
      .${this.CLASS_RESIZER}.${this.CLASS_CORNER_BL} {
        bottom: 0;
        left: 0;
        cursor: sw-resize;
      }
        
      .${this.CLASS_RESIZER}.${this.CLASS_CORNER_BR} {
        bottom: 0;
        right: 0;
        cursor: se-resize;
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
  }
}
