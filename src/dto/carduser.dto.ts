import { IsDefined, IsUUID } from "class-validator";

export class CardUser {
  @IsUUID()
  @IsDefined()
  userId: string;

  @IsUUID()
  @IsDefined()
  cardId: string;
}
