export type MoveHandler = (event: MouseEvent, dx: number, dy: number, x: number, y: number) => void;
export type UpHandler = (event: MouseEvent, x: number, y: number, moved: boolean) => void;

export const drag = (event: MouseEvent, {move, up}: { move: MoveHandler, up?: UpHandler }) => {

  const {pageX, pageY} = event;
  let x = pageX;
  let y = pageY;
  let moved = false;
  const mouseMoveHandler = (e: MouseEvent) => {
    // tslint:disable-next-line:no-shadowed-variable
    const {pageX, pageY} = e;
    const dx = pageX - x;
    const dy = pageY - y;
    x = pageX;
    y = pageY;
    if (dx || dy) {
      moved = true;
    }
    move(e, dx, dy, x, y);
    e.preventDefault(); // to avoid text selection
  };

  const mouseUpHandler = (e: MouseEvent) => {
    // tslint:disable-next-line:no-shadowed-variable
    const {pageX, pageY} = e;
    x = pageX;
    y = pageY;

    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);

    if (up) {
      up(e, x, y, moved);
    }
  };

  document.addEventListener('mousemove', mouseMoveHandler);
  document.addEventListener('mouseup', mouseUpHandler);
};
