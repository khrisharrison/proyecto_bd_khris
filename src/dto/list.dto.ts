import { IsAlpha, IsDefined, IsUUID, Length } from "class-validator";

export class List {
  @IsAlpha()
  @IsDefined()
  @Length(5, 30)
  name: string;

  @IsUUID()
  @IsDefined()
  boardId: string;
}
