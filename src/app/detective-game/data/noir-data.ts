import { Character, Room, Item, Personality, RelationshipType, SuspicionLevel } from '../models/detective.model';

export const NOIR_CHARACTERS: Character[] = [
  { id: 'tony', name: 'Tony "Le Balafré"', profession: 'Garde du corps', description: 'Un homme imposant au regard froid.', portrait: 'tony.png' },
  { id: 'elena', name: 'Elena Vance', profession: 'Chanteuse de jazz', description: 'Une femme fatale à la voix envoûtante.', portrait: 'elena.png' },
  { id: 'marcus', name: 'Marcus Sterling', profession: 'Banquier', description: 'Élégant, mais semble cacher une nervosité extrême.', portrait: 'marcus.png' },
  { id: 'sophie', name: 'Sophie Miller', profession: 'Journaliste', description: "Toujours à l'affût d'un scoop, peu importe le prix.", portrait: 'sophie.png' },
  { id: 'bartender', name: 'Joe', profession: 'Barman', description: "Il en sait plus qu'il n'en dit.", portrait: 'joe.png' },
  { id: 'maggie', name: 'Maggie "La Rousse"', profession: 'Propriétaire du club', description: "Une femme d'affaires redoutable qui gère le Speakeasy.", portrait: 'maggie.png' },
  { id: 'frank', name: 'Frank "L\'Anguille"', profession: 'Parieur professionnel', description: "Toujours un jeu de cartes en main, et un œil sur la sortie.", portrait: 'frank.png' },
  { id: 'clara', name: 'Clara Dubois', profession: 'Héritière', description: "Vient de perdre son père, ou son argent, on ne sait plus trop.", portrait: 'clara.png' },
  { id: 'vinnie', name: 'Vinnie "Le Muet"', profession: 'Videur', description: "Il ne parle pas beaucoup, mais ses poings oui.", portrait: 'vinnie.png' }
];

export const HENDERSON: Character = {
  id: 'henderson',
  name: 'Inspecteur Henderson',
  profession: 'Policier',
  description: 'Un vieux de la vieille qui a tout vu.',
  portrait: 'henderson.png',
  personality: 'friendly'
};

export const PERSONALITIES: Personality[] = ['cold', 'nervous', 'arrogant', 'friendly', 'mysterious', 'aggressive', 'timid'];

