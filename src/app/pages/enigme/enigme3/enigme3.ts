import { Component, OnInit, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type FileNode = {
  type: 'file' | 'dir';
  content?: string;
  children?: Record<string, FileNode>;
};

type TerminalLine = {
  type: 'cmd' | 'res' | 'err' | 'info';
  text: string;
};

@Component({
  selector: 'app-enigme3',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './enigme3.html',
  styleUrls: ['./enigme3.scss']
})
export class Enigme3Component implements OnInit, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  history = signal<TerminalLine[]>([
    { type: 'info', text: 'SYSTEM RECOVERY TERMINAL v4.0.2' },
    { type: 'info', text: 'AUTHORIZED ACCESS ONLY. TYPE "help" FOR COMMANDS.' }
  ]);

  currentInput = signal('');
  currentPath = signal<string[]>([]); // Array of folder names

  vfs: Record<string, FileNode> = {
    'readme.txt': { type: 'file', content: 'Bienvenue sur le terminal de secours. Les systèmes principaux sont HS. La clé de déverrouillage du noyau est stockée dans les archives de session (/logs).' },
    'logs': {
      type: 'dir',
      children: {
        'sys.log': { type: 'file', content: '2026-06-04: Critical error in Sector 7. Access denied. Attempting backup...' },
        'auth.bak': { type: 'file', content: 'Admin session logged. Backup key override: OMEGA' }
      }
    },
    'core.enc': { type: 'file', content: 'FICHIER CHIFFRÉ. UTILISEZ LA COMMANDE: decrypt core.enc [KEY]' }
  };

  success = signal(false);

  ngOnInit(): void {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  handleInput(e: Event) {
    e.preventDefault();
    const cmdStr = this.currentInput().trim();
    if (!cmdStr) return;

    this.history.update(h => [...h, { type: 'cmd', text: cmdStr }]);
    this.processCommand(cmdStr);
    this.currentInput.set('');
  }

  private processCommand(cmdStr: string) {
    const parts = cmdStr.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'help':
        this.addResponse('Commandes disponibles: ls, cd, cat, clear, help, decrypt');
        break;
      case 'ls':
        this.executeLs();
        break;
      case 'cd':
        this.executeCd(args[0]);
        break;
      case 'cat':
        this.executeCat(args[0]);
        break;
      case 'clear':
        this.history.set([]);
        break;
      case 'decrypt':
        this.executeDecrypt(args[0], args[1]);
        break;
      default:
        this.addError(`Commande inconnue: ${cmd}`);
    }
  }

  private executeLs() {
    const node = this.getNodeAtPath(this.currentPath());
    if (node && node.children) {
      const items = Object.keys(node.children).map(name => {
        const item = node.children![name];
        return item.type === 'dir' ? name + '/' : name;
      });
      // Sort and join with spaces
      const output = items.sort().join('    ');
      this.addResponse(output || '(vide)');
    }
  }

  private executeCd(target: string) {
    if (!target) return;
    if (target === '..') {
      if (this.currentPath().length > 0) {
        this.currentPath.update(p => p.slice(0, -1));
      }
      return;
    }

    const node = this.getNodeAtPath([...this.currentPath(), target]);
    if (node && node.type === 'dir') {
      this.currentPath.update(p => [...p, target]);
    } else {
      this.addError(`Dossier introuvable: ${target}`);
    }
  }

  private executeCat(target: string) {
    if (!target) return;
    const node = this.getNodeAtPath([...this.currentPath(), target]);
    if (node && node.type === 'file') {
      this.addResponse(node.content || '');
    } else if (node && node.type === 'dir') {
      this.addError(`${target} est un dossier.`);
    } else {
      this.addError(`Fichier introuvable: ${target}`);
    }
  }

  private executeDecrypt(file: string, key: string) {
    if (file === 'core.enc' && key?.toUpperCase() === 'OMEGA') {
      this.addResponse('DÉCHIFFREMENT EN COURS...');
      setTimeout(() => {
        this.addResponse('>>> ACCÈS ROOT ACCORDÉ <<<');
        this.addResponse('Félicitations, vous avez trouvé la faille.');
        this.success.set(true);
      }, 1000);
    } else {
      this.addError('Échec du déchiffrement. Clé invalide ou fichier incorrect.');
    }
  }

  private getNodeAtPath(path: string[]): FileNode | null {
    let current: FileNode = { type: 'dir', children: this.vfs };
    for (const segment of path) {
      if (current.children && current.children[segment]) {
        current = current.children[segment];
      } else {
        return null;
      }
    }
    return current;
  }

  private addResponse(text: string) {
    this.history.update(h => [...h, { type: 'res', text }]);
  }

  private addError(text: string) {
    this.history.update(h => [...h, { type: 'err', text }]);
  }

  getPathString() {
    return '/' + this.currentPath().join('/');
  }
}
