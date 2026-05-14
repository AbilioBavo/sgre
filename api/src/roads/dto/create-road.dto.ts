import { IsBoolean, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateRoadDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsEnum(['PRIMARY', 'SECONDARY', 'TERTIARY', 'DIRT'])
  type!: 'PRIMARY' | 'SECONDARY' | 'TERTIARY' | 'DIRT';

  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;

  @IsOptional()
  @IsEnum(['NORMAL', 'FLOODED', 'DAMAGED', 'BLOCKED'])
  condition?: 'NORMAL' | 'FLOODED' | 'DAMAGED' | 'BLOCKED';

  // GeoJSON LineString
  @IsObject()
  path!: Record<string, unknown>;
}
