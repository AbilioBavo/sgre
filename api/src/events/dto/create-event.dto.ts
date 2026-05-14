import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateEventDto {
  @IsString()
  type!: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
