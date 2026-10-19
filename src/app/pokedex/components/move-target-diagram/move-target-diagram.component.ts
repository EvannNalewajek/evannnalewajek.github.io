import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TargetPreset, TargetCell as Cell } from '../../models/move.model';

const PRESETS: Record<TargetPreset, Cell[]> = {
  'adjacent-one': ['FOE_L','FOE_C','ALLY_L'],
  'adjacent-foes-all': ['FOE_L','FOE_C'],
  'adjacent-all': ['FOE_L','FOE_C','ALLY_L'],
  'all-one': ['FOE_L','FOE_C','FOE_R','ALLY_L','ALLY_R'],
  'ally-one': ['ALLY_L'],
  'all-allies': ['SELF', 'ALLY_L', 'ALLY_R'],
  'all-allies-but-self': ['ALLY_L', 'ALLY_R'],
  'self-or-ally': ['SELF', 'ALLY_L'],
  'all-ennemies': ['FOE_L','FOE_C', 'FOE_R'],
  'variable': ['SELF'],
  'all': ['FOE_L','FOE_C','FOE_R','ALLY_L','ALLY_R','SELF'],
  'self': ['SELF']
};

@Component({
  selector: 'app-move-target-diagram',
  standalone: true,
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
  <p class="target-caption">{{ caption() || defaultCaption() }}</p>
  `,
  styleUrls: ['./move-target-diagram.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MoveTargetDiagramComponent {
  readonly preset = input<TargetPreset | undefined>();
  readonly pattern = input<Cell[] | undefined>();
  readonly caption = input<string | undefined>();

  readonly active = computed<Set<Cell>>(() => {
    const p = this.preset();
    const cells = this.pattern() ?? (p ? PRESETS[p] : []);
    return new Set(cells);
  });

  isHit(c: Cell): boolean {
    return this.active().has(c);
  }

  readonly defaultCaption = computed<string>(() => {
    switch (this.preset()) {
      case 'adjacent-one': return "N'importe quel Pokémon adjacent au lanceur";
      case 'adjacent-foes-all': return 'Tous les adversaires adjacents au lanceur';
      case 'adjacent-all': return 'Tous les Pokémon adjacents au lanceur';
      case 'all-one': return "N'importe quel Pokémon à l'exception du lanceur";
      case 'ally-one': return 'Un Pokémon allié adjacent au lanceur';
      case 'all-allies': return 'Tous les alliés';
      case 'all-allies-but-self': return "Tous les alliés à l'exception du lanceur";
      case 'self-or-ally': return 'Le Pokémon lançant la capacité ou un allié adjacent';
      case 'all-ennemies': return 'Tous les adversaires';
      case 'variable': return 'Variable';
      case 'all': return 'Tous les Pokémon en combat';
      case 'self': return 'Le Pokémon lançant la capacité';
      default: return '';
    }
  });
}