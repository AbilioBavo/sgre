import {
  ArrayMaxSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class ComputeRouteDto {
  @IsNumber()
  startLat!: number;

  @IsNumber()
  startLng!: number;

  // Se omitido, busca-se os abrigos OPEN mais próximos
  @IsOptional()
  @IsUUID()
  shelterId?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  // Opcional: forçar destino arbitrário
  @IsOptional()
  @IsNumber()
  endLat?: number;

  @IsOptional()
  @IsNumber()
  endLng?: number;

  // Para recálculo: não escolher rotas com estes IDs
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  excludeRouteIds?: string[];
}
