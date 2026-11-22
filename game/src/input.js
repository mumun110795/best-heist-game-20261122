// Keyboard and mouse, gathered in one place: held movement keys, the sneak and
// work keys, one-shot pulses for the tools and for confirming screens, and the
// pointer position in canvas coordinates (the coin goes where the player points).
import { VIEW } from './config.js';

const MOVE_KEYS = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
};

export function createInput(canvas) {
  const held = { left: false, right: false, up: false, down: false, sneak: false, interact: false };
  const pulses = { smoke: false, jammer: false, confirm: false, coinAt: null };
  const pointer = { x: VIEW.width / 2, y: VIEW.height / 2, inside: false };

  function toCanvas(event) {
    const box = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - box.left) / box.width) * VIEW.width,
      y: ((event.clientY - box.top) / box.height) * VIEW.height,
    };
  }

  window.addEventListener('keydown', (event) => {
    const move = MOVE_KEYS[event.code];
    if (move) {
      held[move] = true;
      event.preventDefault();
    }
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') held.sneak = true;
    if (event.code === 'Space') {
      held.interact = true;
      pulses.confirm = true;
      event.preventDefault();
    }
    if (event.code === 'Enter') pulses.confirm = true;
    if (event.code === 'KeyQ' && !event.repeat) pulses.smoke = true;
    if (event.code === 'KeyF' && !event.repeat) pulses.jammer = true;
    if (event.code === 'KeyE' && !event.repeat) pulses.coinAt = { x: pointer.x, y: pointer.y };
  });
  window.addEventListener('keyup', (event) => {
    const move = MOVE_KEYS[event.code];
    if (move) held[move] = false;
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') held.sneak = false;
    if (event.code === 'Space') held.interact = false;
  });
  canvas.addEventListener('pointermove', (event) => {
    const point = toCanvas(event);
    pointer.x = point.x;
    pointer.y = point.y;
    pointer.inside = true;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const point = toCanvas(event);
    pointer.x = point.x;
    pointer.y = point.y;
    pulses.coinAt = { x: point.x, y: point.y };
    pulses.confirm = true;
  });

  return {
    /** The controls for this frame; pulses are consumed by reading them. */
    read() {
      const controls = {
        moveX: (held.right ? 1 : 0) - (held.left ? 1 : 0),
        moveY: (held.down ? 1 : 0) - (held.up ? 1 : 0),
        sneak: held.sneak,
        interact: held.interact,
        smoke: pulses.smoke,
        jammer: pulses.jammer,
        confirm: pulses.confirm,
        coinAt: pulses.coinAt,
      };
      pulses.smoke = false;
      pulses.jammer = false;
      pulses.confirm = false;
      pulses.coinAt = null;
      return controls;
    },
    pointer,
  };
}
