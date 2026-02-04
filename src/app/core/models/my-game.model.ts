import { Game } from "./game.model";
import { Platform } from "./platform.model";
import { Source } from "./source.model";

export type MyGameStatus = 
  | 'NOT_PLAYED' 
  | 'PLAYING' 
  | 'COMPLETED' 
  | 'ABANDONED' 
  | 'ON_HOLD' 
  | 'WISHLIST';

export interface MyGame {
  id?: number;
  user_id?: number;
  game_id: number;
  platform_id: number;
  source_id: number;
  status: MyGameStatus;
  
  // Campos opcionais para exibição
  game?: Game;
  platform?: Platform;
  source?: Source;
}

export const MY_GAME_STATUS_OPTIONS: { value: MyGameStatus; label: string }[] = [
  { value: 'NOT_PLAYED', label: 'não jogado' },
  { value: 'PLAYING', label: 'jogando' },
  { value: 'COMPLETED', label: 'completo' },
  { value: 'ABANDONED', label: 'abandonado' },
  { value: 'ON_HOLD', label: 'em espera' },
  { value: 'WISHLIST', label: 'lista de desejos' }
];