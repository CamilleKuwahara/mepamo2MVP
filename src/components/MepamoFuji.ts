import type {ArtworkOptions} from './MepamoMascot';
import './artwork.css';

/** The supplied CSS-animated SVG remains an isolated external image document. */
export class MepamoFuji {
  readonly element: HTMLImageElement;

  constructor({decorative = false, label = 'Mount Fuji with a gently moving sun'}: ArtworkOptions = {}) {
    this.element = document.createElement('img');
    this.element.className = 'mepamo-fuji';
    this.element.src = '/assets/mepamo/artwork/mepamo_fuji_animated.svg';
    this.element.width = 295;
    this.element.height = 228;
    this.element.alt = decorative ? '' : label;
    if (decorative) this.element.setAttribute('aria-hidden', 'true');
  }
}
