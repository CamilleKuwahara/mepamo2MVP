import {MepamoMascot} from './MepamoMascot';
import {MepamoFuji} from './MepamoFuji';

/** Mount artwork after the existing string-template screen render. */
export function mountArtwork(root: ParentNode): () => void {
  const mascots: MepamoMascot[] = [];
  root.querySelectorAll<HTMLElement>('[data-mepamo-mascot]').forEach(host => {
    const component = new MepamoMascot();
    host.replaceChildren(component.element);
    mascots.push(component);
  });
  root.querySelectorAll<HTMLElement>('[data-mepamo-fuji]').forEach(host => {
    host.replaceChildren(new MepamoFuji().element);
  });
  return () => mascots.forEach(component => component.destroy());
}
