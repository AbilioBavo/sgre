import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateShelterDto {
  @IsString()
  name!: string;

  @IsInt()
  @Min(1)
  capacity!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  occupied?: number;

  @IsOptional()
  @IsEnum(['OPEN', 'FULL', 'CLOSED'])
  status?: 'OPEN' | 'FULL' | 'CLOSED';

  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;
}
