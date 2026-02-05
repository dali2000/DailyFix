import { Directive, ElementRef, OnDestroy, OnInit } from '@angular/core';

/**
 * Ajoute un touchmove avec passive: false pour que preventDefault() fonctionne.
 * Sans ça, le premier swipe fait défiler la page au lieu de déclencher le swipe de la carte.
 * Bloque le scroll uniquement quand le geste est horizontal (swipe gauche/droite).
 */
@Directive({
  selector: '[appSwipePreventScroll]',
  standalone: true
})
export class SwipePreventScrollDirective implements OnInit, OnDestroy {
  private startX = 0;
  private startY = 0;
  private touchActive = false;
  private readonly boundTouchStart = (e: TouchEvent) => this.onTouchStart(e);
  private readonly boundTouchEnd = () => this.onTouchEnd();
  private readonly boundTouchMove = (e: TouchEvent) => this.onTouchMove(e);

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    const host = this.el.nativeElement;
    host.addEventListener('touchstart', this.boundTouchStart, { passive: true });
    host.addEventListener('touchend', this.boundTouchEnd, { passive: true });
    host.addEventListener('touchcancel', this.boundTouchEnd, { passive: true });
    host.addEventListener('touchmove', this.boundTouchMove, { passive: false });
  }

  ngOnDestroy(): void {
    const host = this.el.nativeElement;
    host.removeEventListener('touchstart', this.boundTouchStart);
    host.removeEventListener('touchend', this.boundTouchEnd);
    host.removeEventListener('touchcancel', this.boundTouchEnd);
    host.removeEventListener('touchmove', this.boundTouchMove);
  }

  private onTouchStart(e: TouchEvent): void {
    if (e.touches.length > 0) {
      this.startX = e.touches[0].clientX;
      this.startY = e.touches[0].clientY;
      this.touchActive = true;
    }
  }

  private onTouchEnd(): void {
    this.touchActive = false;
  }

  private onTouchMove(e: TouchEvent): void {
    if (!this.touchActive || e.touches.length === 0) return;
    const dx = e.touches[0].clientX - this.startX;
    const dy = e.touches[0].clientY - this.startY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
      e.preventDefault();
    }
  }
}
