import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateIncidentDto {
  @IsEnum(['FLOOD', 'BLOCKED_ROAD', 'ACCIDENT', 'FIRE', 'OTHER'])
  type!: 'FLOOD' | 'BLOCKED_ROAD' | 'ACCIDENT' | 'FIRE' | 'OTHER';

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  severity!: number;

  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;

  @IsOptional()
  @IsString()
  deviceId?: string;
}
