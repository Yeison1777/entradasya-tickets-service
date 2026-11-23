import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class IssueTicketsDto {
  @IsUUID() orderId!: string;
  @IsUUID() customerId!: string;
  @IsUUID() eventId!: string;
  @IsUUID() sectorId!: string;
  @IsInt() @Min(1) @Max(6) quantity!: number;
}
