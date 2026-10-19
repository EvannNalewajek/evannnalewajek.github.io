import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';

@Component({
    selector: 'app-documentation',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './documentation.component.html',
    styleUrls: ['./documentation.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentationComponent {
    private readonly title = inject(Title);

    constructor() {
        this.title.setTitle('Pokédex — Documentations');
    }
}