export const DIALOGUE_TEMPLATES: Record<string, Record<string, string[]>> = {
  alibi: {
    cold: ["J'étais {room_at} {room}. C'est tout ce que vous avez besoin de savoir.", "{room_at_cap} {room}. J'y ai passé la soirée."],
    nervous: ["J'étais... j'étais {room_at} {room} ! Je vous jure, je n'ai rien fait !", "{room_at_cap} {room}, je crois... oui, {room_at} {room}. Pourquoi vous me regardez comme ça ?"],
    arrogant: ["Un homme de ma stature n'a pas à se justifier, mais j'étais {room_at} {room}.", "{room_at_cap} {room}. Une perte de temps que de vous le dire."],
    friendly: ["J'étais tranquillement {room_at} {room}. Une soirée plutôt calme, jusqu'à maintenant.", "Oh, j'étais {room_at} {room}. Vous voulez un café, inspecteur ?"],
    mysterious: ["Les ombres {room_at_de} {room} m'ont tenu compagnie.", "Disons simplement que {room} était mon refuge."],
    aggressive: ["C'est quoi ces questions ? J'étais {room_at} {room}, point barre !", "{room_at_cap} {room}. Et si ça vous plaît pas, c'est la même chose !"],
    timid: ["Je... j'étais {room_at} {room}. S'il vous plaît, ne criez pas.", "{room_at_cap} {room}, tout seul. Je ne voulais déranger personne."]
  },
  victim: {
    friend: ["C'était un bon ami... Je n'arrive pas à y croire.", "Le monde est plus sombre sans {victim}."],
    enemy: ["Je ne vais pas pleurer sa disparition. On récolte ce que l'on sème.", "{victim} a eu ce qu'il méritait, finalement."],
    lover: ["Mon cœur s'est brisé en même temps que sa vie...", "Nous avions des projets... Tout est fini."],
    colleague: ["Un partenaire de travail efficace. C'est regrettable.", "Le bureau va se sentir vide sans {victim}."],
    stranger: ["Je ne connaissais pas vraiment cette personne.", "Une tragédie, certes, mais je n'avais aucun lien avec {victim}."],
    rival: ["C'était un adversaire redoutable. Je respectais au moins son ambition.", "La compétition s'arrête de façon brutale."],
    debtor: ["Il me devait encore de l'argent ! Quel gâchis...", "Mes dettes sont-elles effacées avec sa mort ?"]
  },
  suspect: {
    friend: ["C'est un bon ami à moi, quelqu'un de fiable.", "{target} ? Un type bien. On se connaît depuis les années folles."],
    enemy: ["Je ne lui fais pas confiance. Un serpent, si vous voulez mon avis.", "Restez loin de {target}. C'est une crapule de la pire espèce."],
    lover: ["C'est... personnel. Disons simplement qu'on est très proches.", "Je n'ai pas envie de parler de mes sentiments pour {target}."],
    colleague: ["On travaille ensemble. Un employé efficace, rien de plus.", "On partage les mêmes bureaux. On ne se parle pas beaucoup."],
    stranger: ["Je l'ai déjà vu traîner par ici, mais on ne s'est jamais parlé.", "Je ne sais rien sur cette personne. Un visage dans la foule."],
    rival: ["C'est un concurrent. On ne s'apprécie pas vraiment.", "{target} essaie toujours de marcher sur mes plates-bandes."],
    debtor: ["Il me doit un paquet de fric. J'espère qu'il ne va pas lui arriver malheur.", "Toujours à demander des faveurs, celui-là."]
  }
};

export const NOIR_ROOMS: Room[] = [
  { 
    id: 'office', 
    name: 'Bureau du Patron', 
    shortName: 'Bureau du Patron', 
    preposition: 'dans le', 
    description: 'Un bureau luxueux avec une odeur de cigare.',
    x: 10, y: 10, width: 30, height: 30,
    descriptions: {
        normal: ['Le bureau est parfaitement rangé. Une lampe de bureau éclaire faiblement quelques dossiers.'],
        strange: ['Quelques tiroirs ont été laissés entrouverts. Rien ne semble manquer, mais c\'est inhabituel.'],
        suspect: ['Le bureau est en désordre. Des papiers sont éparpillés au sol et une chaise est renversée.']
    }
  },
  { 
    id: 'bar', 
    name: 'Le Speakeasy', 
    shortName: 'Speakeasy', 
    preposition: 'au', 
    description: "L'ambiance est tamisée, la musique de jazz remplit l'air.",
    x: 40, y: 10, width: 50, height: 40,
    descriptions: {
        normal: ['Les clients discutent à voix basse. Le barman essuie un verre proprement.'],
        strange: ['Une bouteille de whisky coûteuse est restée ouverte sur une table vide.'],
        suspect: ['Il y a des éclats de verre derrière le comptoir et une tache sombre sur le tapis qui ne ressemble pas à du vin.']
    }
  },
  { 
    id: 'alley', 
    name: 'Ruelle Sombre', 
    shortName: 'Ruelle Sombre', 
    preposition: 'dans la', 
    description: "Il pleut, et l'odeur des poubelles est forte.",
    x: 10, y: 40, width: 30, height: 50,
    descriptions: {
        normal: ['Quelques cartons mouillés s\'entassent dans un coin. La pluie tambourine sur le métal.'],
        strange: ['Une ombre s\'enfuit à votre approche. Probablement juste un rat.'],
        suspect: ['Des traces de lutte sont visibles dans la boue. Une poubelle a été violemment déplacée.']
    }
  },
  { 
    id: 'backstage', 
    name: 'Les Loges', 
    shortName: 'Loges', 
    preposition: 'dans les', 
    description: "Des costumes et du maquillage traînent partout.",
    x: 60, y: 50, width: 30, height: 40,
    descriptions: {
        normal: ['L\'odeur du parfum et de la poudre est entêtante. Les miroirs reflètent la lumière des ampoules.'],
        strange: ['Une robe de scène a été jetée à la hâte sur un paravent.'],
        suspect: ['Un miroir est fêlé. De la poudre de maquillage recouvre une trace de pas suspecte.']
    }
  },
  { 
    id: 'kitchen', 
    name: 'La Cuisine', 
    shortName: 'Cuisine', 
    preposition: 'dans la', 
    description: 'Couteaux bien aiguisés et casseroles en cuivre.',
    x: 40, y: 50, width: 20, height: 30,
    descriptions: {
        normal: ['Les cuivres brillent sur les murs. Une odeur de sauce tomate s\'échappe d\'une marmite.'],
        strange: ['Le frigo ronronne bruyamment. Quelqu\'un a laissé une flaque d\'eau au sol.'],
        suspect: ['De l\'eau bout encore dans une casserole oubliée. Un couteau manque au râtelier mural.']
    }
  }
];

