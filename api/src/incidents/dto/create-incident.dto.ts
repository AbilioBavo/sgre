import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { IncidentType } from '../incidents.types';

export class CreateIncidentDto {
  @IsEnum(IncidentType)
  type: IncidentType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  severity?: number;

  @IsOptional()
  @IsString()
  userId?: string;
}
