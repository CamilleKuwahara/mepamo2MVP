import artwork from '../assets/mepamo_mascot_waving.svg?raw';
import './artwork.css';

export interface ArtworkOptions {
  /** Decorative artwork is hidden from assistive technology. */
  decorative?: boolean;
  label?: string;
}



/** Supplied inline artwork, with page-wide tracking and an explicit unmount lifecycle. */
export class MepamoMascot {
  readonly element: SVGSVGElement;
  private readonly eyes: {node: SVGEllipseElement; x: number; y: number}[];
  private pointer: {x: number; y: number} | null = null;
  private frame: number | null = null;
  private destroyed = false;

  constructor({decorative = false, label}: ArtworkOptions = {}) {
    const documentSvg = new DOMParser().parseFromString(artwork, 'image/svg+xml');
    this.element = document.importNode(documentSvg.documentElement, true) as unknown as SVGSVGElement;
    this.element.classList.add('mepamo-mascot');
    this.element.setAttribute('focusable', 'false');
    // Each instance owns its gradients and accessible title/description IDs.
    const prefix = `mepamo-mascot-${crypto.randomUUID()}`;
    const ids = new Map<string, string>();
    this.element.querySelectorAll('[id]').forEach(node => {
      const oldId = node.id;
      ids.set(oldId, `${prefix}-${oldId}`);
      node.id = ids.get(oldId)!;
    });
    [this.element, ...Array.from(this.element.querySelectorAll('*'))].forEach(node => {
      for (const attribute of Array.from(node.attributes)) {
        let value = attribute.value;
        ids.forEach((newId, oldId) => {
          value = value.replaceAll(`url(#${oldId})`, `url(#${newId})`);
          if ((attribute.name === 'href' || attribute.name === 'xlink:href') && value === `#${oldId}`) value = `#${newId}`;
        });
        if (attribute.name === 'aria-labelledby' || attribute.name === 'aria-describedby') {
          value = value.split(/\s+/).map(id => ids.get(id) || id).join(' ');
        }
        if (value !== attribute.value) node.setAttribute(attribute.name, value);
      }
    });
    if (decorative) {
      this.element.setAttribute('aria-hidden', 'true');
      this.element.removeAttribute('role');
      this.element.removeAttribute('aria-labelledby');
    } else if (label) {
      this.element.querySelector('title')!.textContent = label;
    }
    this.eyes = Array.from(this.element.querySelectorAll<SVGEllipseElement>('.pupil')).map(node => ({
      node, x: Number(node.getAttribute('cx')), y: Number(node.getAttribute('cy')),
    }));
    document.addEventListener('pointermove', this.onPointerMove, {passive: true});
    document.documentElement.addEventListener('pointerleave', this.reset);
    window.addEventListener('blur', this.reset);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    window.addEventListener('resize', this.schedule, {passive: true});
    document.addEventListener('scroll', this.schedule, {passive: true, capture: true});
  }

  private onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    this.pointer = {x: event.clientX, y: event.clientY};
    this.schedule();
  };

  private schedule = () => {
    if (!this.destroyed && this.pointer && this.frame === null) this.frame = requestAnimationFrame(this.paint);
  };

  private paint = () => {
    this.frame = null;
    if (this.destroyed || !this.pointer || !this.element.isConnected) return;
    const matrix = this.element.getScreenCTM();
    if (!matrix) return;
    const point = this.element.createSVGPoint();
    point.x = this.pointer.x;
    point.y = this.pointer.y;
    let local: DOMPoint;
    try { local = point.matrixTransform(matrix.inverse()); } catch { this.reset(); return; }
    for (const eye of this.eyes) {
      const dx = local.x - eye.x;
      const dy = local.y - eye.y;
      const distance = Math.hypot(dx, dy, 100);
      eye.node.style.transform = `translate(${9 * dx / distance}px, ${7 * dy / distance}px)`;
    }
  };

  private onVisibilityChange = () => { if (document.hidden) this.reset(); };

  private reset = () => {
    this.pointer = null;
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
    for (const eye of this.eyes) eye.node.style.transform = 'translate(0px, 0px)';
  };

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    document.removeEventListener('pointermove', this.onPointerMove);
    document.documentElement.removeEventListener('pointerleave', this.reset);
    window.removeEventListener('blur', this.reset);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    window.removeEventListener('resize', this.schedule);
    document.removeEventListener('scroll', this.schedule, true);
    this.reset();
  }
}

