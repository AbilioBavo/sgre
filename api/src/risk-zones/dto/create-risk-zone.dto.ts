import { IsEnum, IsNotEmpty, IsObject, IsString } from 'class-validator';

export class CreateRiskZoneDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
  riskLevel!: 'LOW' | 'MEDIUM' | 'HIGH';

  // GeoJSON Polygon
  @IsObject()
  area!: Record<string, unknown>;
}
