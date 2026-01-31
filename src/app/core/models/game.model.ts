import { Company } from "./company.model";
import { Genre } from "./genre.model";
import { Theme } from "./theme.model";

export interface Game {
  id?: number;
  title: string;
  description: string;
  released_at: string; // ISO date format: YYYY-MM-DD
  company_id: number;
  genre_ids: number[];
  theme_ids: number[];
  
  // Campos opcionais para exibição
  company?: Company;
  genres?: Genre[];
  themes?: Theme[];
}