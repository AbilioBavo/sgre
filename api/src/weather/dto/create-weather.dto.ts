import { IsEnum, IsNumber, IsString } from 'class-validator';

export class CreateWeatherDto {
  @IsString()
  zone!: string;

  @IsNumber()
  rainfall!: number;

  @IsNumber()
  windSpeed!: number;

  @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
  riskLevel!: 'LOW' | 'MEDIUM' | 'HIGH';
}