export const NOIR_ITEMS: Item[] = [
  { 
    id: 'revolver', name: 'Revolver .38', isWeapon: true, canBeMurderWeapon: true,
    description: 'Un classique du genre.',
    descriptions: {
        normal: ['L\'arme est bien entretenue et le canon est froid.'],
        strange: ['Le cran de sûreté n\'est pas enclenché. C\'est imprudent.'],
        suspect: ['L\'odeur de la poudre est encore fraîche. Une balle manque dans le barillet.']
    }
  },
  { 
    id: 'knife', name: 'Couteau de cuisine', isWeapon: true, canBeMurderWeapon: true,
    description: 'Tranchant et efficace.',
    descriptions: {
        normal: ['Un simple couteau de cuisine, utile pour couper les oignons.'],
        strange: ['Le couteau semble avoir été utilisé récemment pour autre chose que de la cuisine.'],
        suspect: ['La lame est propre, trop propre. Comme si elle venait d\'être récurée.']
    }
  },
  { 
    id: 'poison', name: 'Fiole de Cyanure', isWeapon: true, canBeMurderWeapon: true,
    description: 'Discret mais mortel.',
    descriptions: {
        normal: ['Une petite fiole étiquetée "Poison", scellée par la pharmacie.'],
        strange: ['L\'étiquette de la fiole est légèrement déchirée.'],
        suspect: ['Le bouchon n\'est pas bien scellé. Quelques gouttes de liquide incolore perlent sur le verre.']
    }
  },
  { id: 'lighter', name: 'Briquet en argent', description: "Gravé avec des initiales.", isWeapon: false, canBeMurderWeapon: false, 
    descriptions: {
        normal: ['Un briquet élégant qui fonctionne parfaitement.'],
        strange: ['Le briquet est chaud au toucher.'],
        suspect: ['Le briquet porte des traces de sang séché sur le capot.']
    }
  },
  { id: 'letter', name: 'Lettre de chantage', description: "Des menaces à peine voilées.", isWeapon: false, canBeMurderWeapon: false,
    descriptions: {
        normal: ['Une lettre écrite à la main, demandant une rançon.'],
        strange: ['Le papier est froissé et semble avoir été arraché à un carnet.'],
        suspect: ['La lettre mentionne explicitement le nom du tueur par erreur.']
    }
  }
];

export const NOIR_MOTIVES: string[] = [
  'Vengeance pour une trahison passée.',
  'Dettes de jeu impayées.',
  'Jalousie amoureuse.',
  'Tentative de protéger un secret compromettant.',
  'Héritage disputé.'
];
