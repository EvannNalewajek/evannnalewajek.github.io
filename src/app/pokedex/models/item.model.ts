export interface Item {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  category: string;
  usage: string;
  effet?: string | null;
  images: ItemImages;
  buy?: number | null;
  sell?: number | null;
}

export interface ItemImages {
  sprite: string;
  artwork: string;
}