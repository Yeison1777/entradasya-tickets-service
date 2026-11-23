import { IsString, Length, Matches } from 'class-validator';

export class ValidateTicketDto {
  @IsString()
  @Length(32, 64)
  @Matches(/^[A-Za-z0-9_-]+$/)
  code!: string;
}
