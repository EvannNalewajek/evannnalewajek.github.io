import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TargetPreset, TargetCell as Cell } from '../../move.model';

const PRESETS: Record<TargetPreset, Cell[]> = {
  'adjacent-one': ['FOE_L','FOE_C','ALLY_L'],
  'adjacent-foes-all': ['FOE_L','FOE_C'],
  'adjacent-all': ['FOE_L','FOE_C','ALLY_L'],
  'all-one': ['FOE_L','FOE_C','FOE_R','ALLY_L','ALLY_R'],
  'self': ['SELF']
};

@Component({
  selector: 'app-move-target-diagram',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="target-diagram">
    <div class="row">
      <div class="cell foe"  [class.hit]="isHit('FOE_L')">Adversaire</div>
      <div class="cell foe"  [class.hit]="isHit('FOE_C')">Adversaire</div>
      <div class="cell foe"  [class.hit]="isHit('FOE_R')">Adversaire</div>
    </div>
    <div class="row">
      <div class="cell self" [class.hit]="isHit('SELF')">Lanceur</div>
      <div class="cell ally" [class.hit]="isHit('ALLY_L')">Allié</div>
      <div class="cell ally" [class.hit]="isHit('ALLY_R')">Allié</div>
    </div>
  </div>
  <p class="target-caption">{{ caption || defaultCaption }}</p>
  `,
  styleUrls: ['./move-target-diagram.component.scss']
})
export class MoveTargetDiagramComponent {
  @Input() preset?: TargetPreset;
  @Input() pattern?: Cell[];
  @Input() caption?: string;

  get active(): Set<Cell> {
    const cells = this.pattern ?? (this.preset ? PRESETS[this.preset] : []);
    return new Set(cells);
  }

  isHit(c: Cell) { return this.active.has(c); }

  get defaultCaption(): string {
    if (this.preset === 'adjacent-one') return "N'importe quel Pokémon adjacent au lanceur";
    if (this.preset === 'adjacent-foes-all') return 'Tous les adversaires adjacents au lanceur';
    if (this.preset === 'adjacent-all') return 'Tous les Pokémon adjacents au lanceur';
    if (this.preset === 'all-one') return "N'importe quel Pokémon à l'exception du lanceur";
    if (this.preset === 'self') return "Le Pokémon lançant la capacité";
    return '';
  }
}