import { StringToBoolean } from "class-variance-authority/types";

interface Weapon {
  id: string;
  weapon_id: number;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface Pattern {
  id: string;
  name: string;
}

interface Wear {
  id: string;
  name: string;
}

interface Style {
  id: number;
  name: string;
  url: string;
}

interface Crate {
  id: string;
  name: string;
  image: string;
}

interface Collection {
  id: string;
  name: string;
  image: string;
}
interface Rarity {
  id: string;
  name: string;
  color: string;
}

interface Team {
  id: string;
  name: string;
}

interface Skin {
  [key: string]: {
    id: string;
    skin_id: string;
    name: string;
    description: string;
    weapon: Weapon;
    category: Category;
    pattern: Pattern;
    min_float: number;
    max_float: number;
    wear: Wear;
    stattrak: boolean;
    souvenir: boolean;
    paint_index: string;
    paint_wear: number;
    rarity: Rarity;
    market_hash_name: string;
    team: Team;
    style: Style;
    legacy_model: boolean;
    image: string;
  }
}

export interface Sticker {
  [key: string]: {
    id: string;
    name: string;
    description: string;
    rarity: Rarity;
    crates: Crate[];
    tournament_event: string;
    tournament_team: string;
    type: string;
    market_hash_name: string;
    effect: string;
    image: string;
  }
}

export interface Agent {
  [key: string]: {
    id: string;
    name: string;
    description: string;
    rarity: Rarity;
    collections: Collection[];
    team: Team;
    market_hash_name: string;
    image: string;
    model_player: string;
  }
}

export type ItemData = Skin | Sticker | Agent;

export interface SkinItem {
    id: string;
    def_index: number;
    paint_seed: number;
    custom_name?: String;
    skin_id: string;
    name: string;
    description: string;
    weapon: Weapon;
    category: Category;
    pattern: Pattern;
    min_float: number;
    max_float: number;
    rarity: Rarity;
    stattrak: boolean;
    souvenir: boolean;
    paint_index: string;
    paint_wear: number;
    wears: Wear[];
    collections: Collection[];
    stickers?: Sticker[];
    crates: Crate[];
    team: Team;
    style: Style;
    legacy_model: boolean;
    image: string;
}

export interface SkinData {
  [key: string]: SkinItem;
}
