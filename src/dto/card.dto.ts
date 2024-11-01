import { IsAlpha, IsDefined, IsDate, Length, IsUUID, IsDateString } from "class-validator";

export class Card {
  @IsAlpha()
  @IsDefined()
  @Length(5, 30)
  titulo: string;

  @IsDefined()
  @Length(20, 50)
  descripcion: string;

  @IsDateString()
  fecha_tope: Date;

  @IsUUID()
  @IsDefined()
  listId: string;

  @IsDefined()
  @IsUUID()
  adminUserId: string;
}